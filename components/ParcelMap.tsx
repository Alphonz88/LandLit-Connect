"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Popup,
  useMap,
} from "react-leaflet";

import L from "leaflet";

type MapParcel = {
  id: number;
  state: string | null;
  district: string | null;
  taluk: string | null;
  village: string;
  survey_no: string;
  subdivision: string | null;
  owner_name: string | null;
  area: string | null;
  land_type: string | null;
  parcel_geojson: any;
  latitude: number | null;
  longitude: number | null;
};

type Props = {
  parcels: MapParcel[];
  onSelectParcel: (
    village: string,
    surveyNo: string
  ) => void;
};

function FitParcels({
  parcels,
}: {
  parcels: MapParcel[];
}) {
  const map = useMap();

  useEffect(() => {
    if (parcels.length === 0) {
      return;
    }

    const layers: L.Layer[] = [];

    parcels.forEach((parcel) => {
      if (!parcel.parcel_geojson) {
        return;
      }

      const layer = L.geoJSON(
        parcel.parcel_geojson
      );

      layers.push(layer);
    });

    if (layers.length === 0) {
      return;
    }

    const group = L.featureGroup(layers);

    const bounds = group.getBounds();

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [30, 30],
        maxZoom: 18,
      });
    }
  }, [map, parcels]);

  return null;
}

export default function ParcelMap({
  parcels,
  onSelectParcel,
}: Props) {
  return (
    <div className="h-[650px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-lg">
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        className="h-full w-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitParcels parcels={parcels} />

        {parcels.map((parcel) => {
          if (!parcel.parcel_geojson) {
            return null;
          }

          return (
            <GeoJSON
              key={parcel.id}
              data={parcel.parcel_geojson}
            >
              <Popup>
                <div className="min-w-[220px]">
                  <p className="text-lg font-bold text-slate-900">
                    Survey {parcel.survey_no}
                    {parcel.subdivision
                      ? ` / ${parcel.subdivision}`
                      : ""}
                  </p>

                  <div className="mt-3 space-y-1 text-sm">
                    <p>
                      <strong>Village:</strong>{" "}
                      {parcel.village}
                    </p>

                    <p>
                      <strong>Taluk:</strong>{" "}
                      {parcel.taluk ||
                        "Not Available"}
                    </p>

                    <p>
                      <strong>District:</strong>{" "}
                      {parcel.district ||
                        "Not Available"}
                    </p>

                    <p>
                      <strong>State:</strong>{" "}
                      {parcel.state ||
                        "Not Available"}
                    </p>

                    <p>
                      <strong>Owner:</strong>{" "}
                      {parcel.owner_name ||
                        "Not Available"}
                    </p>

                    <p>
                      <strong>Area:</strong>{" "}
                      {parcel.area ||
                        "Not Available"}
                    </p>

                    <p>
                      <strong>
                        Land Type:
                      </strong>{" "}
                      {parcel.land_type ||
                        "Not Available"}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      onSelectParcel(
                        parcel.village,
                        parcel.survey_no
                      )
                    }
                    className="mt-4 w-full bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-semibold"
                  >
                    Verify This Property
                  </button>
                </div>
              </Popup>
            </GeoJSON>
          );
        })}
      </MapContainer>
    </div>
  );
}