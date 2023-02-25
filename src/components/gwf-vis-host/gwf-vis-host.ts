import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { ref, createRef } from "lit/directives/ref.js";
import { when } from "lit/directives/when.js";
import leaflet from "leaflet";

import { obtainActualUrl } from "../../utils/url";
import importPlugin, {
  pluginNameAndTagNameMap,
} from "../../utils/import-plugin";

import type { MapView } from "../../utils/basic";
import type { GWFVisHostSidebar } from "../gwf-vis-host-sidebar/gwf-vis-host-sidebar";
import type {
  GWFVisHostConfig,
  PluginDefinition,
} from "../../utils/gwf-vis-host-config";
import type { GWFVisHostMainItemContainer } from "../gwf-vis-host-main-item-container/gwf-vis-host-main-item-container";
import type { GWFVisHostSidebarItemContainer } from "../gwf-vis-host-sidebar-item-container/gwf-vis-host-sidebar-item-container";
import type {
  GWFVisDataProviderPlugin,
  GWFVisPlugin,
  GWFVisPluginProps,
  GWFVisPluginWithSharedStates,
  LayerType,
  SharedStates,
} from "../../utils/plugin";

import styles from "./gwf-vis-host.css?inline";
import leafletStyles from "../../../node_modules/leaflet/dist/leaflet.css?inline";

@customElement("gwf-vis-host")
export class GWFVisHost extends LitElement {
  static styles = [css([leafletStyles] as any), css([styles] as any)];

  private initialized = false;
  private map?: leaflet.Map;
  private layerControl?: leaflet.Control.Layers;
  private sidebar?: leaflet.Control;
  private mapElementRef = createRef<HTMLDivElement>();
  private sidebarElement?: GWFVisHostSidebar;
  private hiddenPluginContainerRef = createRef<HTMLDivElement>();
  private pluginDefinitionAndInstanceMap = new Map<
    PluginDefinition,
    GWFVisPlugin
  >();
  private dataIdentifierAndProviderMap = new Map<
    string,
    GWFVisDataProviderPlugin<unknown, unknown>
  >();
  private pluginLoadingPool: boolean[] = [];
  private pluginSharedStates: SharedStates = {};

  @state() loadingActive: boolean = true;
  @state() private pluginLargePresenterContentInfo?: {
    header?: string;
    pluginInstance?: GWFVisPlugin;
    originalContainer?: HTMLElement | null;
  };

  @property() config?: GWFVisHostConfig;

  updated() {
    if (!this.initialized && this.config) {
      this.initialized = true;
      this.initializeVis();
    }
  }

  render() {
    return when(
      this.config,
      () => html`
        <div id="map" ${ref(this.mapElementRef)}></div>
        <div
          id="invisible-plugin-container"
          hidden
          ${ref(this.hiddenPluginContainerRef)}
        ></div>
        <div
          ?hidden=${!this.pluginLargePresenterContentInfo}
          id="large-plugin-presenter"
        >
          <div class="inner-container leaflet-control">
            <div class="header">
              ${this.pluginLargePresenterContentInfo?.header}
              <button
                class="close-button"
                @click=${this.dismissPluginLargePresenter}
              >
                🗙
              </button>
            </div>
            <div class="content">
              ${this.pluginLargePresenterContentInfo?.pluginInstance}
            </div>
          </div>
        </div>
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
      `,
      () =>
        html`<div
          style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);"
        >
          Waiting for config to be set...
        </div>`
    );
  }

  private async initializeVis() {
    if (!this.map && this.mapElementRef.value) {
      this.initializeMap(this.mapElementRef.value);
      this.initializeSidebar();
      await this.importPlugins();
      this.loadPlugins();
      this.loadingActive = false;
      this.applyToPlugins((pluginInstance) =>
        pluginInstance.hostFirstLoadedCallback?.()
      );
    }
  }

  private initializeMap(mapElement: HTMLElement) {
    this.map = leaflet.map(mapElement, {
      preferCanvas: this.config?.preferCanvas,
    });
    this.updateView(this.config?.view);
    this.initializeLayerControl();
    this.map.zoomControl.setPosition("topright");
  }

  private initializeSidebar() {
    this.sidebar?.remove();
    const SidebarControl = leaflet.Control.extend({
      onAdd: () => {
        this.sidebarElement = leaflet.DomUtil.create(
          "gwf-vis-host-sidebar"
        ) as GWFVisHostSidebar;
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
      for (const pluginDefinition of this.config?.plugins ?? []) {
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
    pluginInstance: GWFVisPlugin
  ) {
    switch (pluginDefinition.container) {
      case "hidden": {
        this.hiddenPluginContainerRef.value?.append(pluginInstance);
        break;
      }
      case "main": {
        const itemContainerElement = document.createElement(
          "gwf-vis-host-main-item-container"
        ) as GWFVisHostMainItemContainer;
        itemContainerElement.showContentInlargeViewCallback = (
          pluginInstance
        ) => this.presentPluginInLargeView(pluginInstance);
        itemContainerElement.header = pluginInstance.obtainHeaderCallback();
        itemContainerElement.containerProps = pluginDefinition.containerProps;
        itemContainerElement.append(pluginInstance);
        this.initializeMainContainerControl(itemContainerElement);
        break;
      }
      case "sidebar": {
        const itemContainerElement = document.createElement(
          "gwf-vis-host-sidebar-item-container"
        ) as GWFVisHostSidebarItemContainer;
        itemContainerElement.showContentInlargeViewCallback = (
          pluginInstance
        ) => this.presentPluginInLargeView(pluginInstance);
        itemContainerElement.header = pluginInstance.obtainHeaderCallback();
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
      ) as GWFVisPlugin;
      const propsToBeSet = {
        ...pluginDefinition.props,
        notifyLoadingDelegate: this.notifyPluginLoadingHandler,
        sharedStates: this.pluginSharedStates,
        updateSharedStatesDelegate: this.updatePluginSharedStatesHandler,
        leaflet,
        mapInstance: this.map,
        addMapLayerDelegate: this.addMapLayerHandler,
        removeMapLayerDelegate: this.removeMapLayerHandler,
        checkIfDataProviderRegisteredDelegate:
          this.checkIfDataProviderRegisteredHandler,
        queryDataDelegate: this.queryDataHandler,
      } as GWFVisPluginProps;
      Object.assign(pluginInstance, propsToBeSet);
      this.registerPluginAsDataProviderIfValid(pluginInstance);
      return pluginInstance;
    }
    return undefined;
  }

  private async importPlugins() {
    try {
      for (const [name, url] of Object.entries(this.config?.imports ?? {})) {
        const actualUrl = obtainActualUrl(
          url,
          this.config?.fileBasePath ?? "."
        );
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

  private applyToPlugins(callback: (pluginInstance: GWFVisPlugin) => void) {
    for (let pluginInstance of this.pluginDefinitionAndInstanceMap.values() ??
      []) {
      callback(pluginInstance);
    }
  }

  private registerPluginAsDataProviderIfValid(
    pluginInstance: Partial<GWFVisDataProviderPlugin<unknown, unknown>>
  ) {
    if (pluginInstance.obtainDataProviderIdentifiersCallback) {
      const identifiers =
        pluginInstance.obtainDataProviderIdentifiersCallback();
      identifiers?.forEach((identifier) => {
        if (this.dataIdentifierAndProviderMap.has(identifier)) {
          const errorMessage = `You cannot register multiple data providers for data identifier "${identifier}".`;
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
          pluginInstance as GWFVisDataProviderPlugin<unknown, unknown>
        );
      });
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
        ((pluginInstance as GWFVisPluginWithSharedStates).sharedStates =
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
      ?.queryDataCallback(identifier, dataSourceWithoutIdentifier, queryObject);
  };

  private presentPluginInLargeView(pluginInstance?: GWFVisPlugin) {
    if (this.pluginLargePresenterContentInfo) {
      return;
    }
    this.pluginLargePresenterContentInfo = {
      header: pluginInstance?.obtainHeaderCallback(),
      pluginInstance,
      originalContainer: pluginInstance?.parentElement,
    };
  }

  private dismissPluginLargePresenter() {
    this.pluginLargePresenterContentInfo?.originalContainer?.replaceChildren(
      this.pluginLargePresenterContentInfo?.pluginInstance ?? ""
    );
    this.pluginLargePresenterContentInfo = undefined;
  }
}
