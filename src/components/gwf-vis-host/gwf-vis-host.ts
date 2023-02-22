import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { ref, createRef } from "lit/directives/ref.js";
import { when } from "lit/directives/when.js";
import leaflet from "leaflet";

import { MapView } from "../../utils/basic";
import GwfVisHostSidebar from "../gwf-vis-host-sidebar/gwf-vis-host-sidebar";
import styles from "./gwf-vis-host.css?inline";
import leafletStyles from "../../../node_modules/leaflet/dist/leaflet.css?inline";
import { obtainActualUrl } from "../../utils/url";
import importPlugin, {
  pluginNameAndTagNameMap,
} from "../../utils/import-plugin";
import {
  GwfVisHostConfig,
  PluginDefinition,
} from "../../utils/gwf-vis-host-config";
import GwfVisHostMainItemContainer from "../gwf-vis-host-main-item-container/gwf-vis-host-main-item-container";
import GwfVisHostSidebarItemContainer from "../gwf-vis-host-sidebar-item-container/gwf-vis-host-sidebar-item-container";
import {
  GwfVisDataProviderPlugin,
  GwfVisPlugin,
  GwfVisPluginProps,
  GwfVisPluginWithSharedStates,
  LayerType,
  SharedStates,
} from "../../utils/plugin";

@customElement("gwf-vis-host")
export default class GwfVisHost extends LitElement implements GwfVisHostConfig {
  static styles = [css([leafletStyles] as any), css([styles] as any)];

  private map?: leaflet.Map;
  private layerControl?: leaflet.Control.Layers;
  private sidebar?: leaflet.Control;
  private mapElementRef = createRef<HTMLDivElement>();
  private sidebarElement?: GwfVisHostSidebar;
  private hiddenPluginContainerRef = createRef<HTMLDivElement>();
  private pluginDefinitionAndInstanceMap = new Map<
    PluginDefinition,
    GwfVisPlugin
  >();
  private dataIdentifierAndProviderMap = new Map<
    string,
    GwfVisDataProviderPlugin<unknown, unknown>
  >();
  private pluginLoadingPool: boolean[] = [];
  private pluginSharedStates: SharedStates = {};

  @state() loadingActive: boolean = true;

  @property() preferCanvas: boolean = false;
  @property() view?: MapView;
  @property() fileBasePath: string = ".";
  @property() imports?: { [name: string]: string };
  @property() plugins?: PluginDefinition[];

  firstUpdated() {
    this.initializeVis();
  }

  render() {
    return html`
      <div id="map" ${ref(this.mapElementRef)}></div>
      <div
        id="invisible-plugin-container"
        hidden
        ${ref(this.hiddenPluginContainerRef)}
      ></div>
      ${when(
        this.loadingActive,
        () => html`
          <div id="loading">
            <div class="leaflet-control leaflet-control-layers inner">
              <div class="spinner"></div>
            </div>
          </div>
        `
      )}
    `;
  }

  private async initializeVis() {
    if (!this.map && this.mapElementRef.value) {
      this.initializeMap(this.mapElementRef.value);
      this.initializeSidebar();
      await this.importPlugins();
      this.loadPlugins();
      this.loadingActive = false;
      this.applyToPlugins((pluginInstance) =>
        pluginInstance.hostFirstLoadedHandler?.()
      );
    }
  }

  private initializeMap(mapElement: HTMLElement) {
    this.map = leaflet.map(mapElement, { preferCanvas: this.preferCanvas });
    this.updateView(this.view);
    this.initializeLayerControl();
    this.map.zoomControl.setPosition("topright");
  }

  private initializeSidebar() {
    this.sidebar?.remove();
    const SidebarControl = leaflet.Control.extend({
      onAdd: () => {
        this.sidebarElement = leaflet.DomUtil.create(
          "gwf-vis-host-sidebar"
        ) as GwfVisHostSidebar;
        this.sidebarElement.classList.add("leaflet-control-layers");
        this.stopEventPropagationToTheMapElement(this.sidebarElement);
        return this.sidebarElement;
      },
    });
    this.sidebar = new SidebarControl({ position: "topleft" });
    this.map?.addControl(this.sidebar);
  }

  private initializeMainContainerControl(element: HTMLElement) {
    const customControl = leaflet.Control.extend({
      onAdd: () => {
        element.classList.add("leaflet-control-layers");
        this.stopEventPropagationToTheMapElement(element);
        return element;
      },
    });
    const customControlInstance = new customControl({
      position: "bottomright",
    });
    // TODO may add the instance to a dict or map
    this.map?.addControl(customControlInstance);
  }

  private initializeLayerControl() {
    this.layerControl?.remove();
    this.layerControl = leaflet.control.layers();
    this.map?.addControl(this.layerControl);
  }

  private loadPlugins() {
    try {
      for (const pluginDefinition of this.plugins ?? []) {
        this.loadPlugin(pluginDefinition);
      }
    } catch (e: any) {
      alert(e?.message ?? "Fail to load the plugins.");
      throw e;
    }
  }

  private loadPlugin(pluginDefinition: PluginDefinition) {
    const pluginInstance = this.createPluginInstance(pluginDefinition);
    if (pluginInstance) {
      this.assignPluginInstanceIntoContainer(pluginDefinition, pluginInstance);
      this.pluginDefinitionAndInstanceMap.set(pluginDefinition, pluginInstance);
    }
  }

  private assignPluginInstanceIntoContainer(
    pluginDefinition: PluginDefinition,
    pluginInstance: GwfVisPlugin
  ) {
    switch (pluginDefinition.container) {
      case "hidden": {
        this.hiddenPluginContainerRef.value?.append(pluginInstance);
        break;
      }
      case "main": {
        const itemContainerElement = document.createElement(
          "gwf-vis-host-main-item-container"
        ) as GwfVisHostMainItemContainer;
        itemContainerElement.header = pluginInstance.obtainHeader();
        itemContainerElement.containerProps = pluginDefinition.containerProps;
        itemContainerElement.append(pluginInstance);
        this.initializeMainContainerControl(itemContainerElement);
        break;
      }
      case "sidebar": {
        const itemContainerElement = document.createElement(
          "gwf-vis-host-sidebar-item-container"
        ) as GwfVisHostSidebarItemContainer;
        itemContainerElement.header = pluginInstance.obtainHeader();
        itemContainerElement.containerProps = pluginDefinition.containerProps;
        itemContainerElement.append(pluginInstance);
        this.sidebarElement?.append(itemContainerElement);
        break;
      }
      default:
        break;
    }
  }

  private createPluginInstance(pluginDefinition: PluginDefinition) {
    const pluginTagName = pluginNameAndTagNameMap.get(pluginDefinition.import);
    if (pluginTagName) {
      const pluginInstance = document.createElement(
        pluginTagName
      ) as GwfVisPlugin;
      const propsToBeSet = {
        ...pluginDefinition.props,
        notifyLoadingCallback: this.notifyPluginLoadingHandler,
        sharedStates: this.pluginSharedStates,
        updateSharedStatesCallback: this.updatePluginSharedStatesHandler,
        leaflet,
        mapInstance: this.map,
        addMapLayerCallback: this.addMapLayerHandler,
        removeMapLayerCallback: this.removeMapLayerHandler,
        checkIfDataProviderRegisteredCallback:
          this.checkIfDataProviderRegisteredHandler,
        queryDataCallback: this.queryDataHandler,
      } as GwfVisPluginProps;
      Object.assign(pluginInstance, propsToBeSet);
      this.registerPluginAsDataProviderIfValid(pluginInstance);
      return pluginInstance;
    }
    return undefined;
  }

  private async importPlugins() {
    try {
      for (const [name, url] of Object.entries(this.imports ?? {})) {
        const actualUrl = obtainActualUrl(url, this.fileBasePath);
        await importPlugin(name, actualUrl);
      }
    } catch (e: any) {
      alert(e?.message ?? "Fail to import the plugins.");
      throw e;
    }
  }

  private updateView(view?: MapView) {
    this.map?.setView(view?.center || [0, 0], view?.zoom || 0, view?.options);
  }

  private stopEventPropagationToTheMapElement(element: HTMLElement) {
    element.addEventListener("mouseover", () => {
      if (!document.body.classList.contains("leaflet-dragging")) {
        this.map?.dragging.disable();
      }
      this.map?.scrollWheelZoom.disable();
      this.map?.doubleClickZoom.disable();
    });
    element.addEventListener("mouseup", () => {
      if (this.map?.dragging.enabled()) {
        this.map?.dragging.disable();
      }
    });
    element.addEventListener("mouseout", () => {
      this.map?.dragging.enable();
      this.map?.scrollWheelZoom.enable();
    });
  }

  private updateLoadingStatus() {
    if (this.pluginLoadingPool.some((item) => item)) {
      this.loadingActive = true;
    } else {
      this.loadingActive = false;
    }
  }

  private applyToPlugins(callback: (pluginInstance: GwfVisPlugin) => void) {
    for (let pluginInstance of this.pluginDefinitionAndInstanceMap.values() ??
      []) {
      callback(pluginInstance);
    }
  }

  private registerPluginAsDataProviderIfValid(
    pluginInstance: Partial<GwfVisDataProviderPlugin<unknown, unknown>>
  ) {
    if (pluginInstance.obtainDataProviderIdentifier) {
      const identifier = pluginInstance.obtainDataProviderIdentifier();
      if (this.dataIdentifierAndProviderMap.has(identifier)) {
        const errorMessage = `You cannot register multiple data provider for data identifier "${identifier}".`;
        alert(errorMessage);
        throw Error(errorMessage);
      }
      if (!identifier) {
        const errorMessage = `The data identifier for the data provider is not valid.`;
        alert(errorMessage);
        throw Error(errorMessage);
      }
      this.dataIdentifierAndProviderMap.set(
        identifier,
        pluginInstance as GwfVisDataProviderPlugin<unknown, unknown>
      );
    }
  }

  private notifyPluginLoadingHandler = () => {
    let index = this.pluginLoadingPool.findIndex(
      (item) => typeof item === "undefined"
    );
    if (index < 0) {
      index = this.pluginLoadingPool.length;
    }
    this.pluginLoadingPool[index] = true;
    this.updateLoadingStatus();
    return () => {
      delete this.pluginLoadingPool[index];
      this.updateLoadingStatus();
    };
  };

  private updatePluginSharedStatesHandler = (sharedStates: SharedStates) => {
    this.pluginSharedStates = sharedStates;
    this.applyToPlugins(
      (pluginInstance) =>
        ((pluginInstance as GwfVisPluginWithSharedStates).sharedStates =
          this.pluginSharedStates)
    );
  };

  private addMapLayerHandler = (
    layer: leaflet.Layer,
    name: string,
    type: LayerType,
    active: boolean = false
  ) => {
    if (this.layerControl) {
      switch (type) {
        case "base-layer":
          this.layerControl.addBaseLayer(layer, name);
          break;
        case "overlay":
          this.layerControl.addOverlay(layer, name);
          break;
      }
    }
    if (active) {
      this.map?.addLayer(layer);
    }
  };

  private removeMapLayerHandler = (layer: leaflet.Layer) => {
    if (layer) {
      this.layerControl?.removeLayer(layer);
      layer.remove();
    }
  };

  private checkIfDataProviderRegisteredHandler = (identifier: string) =>
    this.dataIdentifierAndProviderMap.has(identifier);

  private queryDataHandler = (dataSource: string, queryObject: unknown) => {
    let [identifier, dataSourceWithoutIdentifier] = dataSource.split(/:(.+)/);
    return this.dataIdentifierAndProviderMap
      .get(identifier)
      ?.queryData(dataSourceWithoutIdentifier, queryObject);
  };
}
