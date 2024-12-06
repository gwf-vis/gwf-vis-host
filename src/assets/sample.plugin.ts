import type {
  leaflet,
  VGAPlugin,
  VGAPluginWithSharedStates,
  VGAMapPlugin,
  VGAPluginWithData,
  VGAUIInput,
  SharedStates,
  LayerType,
} from "../index";

export default class
  extends HTMLElement
  implements
    VGAPlugin,
    VGAPluginWithSharedStates,
    VGAMapPlugin,
    VGAPluginWithData<[number, number], (string | number)[]>
{
  obtainHeaderCallback = () => `Sample Plugin (${this.layerName ?? ""})`;

  notifyLoadingDelegate!: () => () => void;

  #sharedStates?: SharedStates;
  set sharedStates(value: SharedStates) {
    this.#sharedStates = value;
    this.renderUI();
  }

  updateSharedStatesDelegate!: (sharedStates: SharedStates) => void;

  layerName: string = "sample";
  layerType: LayerType = "base-layer";
  active: boolean = false;
  urlTemplate: string = "";
  options?: leaflet.TileLayerOptions;

  #tileLayerInstance?: leaflet.TileLayer;

  leaflet?: typeof leaflet;

  addMapLayerDelegate?: (
    layer: leaflet.Layer,
    name: string,
    type: LayerType,
    active?: boolean
  ) => void;

  removeMapLayerDelegate?: (layer: leaflet.Layer) => void;

  connectedCallback() {
    this.initializePlugin();
  }

  queryDataDelegate?: (
    dataSource: string,
    query: [number, number]
  ) => Promise<(string | number)[]>;

  disconnectedCallback() {
    this.#tileLayerInstance &&
      this.removeMapLayerDelegate?.(this.#tileLayerInstance);
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  private renderUI() {
    this.shadowRoot &&
      (this.shadowRoot.innerHTML = /* html */ `
      <div 
        style="min-height: 30rem; width: 100%; box-sizing: border-box;"
        >
        <label for="timeout-input">What is the timeout of the loading?</label>
        <vga-ui-input id="timeout-input" type="number" value="2000"></vga-ui-input>
        <vga-ui-button id="mock-loading-button">Click me to mock a loading</vga-ui-button>
        <hr/>
        <span>${this.#sharedStates?.["sample-plugin.time"] ?? "N/A"}</span>
        <br/>
        <vga-ui-button id="update-shared-states-button">Update shared states</vga-ui-button>
        <hr/>
        <label for="data-range-input">What is range of the data to query?</label>
        <vga-ui-input id="data-range-input" type="text" value="0:10"></vga-ui-input>
        <br/>
        <label for="data-type-select">What is type of the data to query?</label>
        <select id="data-type-select">
          <option>number</option>
          <option>string</option>
        </select>
        <br/>
        <vga-ui-button id="data-query-button">Query data</vga-ui-button>
        <p id="query-result"><p>
        <hr/>
        <vga-ui-button disabled>Disabled</vga-ui-button>
        <vga-ui-button variant="hollow">Hollow</vga-ui-button>
        <vga-ui-button variant="clear">Clear</vga-ui-button>
        <vga-ui-button variant="round">Round</vga-ui-button>
        <vga-ui-button variant="link" href="https://github.com">Link</vga-ui-button>
      </div>
    `);
    this.shadowRoot
      ?.querySelector("#mock-loading-button")
      ?.addEventListener("click", () => {
        const loadingEndCallback = this.notifyLoadingDelegate();
        const loadingTimeout = +(
          (this.shadowRoot?.querySelector("#timeout-input") as VGAUIInput)
            ?.value ?? ""
        );
        setTimeout(() => {
          loadingEndCallback();
        }, loadingTimeout);
      });
    this.shadowRoot
      ?.querySelector("#update-shared-states-button")
      ?.addEventListener("click", () =>
        this.updateSharedStatesDelegate({
          ...this.#sharedStates,
          "sample-plugin.time": new Date().toISOString(),
        })
      );
    this.shadowRoot
      ?.querySelector("#data-query-button")
      ?.addEventListener("click", async () => {
        const dataType = (
          this.shadowRoot?.querySelector(
            "#data-type-select"
          ) as HTMLSelectElement
        )?.value;
        const queryObject = ((
          this.shadowRoot?.querySelector("#data-range-input") as VGAUIInput
        )?.value
          ?.split(":")
          .map((d) => +d) ?? [0, 0]) as [number, number];
        const data = await this.queryDataDelegate?.(
          `sample:${dataType}`,
          queryObject
        );
        this.shadowRoot
          ?.querySelector("#query-result")
          ?.replaceChildren(document.createTextNode(data?.toString() ?? "N/A"));
      });
  }

  private initializeMapLayer() {
    this.#tileLayerInstance = this.leaflet?.tileLayer(
      this.urlTemplate,
      this.options
    );
  }

  private initializePlugin() {
    this.renderUI();
    this.initializeMapLayer();
    this.#tileLayerInstance &&
      this.addMapLayerDelegate?.(
        this.#tileLayerInstance,
        this.layerName,
        this.layerType,
        this.active
      );
  }
}
