import type leaflet from "leaflet";

export type PluginType = "data" | "hidden" | "sidebar" | "main";

export type MapView = {
  center: leaflet.LatLngExpression;
  zoom?: number;
  options?: leaflet.ZoomPanOptions;
};
