import leaflet from "leaflet";

type GwfVisPluginFull = GwfVisPlugin &
  GwfVisPluginWithSharedStates &
  GwfVisMapPlugin &
  GwfVisDataProviderPlugin<unknown, unknown> &
  GwfVisPluginWithData<unknown, unknown>;

export type GwfVisPluginProps = Partial<GwfVisPluginFull> & Record<string, any>;

export type SharedStates = Record<string, any>;

export type LayerType = "base-layer" | "overlay";

export interface GwfVisPlugin extends HTMLElement {
  /**
   * Obtain the plugin's header to be displayed.
   * @returns A string of the header.
   */
  readonly obtainHeader: () => string;

  /**
   * Will be called when the host first loaded.
   */
  hostFirstLoadedHandler?: () => void;

  /**
   * A callback passed from the plugin host. Call it to notify the plugin host about a loading is going to start.
   * The plugin host would show a loading prompt if there is any unfinished loading request of any plugin.
   * @returns A callback that notifies the plugin host that the current loading request has finished.
   */
  notifyLoadingCallback?: () => () => void;
}

export interface GwfVisPluginWithSharedStates extends GwfVisPlugin {
  /**
   * A key-value based shared state dictionary passed from the plugin host.
   */
  sharedStates?: SharedStates;

  /**
   * A callback passed from the plugin host. Call it to update the `sharedStates`.
   * @param sharedStates - The new `sharedStates` dictionary. It should not be the same object reference of the original one.
   */
  updateSharedStatesCallback?: (sharedStates: SharedStates) => void;
}

export interface GwfVisMapPlugin extends GwfVisPlugin {
  /**
   * The `leaflet` instance passed from the plugin host..
   */
  leaflet?: typeof leaflet;

  /**
   * The map instance passed from the plugin host.
   */
  mapInstance?: leaflet.Map;

  /**
   * A callback passed from the plugin host. Call it to add a layer into the map instance.
   * It will also add the layer into the layer control.
   */
  addMapLayerCallback?: (
    layer: leaflet.Layer,
    name: string,
    type: LayerType,
    active?: boolean
  ) => void;

  /**
   * A callback passed from the plugin host. Call it to remove a layer from the map instance.
   * It will also remove the layer from the layer control.
   */
  removeMapLayerCallback?: (layer: leaflet.Layer) => void;
}

export interface GwfVisDataProviderPlugin<TQuery, TData> extends GwfVisPlugin {
  /**
   * Obtain the plugin's data provider identifier.
   * @returns A string of the data provider identifier.
   */
  obtainDataProviderIdentifier: () => string;

  /**
   * Query the data for a data source.
   * @async
   * @param dataSource - A string that identifies the data source.
   * @param query - A query object.
   * @returns The data queried.
   */
  queryData: (dataSource: string, queryObject: TQuery) => Promise<TData>;
}

export interface GwfVisPluginWithData<TQuery, TData> extends GwfVisPlugin {
  /**
   * A callback passed from the plugin host. Call it to check if a corresponding data provider is registerd.
   * @param identifier - A string identifier for data type.
   * @returns `true` if there is a corresponding data provider registered; `false` otherwise.
   */
  checkIfDataProviderRegisteredCallback?: (identifier: string) => boolean;

  /**
   * A callback passed from the plugin host. Call it to query the data for a data source.
   * @async
   * @param dataSource - A string that identifies the data source.
   * @param query - A query object.
   * @returns The data queried.
   */
  queryDataCallback?: (
    dataSource: string,
    queryObject: TQuery
  ) => Promise<TData>;
}
