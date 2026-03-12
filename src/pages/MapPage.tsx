import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import L from "leaflet";
import { Crosshair, Loader2 } from "lucide-react";
import "leaflet/dist/leaflet.css";

interface OverpassPlace {
  id: number;
  lat: number;
  lon: number;
  tags: Record<string, string>;
}

const categoryColors: Record<string, string> = {
  tourism: "#3b82f6",
  museum: "#8b5cf6",
  monument: "#3b82f6",
  amenity_restaurant: "#ef4444",
  amenity_cafe: "#f97316",
  tourism_hotel: "#22c55e",
};

const createIcon = (color: string) =>
  new L.DivIcon({
    className: "",
    html: `<div style="width:24px;height:24px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

const userIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:18px;height:18px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.3)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const MUMBAI_CENTER: L.LatLngExpression = [18.93, 72.83];

const MapPage = () => {
  const [searchParams] = useSearchParams();
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const placesLayerRef = useRef<L.LayerGroup | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastFetchRef = useRef<string>("");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loadingPlaces, setLoadingPlaces] = useState(false);

  const getPlaceColor = (tags: Record<string, string>) => {
    if (tags.tourism === "hotel" || tags.tourism === "hostel") return "#22c55e";
    if (tags.amenity === "restaurant") return "#ef4444";
    if (tags.amenity === "cafe") return "#f97316";
    if (tags.tourism === "museum") return "#8b5cf6";
    return "#3b82f6";
  };

  const getPlaceType = (tags: Record<string, string>) => {
    if (tags.tourism === "hotel" || tags.tourism === "hostel") return "Hotel";
    if (tags.amenity === "restaurant") return "Restaurant";
    if (tags.amenity === "cafe") return "Cafe";
    if (tags.tourism === "museum") return "Museum";
    if (tags.historic === "monument") return "Monument";
    if (tags.tourism === "attraction") return "Attraction";
    return tags.tourism || tags.amenity || tags.historic || "Place";
  };

  const fetchNearbyPlaces = useCallback(async (lat: number, lng: number) => {
    const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
    if (key === lastFetchRef.current) return;
    lastFetchRef.current = key;
    setLoadingPlaces(true);

    const radius = 5000;
    const query = `
      [out:json][timeout:10];
      (
        node["tourism"~"attraction|museum|hotel|hostel|viewpoint"](around:${radius},${lat},${lng});
        node["historic"~"monument|memorial|castle|ruins"](around:${radius},${lat},${lng});
        node["amenity"~"restaurant|cafe"](around:${radius},${lat},${lng});
      );
      out body 50;
    `;

    try {
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: `data=${encodeURIComponent(query)}`,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      const data = await res.json();
      const places: OverpassPlace[] = data.elements || [];

      if (placesLayerRef.current) {
        placesLayerRef.current.clearLayers();
      }

      places.forEach((place) => {
        if (!place.tags?.name) return;
        const color = getPlaceColor(place.tags);
        const type = getPlaceType(place.tags);
        const dist = mapRef.current
          ? (mapRef.current.distance([lat, lng], [place.lat, place.lon]) / 1000).toFixed(1)
          : "?";

        const marker = L.marker([place.lat, place.lon], { icon: createIcon(color) });
        marker.bindPopup(`
          <div style="min-width:180px">
            <h3 style="font-weight:bold;font-size:14px;margin:0 0 4px">${place.tags.name}</h3>
            <span style="display:inline-block;padding:2px 8px;border-radius:12px;background:${color}20;color:${color};font-size:11px;font-weight:500;margin-bottom:6px">${type}</span>
            <div style="font-size:12px;color:#888;margin-top:4px">📏 ${dist} km away</div>
            ${place.tags.opening_hours ? `<div style="font-size:11px;color:#666;margin-top:2px">🕐 ${place.tags.opening_hours}</div>` : ""}
            <a href="https://www.openstreetmap.org/directions?from=${lat}%2C${lng}&to=${place.lat}%2C${place.lon}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:4px;margin-top:8px;font-size:12px;font-weight:500;color:#3b82f6;text-decoration:none">
              🧭 Navigate
            </a>
          </div>
        `);
        placesLayerRef.current?.addLayer(marker);
      });
    } catch (err) {
      console.error("Overpass API error:", err);
    }
    setLoadingPlaces(false);
  }, []);

  const updateUserPosition = useCallback((lat: number, lng: number) => {
    setUserCoords({ lat, lng });
    setLocating(false);
    setLocationError(null);

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([lat, lng]);
    } else if (mapRef.current) {
      userMarkerRef.current = L.marker([lat, lng], { icon: userIcon })
        .addTo(mapRef.current)
        .bindPopup("📍 You are here");
    }

    fetchNearbyPlaces(lat, lng);
  }, [fetchNearbyPlaces]);

  const centerOnUser = () => {
    if (mapRef.current && userCoords) {
      mapRef.current.setView([userCoords.lat, userCoords.lng], 14, { animate: true });
    }
  };

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Check if navigated with search params
    const paramLat = searchParams.get("lat");
    const paramLng = searchParams.get("lng");
    const paramName = searchParams.get("name");
    const initialCenter: L.LatLngExpression = paramLat && paramLng
      ? [parseFloat(paramLat), parseFloat(paramLng)]
      : MUMBAI_CENTER;

    const map = L.map(containerRef.current, { zoomControl: false }).setView(initialCenter, 14);
    mapRef.current = map;
    placesLayerRef.current = L.layerGroup().addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      maxZoom: 19,
    }).addTo(map);

    // If navigated from search, add a marker and fetch nearby
    if (paramLat && paramLng) {
      const lat = parseFloat(paramLat);
      const lng = parseFloat(paramLng);
      L.marker([lat, lng], {
        icon: new L.DivIcon({
          className: "",
          html: `<div style="width:32px;height:32px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 2px 12px rgba(239,68,68,0.5);display:flex;align-items:center;justify-content:center;font-size:16px">📍</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        }),
      })
        .addTo(map)
        .bindPopup(`<b>${paramName ? decodeURIComponent(paramName) : "Searched Location"}</b>`)
        .openPopup();
      fetchNearbyPlaces(lat, lng);
    }

    return () => {
      map.remove();
      mapRef.current = null;
      userMarkerRef.current = null;
      placesLayerRef.current = null;
    };
  }, []);

  // GPS tracking
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        updateUserPosition(latitude, longitude);
        // Only center on user if no search params
        if (!searchParams.get("lat")) {
          mapRef.current?.setView([latitude, longitude], 14, { animate: true });
        }
      },
      (err) => {
        console.warn("Geolocation error:", err.message);
        setLocationError("Location access denied. Showing default area.");
        setLocating(false);
        // If no search params either, fetch for default location
        if (!searchParams.get("lat")) {
          fetchNearbyPlaces(18.93, 72.83);
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => updateUserPosition(pos.coords.latitude, pos.coords.longitude),
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [updateUserPosition, searchParams, fetchNearbyPlaces]);

  return (
    <div className="h-screen relative">
      {/* Header overlay */}
      <div className="absolute top-0 left-0 right-0 z-[1000] p-4 bg-gradient-to-b from-background/90 to-transparent">
        <h1 className="text-xl font-bold font-display">Explore Nearby</h1>
        <div className="flex gap-3 mt-2 text-xs flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: "#3b82f6" }} /> Attractions
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: "#ef4444" }} /> Restaurants
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: "#f97316" }} /> Cafes
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: "#8b5cf6" }} /> Museums
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: "#22c55e" }} /> Hotels
          </span>
        </div>
        {(locating || loadingPlaces) && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
            <Loader2 size={12} className="animate-spin" />
            {locating ? "Getting your location..." : "Loading nearby places..."}
          </div>
        )}
        {locationError && (
          <p className="mt-2 text-xs text-destructive">{locationError}</p>
        )}
        {userCoords && (
          <p className="mt-1 text-[10px] text-muted-foreground">
            📍 {userCoords.lat.toFixed(4)}, {userCoords.lng.toFixed(4)}
          </p>
        )}
      </div>

      {/* Center on user button */}
      {userCoords && (
        <button
          onClick={centerOnUser}
          className="absolute bottom-24 right-4 z-[1000] w-11 h-11 rounded-full bg-card border border-border shadow-elevated flex items-center justify-center"
          title="Center on my location"
        >
          <Crosshair size={20} className="text-primary" />
        </button>
      )}

      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
};

export default MapPage;
