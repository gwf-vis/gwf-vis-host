import type {
  leaflet,
  GWFVisPlugin,
  GWFVisPluginWithSharedStates,
  GWFVisMapPlugin,
  GWFVisPluginWithData,
  GWFVisUIInput,
  SharedStates,
  LayerType,
} from "../index";

export default class
  extends HTMLElement
  implements
    GWFVisPlugin,
    GWFVisPluginWithSharedStates,
    GWFVisMapPlugin,
    GWFVisPluginWithData<[number, number], (string | number)[]>
{
  obtainHeader = () => `<i>Sample Plugin</i> (${this.layerName ?? ""})`;

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

  leaflet?: typeof leaflet;

  addMapLayerCallback?: (
    layer: leaflet.Layer,
    name: string,
    type: LayerType,
    active?: boolean
  ) => void;

  removeMapLayerCallback?: (layer: leaflet.Layer) => void;

  connectedCallback() {
    this.initializePlugin();
  }

  queryDataCallback?: (
    dataSource: string,
    query: [number, number]
  ) => Promise<(string | number)[]>;

  disconnectedCallback() {
    this.#tileLayerInstance &&
      this.removeMapLayerCallback?.(this.#tileLayerInstance);
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
        <gwf-vis-ui-input id="timeout-input" type="number" value="2000"></gwf-vis-ui-input>
        <gwf-vis-ui-button id="mock-loading-button">Click me to mock a loading</gwf-vis-ui-button>
        <hr/>
        <span>${this.#sharedStates?.["sample-plugin.time"] ?? "N/A"}</span>
        <br/>
        <gwf-vis-ui-button id="update-shared-states-button">Update shared states</gwf-vis-ui-button>
        <hr/>
        <label for="data-range-input">What is range of the data to query?</label>
        <gwf-vis-ui-input id="data-range-input" type="text" value="0:10"></gwf-vis-ui-input>
        <br/>
        <label for="data-type-select">What is type of the data to query?</label>
        <select id="data-type-select">
          <option>number</option>
          <option>string</option>
        </select>
        <br/>
        <gwf-vis-ui-button id="data-query-button">Query data</gwf-vis-ui-button>
        <p id="query-result"><p>
        <hr/>
        <gwf-vis-ui-button disabled>Disabled</gwf-vis-ui-button>
        <gwf-vis-ui-button variant="hollow">Hollow</gwf-vis-ui-button>
        <gwf-vis-ui-button variant="clear">Clear</gwf-vis-ui-button>
        <gwf-vis-ui-button variant="round">Round</gwf-vis-ui-button>
        <gwf-vis-ui-button variant="link" href="https://github.com">Link</gwf-vis-ui-button>
      </div>
    `);
    this.shadowRoot
      ?.querySelector("#mock-loading-button")
      ?.addEventListener("click", () => {
        const loadingEndCallback = this.notifyLoadingCallback();
        const loadingTimeout = +(
          (this.shadowRoot?.querySelector("#timeout-input") as GWFVisUIInput)
            ?.value ?? ""
        );
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
    this.shadowRoot
      ?.querySelector("#data-query-button")
      ?.addEventListener("click", async () => {
        const dataType = (
          this.shadowRoot?.querySelector(
            "#data-type-select"
          ) as HTMLSelectElement
        )?.value;
        const queryObject = ((
          this.shadowRoot?.querySelector("#data-range-input") as GWFVisUIInput
        )?.value
          ?.split(":")
          .map((d) => +d) ?? [0, 0]) as [number, number];
        const data = await this.queryDataCallback?.(
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
      this.addMapLayerCallback?.(
        this.#tileLayerInstance,
        this.layerName,
        this.layerType,
        this.active
      );
  }
}
