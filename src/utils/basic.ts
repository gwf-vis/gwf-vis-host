import type leaflet from "leaflet";

export type PluginContainer = "hidden" | "sidebar" | "main";

export type MapView = {
  center: leaflet.LatLngExpression;
  zoom?: number;
  options?: leaflet.ZoomPanOptions;
};
