import type leaflet from "leaflet";

type VGAPluginFull = VGAPlugin &
  VGAPluginWithFileAccess &
  VGAPluginWithSharedStates &
  VGAVisMapPlugin &
  VGADataProviderPlugin<unknown, unknown> &
  VGAPluginWithData<unknown, unknown>;

export type VGAPluginProps = Partial<VGAPluginFull> & Record<string, any>;

export type SharedStates = Record<string, any>;

export type LayerType = "base-layer" | "overlay";

export interface VGAPlugin extends HTMLElement {
  /**
   * Will be called when the host needs to obtain this plugin's header.
   * @returns A string of the header.
   */
  readonly obtainHeaderCallback: () => string;

  /**
   * Will be called when the host first loaded.
   */
  readonly hostFirstLoadedCallback?: () => void;

  /**
   * A delegate passed from the plugin host. Call it to notify the plugin host about a loading is going to start.
   * The plugin host would show a loading prompt if there is any unfinished loading request of any plugin.
   * @returns A callback that notifies the plugin host that the current loading request has finished.
   */
  notifyLoadingDelegate?: () => () => void;

  /**
   * A delegate passed from the plugin host. Call it to check if the plugin is currently inside the large presenter.
   * @returns `true` if the plugin is in the large presenter; `false` otherwise.
   */
  checkIfPluginIsInTheLargePresenterDelegate?: () => boolean;

  /**
   * The base URL used for the current config. It can be used to determine the real URL of a relative URL.
   */
  configBaseUrl?: string;
}

export interface VGAPluginWithFileAccess extends VGAPlugin {
  /**
   * The directory handle of the root directory. Only available if the vis got the permission of accessing the root directory.
   */
  rootDirectoryHandle?: FileSystemDirectoryHandle;
}

export interface VGAPluginWithSharedStates extends VGAPlugin {
  /**
   * A key-value based shared state dictionary passed from the plugin host.
   */
  sharedStates?: SharedStates;

  /**
   * A delegate passed from the plugin host. Call it to update the `sharedStates`.
   * @param sharedStates - The new `sharedStates` dictionary. It should not be the same object reference of the original one.
   */
  updateSharedStatesDelegate?: (sharedStates: SharedStates) => void;
}

export interface VGAVisMapPlugin extends VGAPlugin {
  /**
   * The `leaflet` instance passed from the plugin host..
   */
  leaflet?: typeof leaflet;

  /**
   * The `leaflet.Map` instance passed from the plugin host.
   */
  mapInstance?: leaflet.Map;

  /**
   * A delegate passed from the plugin host. Call it to add a layer into the map instance.
   * It will also add the layer into the layer control.
   */
  addMapLayerDelegate?: (
    layer: leaflet.Layer,
    name: string,
    type: LayerType,
    active?: boolean
  ) => void;

  /**
   * A delegate passed from the plugin host. Call it to remove a layer from the map instance.
   * It will also remove the layer from the layer control.
   */
  removeMapLayerDelegate?: (layer: leaflet.Layer) => void;
}

export interface VGADataProviderPlugin<TQuery, TData> extends VGAPlugin {
  /**
   * Will be called when the host needs to obtain the plugin's data provider identifiers.
   * @returns An array of string of the data provider's identifiers.
   */
  readonly obtainDataProviderIdentifiersCallback: () => string[];

  /**
   * Will be called when the host needs to query data that have registered to be handled by this plugin.
   * @async
   * @param identifier - A string identifier for data type.
   * @param dataSource - A string that references the data source.
   * @param query - A query object.
   * @returns The data queried.
   */
  readonly queryDataCallback: (
    identifier: string,
    dataSource: string,
    queryObject: TQuery
  ) => Promise<TData>;
}

export interface VGAPluginWithData<TQuery, TData> extends VGAPlugin {
  /**
   * A delegate passed from the plugin host. Call it to check if a corresponding data provider is registerd.
   * @param identifier - A string identifier for data type.
   * @returns `true` if there is a corresponding data provider registered; `false` otherwise.
   */
  checkIfDataProviderRegisteredDelegate?: (identifier: string) => boolean;

  /**
   * A delegate passed from the plugin host. Call it to query the data for a data source.
   * @async
   * @param dataSource - A string that identifies the data source.
   * @param query - A query object.
   * @returns The data queried.
   */
  queryDataDelegate?: (
    dataSource: string,
    queryObject: TQuery
  ) => Promise<TData>;
}
