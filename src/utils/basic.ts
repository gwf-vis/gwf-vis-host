import leaflet from "leaflet";

export { leaflet };

export type PluginContainer = "hidden" | "sidebar" | "main";

export type MapView = {
  center: leaflet.LatLngExpression;
  zoom?: number;
  options?: leaflet.ZoomPanOptions;
};
