import { Component, Host, h, ComponentInterface, Prop, Watch } from '@stencil/core';
import leaflet from 'leaflet';

export type MapView = { center: leaflet.LatLngExpression; zoom?: number; options?: leaflet.ZoomPanOptions };

export type PluginDefinition = {
  url: string;
  props?: any;
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
  private layerControl: leaflet.Control.Layers;
  private pluginMap: Map<PluginDefinition, { class: any; instance: HTMLElement }>;

  @Prop() plugins: PluginDefinition[];

  @Prop() preferCanvas: boolean = true;

  @Prop() view: MapView = { center: [51.312588, -116.021118], zoom: 10 };

  @Watch('view')
  handleViewChange(view: MapView) {
    this.map?.setView(view?.center, view?.zoom, view?.options);
  }

  componentDidLoad() {
    this.initialize();
  }

  render() {
    return (
      <Host>
        <div id="map" ref={el => (this.mapElement = el)}></div>
        <div id="invisible-plugin-container" hidden ref={el => (this.invisiblePluginContainer = el)}></div>
      </Host>
    );
  }

  private async initialize() {
    if (!this.map) {
      await this.initializeMap();
      await this.loadPlugins();
    }
  }

  private async initializeMap() {
    this.map = leaflet.map(this.mapElement, { preferCanvas: this.preferCanvas });
    this.handleViewChange(this.view);
    this.initializeLayerControl();
  }

  private async loadPlugins() {
    this.pluginMap = new Map();
    this.plugins?.forEach(plugin => this.loadPlugin(plugin));
  }

  private async loadPlugin(plugin: PluginDefinition) {
    try {
      const pluginModule = await import(plugin.url);
      const pluginClass = Object.values(pluginModule).find(something => something?.['__PLUGIN_TAG_NAME__']);
      const pluginTagName = pluginClass?.['__PLUGIN_TAG_NAME__'];
      this.definePlugin(pluginTagName, pluginClass as any);
      const pluginInstance = document.createElement(pluginTagName);
      this.assignProps(pluginInstance, { ...plugin.props, leaflet, addToMapDelegate: this.addLayer });
      switch (pluginClass?.['__PLUGIN_FOR__']) {
        case 'layer':
          this.invisiblePluginContainer?.append(pluginInstance);
          break;
      }
      this.pluginMap.set(plugin.props, { class: pluginClass, instance: pluginInstance });
    } catch {
      console.warn('Plugin fails to be loaded.');
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

  private addControlToMap = async (control: leaflet.Control) => {
    control.addTo(this.map);
  };

  private assignProps(target: any, source: any) {
    Object.entries(source || {}).forEach(([key, value]) => (target[key] = value));
  }
}
