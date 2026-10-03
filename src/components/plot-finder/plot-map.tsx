"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { PLOT_TYPES, blockName, sectorName } from "@/lib/plot-finder-shared";
import type { GeoPolygon, MapAreas, MapConfig, PlotFeatureCollection, PlotProperties } from "@/types/api";
import { rotatedOverlay, type RotatedOverlay } from "./rotated-overlay";

/** Plots are fetched for the area in view from this zoom; further out only sector and block outlines show. */
const PLOT_MIN_ZOOM = 16;
/** Plot numbers are written on the map from this zoom. */
const LABEL_MIN_ZOOM = 18;
const MAX_LABELS = 600;

export type MapFocus = { sectorId: number | null; blockId: number | null; nonce: number };

type Props = {
  config: MapConfig;
  areas: MapAreas;
  baseLayer: "satellite" | "streets";
  showOverlays: boolean;
  overlayOpacity: number;
  /** Fit the map to this sector / block whenever the nonce changes. */
  focus: MapFocus;
  /** The selected plot's outline; the map zooms to it when the nonce changes. */
  highlight: { geometry: GeoPolygon; nonce: number } | null;
  locateNonce: number;
  onSelectPlot: (id: number) => void;
  onSelectArea: (sectorId: number, blockId: number | null) => void;
  onStatus: (status: { loading: boolean; truncated: boolean; zoomedOut: boolean }) => void;
};

function toLatLngs(geometry: GeoPolygon): L.LatLngExpression[] {
  return geometry.coordinates[0].map(([lng, lat]) => [lat, lng] as L.LatLngTuple);
}

function plotStyle(plot: PlotProperties): L.PathOptions {
  return { color: "#ffffff", weight: 1, opacity: 0.9, fillColor: PLOT_TYPES[plot.type]?.color ?? PLOT_TYPES.other.color, fillOpacity: 0.55 };
}

/**
 * The Leaflet map behind the Plot Finder. Leaflet works on the DOM directly, so this component keeps its own map and
 * layers in refs and only reacts to the props that change them.
 */
export default function PlotMap(props: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const baseLayers = useRef<Record<string, L.Layer>>({});
  const overlays = useRef<RotatedOverlay[]>([]);
  const plotLayer = useRef<L.GeoJSON | null>(null);
  const labelLayer = useRef<L.LayerGroup | null>(null);
  const highlightLayer = useRef<L.Polygon | null>(null);
  const loaded = useRef(new Map<number, { plot: PlotProperties; center: L.LatLng }>());
  const fetchController = useRef<AbortController | null>(null);
  const callbacks = useRef(props);

  // Leaflet's handlers are bound once, so they read the latest props through this ref.
  useEffect(() => {
    callbacks.current = props;
  });

  // Create the map once.
  useEffect(() => {
    if (!container.current || map.current) {
      return;
    }

    const { config, areas } = callbacks.current;
    const instance = L.map(container.current, { center: [config.center.lat, config.center.lng], zoom: config.zoom, maxZoom: 21, zoomControl: false, preferCanvas: true });
    L.control.zoom({ position: "bottomright" }).addTo(instance);
    L.control.scale({ position: "bottomleft", imperial: false }).addTo(instance);
    map.current = instance;

    instance.createPane("areas").style.zIndex = "410";
    instance.createPane("plots").style.zIndex = "420";
    instance.createPane("highlight").style.zIndex = "430";
    instance.createPane("labels").style.zIndex = "440";
    instance.getPane("labels")!.style.pointerEvents = "none";

    for (const layer of config.layers) {
      const tiles = L.tileLayer(layer.url, { attribution: layer.attribution, maxNativeZoom: layer.max_native_zoom, maxZoom: 21 });
      baseLayers.current[layer.key] = layer.labels_url
        ? L.layerGroup([tiles, L.tileLayer(layer.labels_url, { maxNativeZoom: layer.max_native_zoom, maxZoom: 21 })])
        : tiles;
    }

    // Sector and block outlines, clickable to open that area.
    const areaBounds: L.LatLngBounds[] = [];

    for (const society of areas.societies) {
      for (const phase of society.phases) {
        for (const sector of phase.sectors) {
          if (sector.boundary) {
            const polygon = L.polygon(toLatLngs(sector.boundary), { pane: "areas", color: "#ffffff", weight: 3, dashArray: "8 6", fillOpacity: 0.04, fillColor: "#1a73e8" })
              .bindTooltip(sectorName(sector.name), { permanent: true, direction: "center", className: "plot-area-label is-sector" })
              .on("click", () => callbacks.current.onSelectArea(sector.id, null))
              .addTo(instance);
            areaBounds.push(polygon.getBounds());
          }

          for (const block of sector.blocks) {
            if (block.boundary) {
              const polygon = L.polygon(toLatLngs(block.boundary), { pane: "areas", color: "#ffe082", weight: 2, fillOpacity: 0.02, fillColor: "#ffe082" })
                .bindTooltip(blockName(block.name), { direction: "center", className: "plot-area-label" })
                .on("click", () => callbacks.current.onSelectArea(sector.id, block.id))
                .addTo(instance);
              areaBounds.push(polygon.getBounds());
            }
          }
        }
      }
    }

    // With nothing selected, start on everything that has been mapped.
    if (areaBounds.length > 0 && callbacks.current.focus.sectorId === null && callbacks.current.highlight === null) {
      instance.fitBounds(areaBounds.reduce((all, bounds) => all.extend(bounds), L.latLngBounds(areaBounds[0].getSouthWest(), areaBounds[0].getNorthEast())), { padding: [24, 24] });
    }

    overlays.current = areas.overlays.map((overlay) =>
      rotatedOverlay(overlay.image_url, overlay.corners.top_left, overlay.corners.top_right, overlay.corners.bottom_left, { opacity: overlay.opacity / 100, interactive: false }),
    );

    plotLayer.current = L.geoJSON(undefined, {
      pane: "plots",
      style: (feature) => plotStyle(feature?.properties as PlotProperties),
      onEachFeature: (feature, layer) => {
        layer.on("click", (event: L.LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(event);
          callbacks.current.onSelectPlot((feature.properties as PlotProperties).id);
        });
      },
    }).addTo(instance);
    labelLayer.current = L.layerGroup().addTo(instance);

    const refreshLabels = () => {
      labelLayer.current?.clearLayers();

      if (instance.getZoom() < LABEL_MIN_ZOOM) {
        return;
      }

      const view = instance.getBounds();
      let count = 0;

      for (const { plot, center } of loaded.current.values()) {
        if (count >= MAX_LABELS) {
          break;
        }

        if (view.contains(center)) {
          L.marker(center, { pane: "labels", interactive: false, icon: L.divIcon({ className: "plot-number", html: plot.plot_number, iconSize: [40, 14] }) }).addTo(labelLayer.current!);
          count++;
        }
      }
    };

    const loadPlots = async () => {
      const zoomedOut = instance.getZoom() < PLOT_MIN_ZOOM;

      if (zoomedOut) {
        callbacks.current.onStatus({ loading: false, truncated: false, zoomedOut: true });
        refreshLabels();

        return;
      }

      fetchController.current?.abort();
      const controller = new AbortController();
      fetchController.current = controller;
      const view = instance.getBounds().pad(0.25);
      const bbox = [view.getSouth(), view.getWest(), view.getNorth(), view.getEast()].map((value) => value.toFixed(6)).join(",");
      callbacks.current.onStatus({ loading: true, truncated: false, zoomedOut: false });

      try {
        const response = await fetch(`/api/map/plots?bbox=${bbox}`, { signal: controller.signal });
        const collection = (await response.json()) as PlotFeatureCollection;

        for (const feature of collection.features ?? []) {
          if (!loaded.current.has(feature.id)) {
            const layer = L.geoJSON(feature as unknown as GeoJSON.Feature).getLayers()[0] as L.Polygon;
            loaded.current.set(feature.id, { plot: feature.properties, center: layer.getBounds().getCenter() });
            plotLayer.current?.addData(feature as unknown as GeoJSON.Feature);
          }
        }

        callbacks.current.onStatus({ loading: false, truncated: Boolean(collection.truncated), zoomedOut: false });
        refreshLabels();
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          callbacks.current.onStatus({ loading: false, truncated: false, zoomedOut: false });
        }
      }
    };

    let timer: ReturnType<typeof setTimeout> | undefined;
    instance.on("moveend", () => {
      clearTimeout(timer);
      timer = setTimeout(loadPlots, 250);
    });
    loadPlots();

    const loadedPlots = loaded.current;

    return () => {
      clearTimeout(timer);
      fetchController.current?.abort();
      instance.remove();
      map.current = null;
      loadedPlots.clear();
    };
  }, []);

  // Satellite / streets.
  useEffect(() => {
    const instance = map.current;

    if (!instance) {
      return;
    }

    for (const [key, layer] of Object.entries(baseLayers.current)) {
      if (key === props.baseLayer) {
        layer.addTo(instance);
      } else {
        layer.remove();
      }
    }

    if (!baseLayers.current[props.baseLayer]) {
      Object.values(baseLayers.current)[0]?.addTo(instance);
    }
  }, [props.baseLayer]);

  // Scanned society maps.
  useEffect(() => {
    const instance = map.current;

    for (const overlay of overlays.current) {
      if (props.showOverlays && instance) {
        overlay.addTo(instance);
        overlay.setOpacity(props.overlayOpacity / 100);
      } else {
        overlay.remove();
      }
    }
  }, [props.showOverlays, props.overlayOpacity]);

  // Zoom to a sector or block picked from the list.
  useEffect(() => {
    const instance = map.current;
    const { sectorId, blockId } = props.focus;

    if (!instance || sectorId === null) {
      return;
    }

    const sector = props.areas.societies.flatMap((society) => society.phases.flatMap((phase) => phase.sectors)).find((item) => item.id === sectorId);
    const area = blockId ? sector?.blocks.find((item) => item.id === blockId) : sector;

    if (area?.boundary) {
      instance.fitBounds(L.polygon(toLatLngs(area.boundary)).getBounds(), { padding: [24, 24] });

      return;
    }

    // No outline drawn yet: fit to the area's plots instead.
    const query = blockId ? `block_id=${blockId}` : `sector_id=${sectorId}`;
    fetch(`/api/map/plots?${query}`)
      .then((response) => response.json() as Promise<PlotFeatureCollection>)
      .then((collection) => {
        if (collection.features?.length) {
          instance.fitBounds(L.geoJSON(collection as unknown as GeoJSON.FeatureCollection).getBounds(), { padding: [24, 24], maxZoom: 18 });
        }
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only a new focus request (nonce) should move the map
  }, [props.focus.nonce]);

  // Outline and zoom to the selected plot.
  useEffect(() => {
    const instance = map.current;
    highlightLayer.current?.remove();
    highlightLayer.current = null;

    if (!instance || !props.highlight) {
      return;
    }

    const polygon = L.polygon(toLatLngs(props.highlight.geometry), { pane: "highlight", color: "#1a73e8", weight: 4, fillColor: "#1a73e8", fillOpacity: 0.35, interactive: false }).addTo(instance);
    highlightLayer.current = polygon;

    if (!instance.getBounds().contains(polygon.getBounds()) || instance.getZoom() < 17) {
      instance.flyToBounds(polygon.getBounds(), { maxZoom: 19, padding: [80, 80], duration: 0.8 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- redraw only for a new selection
  }, [props.highlight?.nonce]);

  // "My location".
  useEffect(() => {
    const instance = map.current;

    if (!instance || props.locateNonce === 0) {
      return;
    }

    instance.locate({ setView: true, maxZoom: 18 });
    const marker = L.circleMarker([0, 0], { radius: 8, color: "#fff", weight: 3, fillColor: "#1a73e8", fillOpacity: 1, pane: "labels" });
    const found = (event: L.LocationEvent) => marker.setLatLng(event.latlng).addTo(instance);
    instance.once("locationfound", found);

    return () => {
      instance.off("locationfound", found);
      marker.remove();
    };
  }, [props.locateNonce]);

  return <div ref={container} className="plot-map" />;
}
