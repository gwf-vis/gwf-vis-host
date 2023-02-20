import type leaflet from "leaflet";
import type {
  GwfVisPlugin,
  GwfVisPluginWithSharedStates,
  GwfVisMapPlugin,
  SharedStates,
  LayerType,
} from "../utils/plugin";

export default class
  extends HTMLElement
  implements GwfVisPlugin, GwfVisPluginWithSharedStates, GwfVisMapPlugin
{
  obtainHeader = () => `Sample Plugin (${this.layerName ?? ""})`;

  notifyLoadingCallback!: () => () => void;

  #sharedStates?: SharedStates;
  set sharedStates(value: SharedStates) {
    this.#sharedStates = value;
    this.renderUI();
  }

  updateSharedStatesCallback!: (sharedStates: SharedStates) => void;

  layerName: string = "sample";
  layerType: LayerType = "base-layer";
  active: boolean = false;
  urlTemplate: string = "";
  options?: leaflet.TileLayerOptions;

  #tileLayerInstance?: leaflet.TileLayer;

  leaflet!: typeof leaflet;

  mapInstance!: leaflet.Map;

  addMapLayerCallback!: (
    layer: leaflet.Layer,
    name: string,
    type: LayerType,
    active?: boolean
  ) => void;

  removeMapLayerCallback!: (layer: leaflet.Layer) => void;

  connectedCallback() {
    this.initializePlugin();
  }

  disconnectedCallback() {
    this.#tileLayerInstance &&
      this.removeMapLayerCallback(this.#tileLayerInstance);
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  private renderUI() {
    this.shadowRoot &&
      (this.shadowRoot.innerHTML = /* html */ `
      <div 
        style="min-height: 30rem; width: 100%; padding: 10px; box-sizing: border-box;"
      >
        <label for="timeout-input">What is the timeout of the loading?</label>
        <input id="timeout-input" type="number" value="2000"/>
        <button id="mock-loading-button">Click me to mock a loading</button>
        <hr/>
        <span>${this.#sharedStates?.["sample-plugin.time"] ?? "N/A"}</span>
        <br/>
        <button id="update-shared-states-button">Update shared states</button>
      </div>
    `);
    this.shadowRoot
      ?.querySelector("#mock-loading-button")
      ?.addEventListener("click", () => {
        const loadingEndCallback = this.notifyLoadingCallback();
        const loadingTimeout = +(
          this.shadowRoot?.querySelector("#timeout-input") as HTMLInputElement
        )?.value;
        setTimeout(() => {
          loadingEndCallback();
        }, loadingTimeout);
      });
    this.shadowRoot
      ?.querySelector("#update-shared-states-button")
      ?.addEventListener("click", () =>
        this.updateSharedStatesCallback({
          ...this.#sharedStates,
          "sample-plugin.time": new Date().toISOString(),
        })
      );
  }

  private initializeMapLayer() {
    this.#tileLayerInstance = this.leaflet.tileLayer(
      this.urlTemplate,
      this.options
    );
  }

  private initializePlugin() {
    this.renderUI();
    this.initializeMapLayer();
    this.#tileLayerInstance &&
      this.addMapLayerCallback(
        this.#tileLayerInstance,
        this.layerName,
        this.layerType,
        this.active
      );
  }
}
