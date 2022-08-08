import { Component, Host, h, ComponentInterface, Prop, Watch, State } from '@stencil/core';
import leaflet from 'leaflet';

export type MapView = {
  center: leaflet.LatLngExpression;
  zoom?: number;
  options?: leaflet.ZoomPanOptions;
};

export type PluginDefinition = {
  url: string;
  for?: 'sidebar' | 'main';
  slot?: string;
  props?: any;
};

export type GlobalInfoDict = {
  [key: string]: any;
};

@Component({
  tag: 'gwf-vis-host',
  styleUrl: 'gwf-vis-host.css',
  shadow: true,
})
export class GwfVisHost implements ComponentInterface {
  private mapElement: HTMLDivElement;
  private invisiblePluginContainer: HTMLDivElement;
  private map: leaflet.Map;
  private sidebar: leaflet.Control;
  private sidebarElement: HTMLGwfVisHostSidebarElement;
  private layerControl: leaflet.Control.Layers;
  private dataPluginInstance: HTMLElement;
  private pluginUrlAndModuleMap = new Map<string, any>();
  private pluginMap = new Map<PluginDefinition, { class: any; instance: HTMLElement }>();
  private globalInfoDict: GlobalInfoDict;

  @State() loadingActive = true;

  @Prop() plugins: PluginDefinition[];
  @Prop() preferCanvas: boolean = true;

  @Prop() view: MapView;

  @Watch('view')
  handleViewChange(view: MapView) {
    this.map?.setView(view?.center || [0, 0], view?.zoom || 0, view?.options);
  }

  componentDidLoad() {
    this.initialize();
  }

  render() {
    return (
      <Host>
        <div id="map" ref={el => (this.mapElement = el)}></div>
        <div id="invisible-plugin-container" hidden ref={el => (this.invisiblePluginContainer = el)}></div>
        {this.loadingActive && (
          <div id="loading" class="leaflet-control leaflet-control-layers">
            Loading...
          </div>
        )}
      </Host>
    );
  }

  private async initialize() {
    if (!this.map) {
      await this.initializeMap();
      await this.initializeSidebar();
      await this.loadPlugins();
      this.loadingActive = false;
    }
  }

  private async initializeMap() {
    this.map = leaflet.map(this.mapElement, { preferCanvas: this.preferCanvas });
    this.handleViewChange(this.view);
    await this.initializeLayerControl();
    this.map.zoomControl.setPosition('topright');
  }

  private async initializeSidebar() {
    this.sidebar?.remove();
    const sidebarControl = leaflet.Control.extend({
      onAdd: () => {
        this.sidebarElement = leaflet.DomUtil.create('gwf-vis-host-sidebar');
        this.sidebarElement.classList.add('leaflet-control-layers');
        this.stopEventPropagationToTheMapElement(this.sidebarElement);
        this.sidebarElement.visHost = this;
        return this.sidebarElement;
      },
    });
    this.sidebar = new sidebarControl({ position: 'topleft' });
    this.addControlToMap(this.sidebar);
  }

  private async initializeCustomControl(element: HTMLElement) {
    const customControl = leaflet.Control.extend({
      onAdd: () => {
        element.classList.add('leaflet-control-layers');
        this.stopEventPropagationToTheMapElement(element);
        return element;
      },
    });
    const customControlInstance = new customControl({ position: 'bottomright' });
    // TODO may add the instance to a dict or map
    this.addControlToMap(customControlInstance);
  }

  private async loadPlugins() {
    for (const plugin of this.plugins) {
      await this.loadPlugin(plugin);
    }
  }

  private async loadPlugin(plugin: PluginDefinition) {
    try {
      let pluginModule = this.pluginUrlAndModuleMap.get(plugin.url);
      if (!pluginModule) {
        pluginModule = await import(plugin.url);
        this.pluginUrlAndModuleMap.set(plugin.url, pluginModule);
      }
      const pluginClass = Object.values(pluginModule).find(something => something?.['__PLUGIN_TAG_NAME__']);
      const pluginTagName = pluginClass?.['__PLUGIN_TAG_NAME__'];
      this.definePlugin(pluginTagName, pluginClass as any);
      const pluginInstance = document.createElement(pluginTagName);
      this.assignProps(pluginInstance, {
        ...plugin.props,
        leaflet,
        addingToMapDelegate: this.addLayer,
        removingFromMapDelegate: this.removeLayer,
        fetchingDataDelegate: this.fetchData,
        globalInfoDict: this.globalInfoDict,
        updatingGlobalInfoDelegate: this.updateGlobalInfoDict,
      });
      switch (pluginClass?.['__PLUGIN_TYPE__']) {
        case 'data':
          if (this.dataPluginInstance) {
            alert('There could be only one "data plugin".');
            throw new Error('There could be only one data plugin.');
          } else {
            this.dataPluginInstance = pluginInstance;
          }
        case 'layer':
          this.invisiblePluginContainer?.append(pluginInstance);
          break;
        case 'control':
          switch (plugin?.for) {
            case 'main':
              {
                const itemContainerElement = document.createElement('gwf-vis-host-main-item-container');
                itemContainerElement.header = await pluginInstance.obtainHeader();
                itemContainerElement.append(pluginInstance);
                await this.initializeCustomControl(itemContainerElement);
              }
              break;
            case 'sidebar':
              {
                const itemContainerElement = document.createElement('gwf-vis-host-sidebar-item-container');
                itemContainerElement.header = await pluginInstance.obtainHeader();
                itemContainerElement.pluginSlot = plugin.slot;
                itemContainerElement.append(pluginInstance);
                this.sidebarElement?.append(itemContainerElement);
              }
              break;
          }
          break;
      }
      this.pluginMap.set(plugin, { class: pluginClass, instance: pluginInstance });
    } catch (e) {
      alert('Plugin fails to be loaded.');
      throw e;
    }
  }

  private async initializeLayerControl() {
    this.layerControl = leaflet.control.layers();
    this.addControlToMap(this.layerControl);
  }

  private definePlugin(tagName: string, plugin: CustomElementConstructor) {
    if (!customElements.get(tagName)) {
      customElements.define(tagName, plugin);
    }
  }

  private assignProps(target: any, source: any) {
    Object.entries(source || {}).forEach(([key, value]) => (target[key] = value));
  }

  private stopEventPropagationToTheMapElement(element: HTMLElement) {
    element.addEventListener('mouseover', () => {
      this.map.dragging.disable();
      this.map.scrollWheelZoom.disable();
    });
    element.addEventListener('mouseout', () => {
      this.map.dragging.enable();
      this.map.scrollWheelZoom.enable();
    });
  }

  private addControlToMap = async (control: leaflet.Control) => {
    control.addTo(this.map);
  };

  private addLayer = async (layer: leaflet.Layer, name: string, type: 'base-layer' | 'overlay', active = false) => {
    if (this.layerControl) {
      switch (type) {
        case 'base-layer':
          this.layerControl.addBaseLayer(layer, name);
          break;
        case 'overlay':
          this.layerControl.addOverlay(layer, name);
          break;
      }
    }
    if (active) {
      layer.addTo(this.map);
    }
  };

  private removeLayer = (layer: leaflet.Layer) => {
    if (layer) {
      this.layerControl?.removeLayer(layer);
      layer.remove();
    }
  };

  private updateGlobalInfoDict = (globalInfoDict: GlobalInfoDict) => {
    this.globalInfoDict = globalInfoDict;
    this.pluginMap.forEach(({ instance }) => ((instance as any).globalInfoDict = this.globalInfoDict));
  };

  private fetchData = async (query: any) => {
    return await (this.dataPluginInstance as any)?.fetchData(query);
  };
}
