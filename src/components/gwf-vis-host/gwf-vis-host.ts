import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ref } from "lit/directives/ref.js";
import leaflet from "leaflet";

import { MapView } from "../../utils/basic";
import styles from "./gwf-vis-host.css?inline";
import leafletStyles from "../../../node_modules/leaflet/dist/leaflet.css?inline";

@customElement("gwf-vis-host")
export default class GwfVisHost extends LitElement {
  static styles = [css([leafletStyles] as any), css([styles] as any)];

  private map?: leaflet.Map;
  private layerControl?: leaflet.Control.Layers;

  @property() preferCanvas: boolean = false;
  @property() view?: MapView;

  render() {
    return html`
      <div
        id="map"
        ${ref((el) => this.initializeVis(el as HTMLDivElement))}
      ></div>
    `;
  }

  private initializeVis(mapElement?: HTMLElement) {
    if (!this.map && mapElement) {
      this.initializeMap(mapElement);
    }
  }

  private initializeMap(mapElement: HTMLElement) {
    this.map = leaflet.map(mapElement, { preferCanvas: this.preferCanvas });
    this.updateView(this.view);
    this.initializeLayerControl();
    this.map.zoomControl.setPosition("topright");
  }

  private initializeLayerControl() {
    this.layerControl?.remove();
    this.layerControl = leaflet.control.layers();
    this.map?.addControl(this.layerControl);
  }

  private updateView(view?: MapView) {
    this.map?.setView(view?.center || [0, 0], view?.zoom || 0, view?.options);
  }
}
