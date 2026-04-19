"use client";

import { useEffect, useState } from "react";

type DeliveryMapProps = {
  address: string;
};

type GeocodeResult = {
  lon: number;
  lat: number;
} | null;

function useGeocodeAddress(address: string): { result: GeocodeResult; loading: boolean } {
  const [result, setResult] = useState<GeocodeResult>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = address.trim();
    if (!trimmed) {
      setResult(null);
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;
    if (!apiKey) {
      return;
    }

    setLoading(true);

    const controller = new AbortController();
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(trimmed)}&limit=1&apiKey=${apiKey}`;

    fetch(url, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        const feature = data?.features?.[0];
        if (feature) {
          setResult({
            lon: feature.geometry.coordinates[0],
            lat: feature.geometry.coordinates[1],
          });
        } else {
          setResult(null);
        }
      })
      .catch(() => {
        setResult(null);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [address]);

  return { result, loading };
}

export function DeliveryMap({ address }: DeliveryMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;
  const { result, loading } = useGeocodeAddress(address);

  if (!apiKey || !address.trim()) {
    return null;
  }

  const mapSrc = result
    ? `https://maps.geoapify.com/v1/staticmap?style=osm-carto&width=700&height=280&center=lonlat:${result.lon},${result.lat}&zoom=15&marker=lonlat:${result.lon},${result.lat};type:awesome;color:%231d4f91;size:large&apiKey=${apiKey}`
    : null;

  const mapsLink = result
    ? `https://www.openstreetmap.org/?mlat=${result.lat}&mlon=${result.lon}#map=15/${result.lat}/${result.lon}`
    : `https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`;

  return (
    <div className="delivery-map">
      <div className="delivery-map__label">
        <svg
          fill="none"
          height="14"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="14"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span>Delivery Location</span>
        <a
          className="delivery-map__external"
          href={mapsLink}
          rel="noopener noreferrer"
          target="_blank"
        >
          Open in maps ↗
        </a>
      </div>

      <div className="delivery-map__body">
        {loading ? (
          <div className="delivery-map__loading">
            <span>Locating address...</span>
          </div>
        ) : mapSrc ? (
          <img
            alt={`Map showing delivery location: ${address}`}
            className="delivery-map__img"
            src={mapSrc}
          />
        ) : (
          <div className="delivery-map__loading">
            <span>Location not found for this address.</span>
          </div>
        )}
      </div>
    </div>
  );
}
