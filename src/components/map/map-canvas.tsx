"use client";

import type { GeoJSONSource, Map as MapboxMap, Popup } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef, useState } from "react";

export type MapPoint = {
  id: string;
  lat: number;
  lng: number;
  name: string;
  city: string;
  href: string;
  rating: number;
  ratingCount: number;
  tuition: string;
  logo: string | null;
};

export type MapLabels = {
  viewProfile: string;
  notRated: string;
  loadError: string;
  resetView: string;
};

const KYRGYZSTAN_BOUNDS: [[number, number], [number, number]] = [[69.2, 39.1], [80.3, 43.3]];

function toGeoJSON(points: MapPoint[]) {
  return {
    type: "FeatureCollection" as const,
    features: points.map((p) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [p.lng, p.lat] },
      properties: {
        id: p.id, name: p.name, city: p.city, href: p.href, rating: p.rating, ratingCount: p.ratingCount, tuition: p.tuition,
      },
    })),
  };
}

/** Builds the popup with DOM APIs only (textContent), so school names can never inject markup. */
function buildPopup(props: { name: string; city: string; href: string; rating: number; ratingCount: number; tuition: string }, labels: MapLabels) {
  const root = document.createElement("div");
  root.className = "w-64 p-4";

  const title = document.createElement("p");
  title.className = "pr-5 text-body font-semibold leading-snug text-ink-900";
  title.textContent = props.name;

  const city = document.createElement("p");
  city.className = "mt-0.5 text-small text-ink-600";
  city.textContent = props.city;

  const rating = document.createElement("p");
  rating.className = "mt-2 text-small font-semibold text-leaf-700";
  rating.textContent = props.ratingCount > 0 ? `★ ${Number(props.rating).toFixed(1)} (${props.ratingCount})` : labels.notRated;

  const tuition = document.createElement("p");
  tuition.className = "mt-1 text-small text-ink-800";
  tuition.textContent = props.tuition;

  const link = document.createElement("a");
  link.href = props.href;
  link.className = "mt-3 inline-flex h-9 items-center rounded-control bg-brand-700 px-3.5 text-small font-semibold text-white hover:bg-brand-800";
  link.textContent = labels.viewProfile;

  root.append(title, city, rating, tuition, link);
  return root;
}

export function MapCanvas({
  token, points, selectedId, onSelect, labels, center, zoom, interactive = true,
}: {
  token: string;
  points: MapPoint[];
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  labels: MapLabels;
  center?: [number, number];
  zoom?: number;
  interactive?: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const pointsRef = useRef(points);
  const labelsRef = useRef(labels);
  const onSelectRef = useRef(onSelect);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  pointsRef.current = points;
  labelsRef.current = labels;
  onSelectRef.current = onSelect;

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    let map: MapboxMap | undefined;

    (async () => {
      try {
        const mapboxgl = (await import("mapbox-gl")).default;
        if (cancelled || !container.current) return;
        mapboxgl.accessToken = token;

        map = new mapboxgl.Map({
          container: container.current,
          style: "mapbox://styles/mapbox/light-v11",
          center: center ?? [74.6, 41.5],
          zoom: zoom ?? 6,
          bounds: center ? undefined : KYRGYZSTAN_BOUNDS,
          fitBoundsOptions: { padding: 24 },
          interactive,
          attributionControl: true,
          cooperativeGestures: Boolean(center),
        });
        mapRef.current = map;
        if (interactive) {
          map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
          map.addControl(new mapboxgl.GeolocateControl({ trackUserLocation: false }), "top-right");
        }

        map.on("error", (event) => {
          const status = (event.error as { status?: number } | undefined)?.status;
          if (status === 401 || status === 403) setFailed(true);
        });

        map.on("load", () => {
          if (!map) return;
          map.addSource("schools", {
            type: "geojson",
            data: toGeoJSON(pointsRef.current),
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 48,
          });

          map.addLayer({
            id: "clusters",
            type: "circle",
            source: "schools",
            filter: ["has", "point_count"],
            paint: {
              "circle-color": ["step", ["get", "point_count"], "#2679b4", 5, "#1d6296", 15, "#185078"],
              "circle-radius": ["step", ["get", "point_count"], 18, 5, 23, 15, 29],
              "circle-stroke-width": 3,
              "circle-stroke-color": "rgba(255,255,255,0.9)",
            },
          });
          map.addLayer({
            id: "cluster-count",
            type: "symbol",
            source: "schools",
            filter: ["has", "point_count"],
            layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 13, "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"] },
            paint: { "text-color": "#ffffff" },
          });
          map.addLayer({
            id: "school-point",
            type: "circle",
            source: "schools",
            filter: ["!", ["has", "point_count"]],
            paint: {
              "circle-color": ["case", [">", ["get", "ratingCount"], 0], "#1f7450", "#6b7589"],
              "circle-radius": 9,
              "circle-stroke-width": 3,
              "circle-stroke-color": "#ffffff",
            },
          });

          map.on("click", "clusters", (event) => {
            const feature = map?.queryRenderedFeatures(event.point, { layers: ["clusters"] })[0];
            const clusterId = feature?.properties?.cluster_id as number | undefined;
            if (clusterId === undefined || !map) return;
            (map.getSource("schools") as GeoJSONSource).getClusterExpansionZoom(clusterId, (error, expansion) => {
              if (error || expansion == null || !map) return;
              map.easeTo({ center: (feature!.geometry as GeoJSON.Point).coordinates as [number, number], zoom: expansion + 0.5 });
            });
          });
          map.on("click", "school-point", (event) => {
            const id = event.features?.[0]?.properties?.id as string | undefined;
            if (id) onSelectRef.current?.(id);
          });
          for (const layer of ["clusters", "school-point"]) {
            map.on("mouseenter", layer, () => { if (map) map.getCanvas().style.cursor = "pointer"; });
            map.on("mouseleave", layer, () => { if (map) map.getCanvas().style.cursor = ""; });
          }
          setReady(true);
        });
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      popupRef.current?.remove();
      map?.remove();
      mapRef.current = null;
    };
    // The map is created once; props are read through refs afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Push filtered points into the cluster source and fit them.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    (map.getSource("schools") as GeoJSONSource | undefined)?.setData(toGeoJSON(points));
  }, [points, ready]);

  // Open the popup for the selected school and fly to it.
  useEffect(() => {
    const map = mapRef.current;
    popupRef.current?.remove();
    if (!ready || !map || !selectedId) return;
    const point = pointsRef.current.find((p) => p.id === selectedId);
    if (!point) return;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (!mapRef.current) return;
      map.flyTo({ center: [point.lng, point.lat], zoom: Math.max(map.getZoom(), 14), speed: 1.4 });
      popupRef.current = new mapboxgl.Popup({ offset: 16, closeButton: true, maxWidth: "280px" })
        .setLngLat([point.lng, point.lat])
        .setDOMContent(buildPopup(point, labelsRef.current))
        .addTo(map);
      popupRef.current.on("close", () => onSelectRef.current?.(null));
    })();
  }, [selectedId, ready]);

  return (
    <div className="relative size-full">
      <div ref={container} className="size-full" />
      {!ready && !failed ? <div className="absolute inset-0 animate-pulse bg-ink-100" aria-hidden="true" /> : null}
      {failed ? (
        <div className="absolute inset-0 flex items-center justify-center bg-ink-100 p-6 text-center text-small text-ink-600" role="alert">
          {labels.loadError}
        </div>
      ) : null}
    </div>
  );
}
