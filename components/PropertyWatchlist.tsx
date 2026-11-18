"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  property: any;
};

export default function PropertyWatchlist({
  property,
}: Props) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    checkSaved();
  }, [property?.id]);

  async function checkSaved() {
    if (!property?.id) return;

    const { data } = await supabase
      .from("saved_properties")
      .select("id")
      .eq("property_id", property.id)
      .maybeSingle();

    setSaved(!!data);
  }

  async function saveProperty() {
    if (!property?.id) return;

    setLoading(true);
    setMessage("");

    const { error } = await supabase
      .from("saved_properties")
      .insert({
        property_id: property.id,
      });

    if (error) {
      if (error.code === "23505") {
        setSaved(true);
        setMessage("Property is already being monitored.");
      } else {
        setMessage("Error: " + error.message);
      }

      setLoading(false);
      return;
    }

    setSaved(true);
    setMessage("Property added to your watchlist.");
    setLoading(false);
  }

  async function removeProperty() {
    if (!property?.id) return;

    setLoading(true);
    setMessage("");

    const { error } = await supabase
      .from("saved_properties")
      .delete()
      .eq("property_id", property.id);

    if (error) {
      setMessage("Error: " + error.message);
      setLoading(false);
      return;
    }

    setSaved(false);
    setMessage("Property removed from watchlist.");
    setLoading(false);
  }

  return (
    <div className="
      bg-white
      border border-slate-200
      shadow-lg
      rounded-2xl
      p-8
    ">

      <p className="
        text-sm
        font-semibold
        text-blue-700
      ">
        PROPERTY MONITORING
      </p>

      <h3 className="
        text-2xl
        font-bold
        text-slate-950
        mt-1
      ">
        Monitor This Property
      </h3>

      <p className="
        text-slate-600
        mt-2
      ">
        Save this property to monitor its
        litigation status and upcoming hearings.
      </p>

      <div className="
        mt-6
        flex
        items-center
        gap-4
        flex-wrap
      ">

        {!saved ? (
          <button
            onClick={saveProperty}
            disabled={loading}
            className="
              bg-blue-700
              hover:bg-blue-800
              disabled:bg-slate-400
              text-white
              font-semibold
              px-6
              py-3
              rounded-lg
            "
          >
            {loading
              ? "Saving..."
              : "Save & Monitor Property"}
          </button>
        ) : (
          <>
            <span className="
              bg-green-100
              text-green-700
              px-4
              py-2
              rounded-full
              font-semibold
            ">
              ✓ Monitoring Active
            </span>

            <button
              onClick={removeProperty}
              disabled={loading}
              className="
                border
                border-red-300
                text-red-700
                hover:bg-red-50
                px-5
                py-2
                rounded-lg
                font-semibold
              "
            >
              Stop Monitoring
            </button>
          </>
        )}

      </div>

      {message && (
        <p className="
          mt-4
          text-sm
          font-medium
          text-slate-700
        ">
          {message}
        </p>
      )}

      <p className="
        mt-6
        text-xs
        text-slate-500
      ">
        Prototype monitoring uses the litigation
        records currently available in the LandLit
        Connect database.
      </p>

    </div>
  );
}