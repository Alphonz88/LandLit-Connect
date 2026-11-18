"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type CaseItem = {
  id: number;
  case_number: string;
  court_name: string;
  case_type: string;
  status: string;
  filing_date: string | null;
  next_hearing: string | null;
};

type PropertyItem = {
  id: number;
  survey_no: string;
  subdivision: string | null;
  village: string;
  district: string;
  taluk: string;
  owner_name: string;
  area: string;
  land_type: string;
  litigation_cases: CaseItem[];
};

type SavedItem = {
  id: number;
  created_at: string;
  property_id: number;
  properties: PropertyItem;
};

export default function MyWatchlist() {
  const [watchlist, setWatchlist] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadWatchlist();
  }, []);

  async function loadWatchlist() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("saved_properties")
      .select(`
        id,
        created_at,
        property_id,
        properties (
          id,
          survey_no,
          subdivision,
          village,
          district,
          taluk,
          owner_name,
          area,
          land_type,
          litigation_cases (
            id,
            case_number,
            court_name,
            case_type,
            status,
            filing_date,
            next_hearing
          )
        )
      `)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.log(error);
      setMessage("Unable to load watchlist.");
      setLoading(false);
      return;
    }

    setWatchlist((data as any) || []);
    setLoading(false);
  }

  async function removeProperty(
    savedId: number
  ) {
    const { error } = await supabase
      .from("saved_properties")
      .delete()
      .eq("id", savedId);

    if (error) {
      setMessage(
        "Unable to remove property."
      );
      return;
    }

    setWatchlist((current) =>
      current.filter(
        (item) => item.id !== savedId
      )
    );
  }

  function calculateRisk(
    cases: CaseItem[]
  ) {
    let score = 0;

    const activeCases =
      cases.filter((item) => {
        const status =
          item.status?.toLowerCase();

        return (
          status === "pending" ||
          status === "active"
        );
      });

    if (activeCases.length > 0) {
      score += 40;
    }

    if (cases.length > 1) {
      score += 20;
    }

    const recentCases =
      cases.filter((item) => {
        if (!item.filing_date) {
          return false;
        }

        const filingDate =
          new Date(item.filing_date);

        const now =
          new Date();

        const years =
          (
            now.getTime() -
            filingDate.getTime()
          ) /
          (
            1000 *
            60 *
            60 *
            24 *
            365
          );

        return years <= 2;
      });

    if (recentCases.length > 0) {
      score += 15;
    }

    score = Math.min(score, 100);

    let level = "Low";

    if (score >= 61) {
      level = "High";
    } else if (score >= 31) {
      level = "Medium";
    }

    return {
      score,
      level,
    };
  }

  function getUpcomingHearings(
    cases: CaseItem[]
  ) {
    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    return cases
      .filter((item) => {
        if (!item.next_hearing) {
          return false;
        }

        const hearing =
          new Date(
            item.next_hearing
          );

        return hearing >= today;
      })
      .sort((a, b) => {
        return (
          new Date(
            a.next_hearing!
          ).getTime() -
          new Date(
            b.next_hearing!
          ).getTime()
        );
      });
  }

  function formatDate(
    date: string
  ) {
    return new Date(
      date
    ).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  function daysUntil(
    date: string
  ) {
    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    const hearing =
      new Date(date);

    hearing.setHours(
      0,
      0,
      0,
      0
    );

    return Math.ceil(
      (
        hearing.getTime() -
        today.getTime()
      ) /
      (
        1000 *
        60 *
        60 *
        24
      )
    );
  }

  return (
    <div
      className="
        bg-white
        border
        border-slate-200
        shadow-lg
        rounded-2xl
        p-8
      "
    >
      <div
        className="
          flex
          flex-col
          md:flex-row
          md:items-center
          md:justify-between
          gap-4
        "
      >
        <div>
          <p
            className="
              text-sm
              font-semibold
              text-blue-700
            "
          >
            PROPERTY MONITORING
          </p>

          <h3
            className="
              text-2xl
              font-bold
              text-slate-950
              mt-1
            "
          >
            My Property Watchlist
          </h3>

          <p
            className="
              text-slate-600
              mt-2
            "
          >
            Monitor saved properties,
            litigation cases and upcoming
            court hearings.
          </p>
        </div>

        <button
          onClick={loadWatchlist}
          className="
            border
            border-blue-300
            text-blue-700
            hover:bg-blue-50
            px-5
            py-2
            rounded-lg
            font-semibold
            self-start
          "
        >
          Refresh
        </button>
      </div>

      {loading && (
        <div
          className="
            mt-8
            bg-slate-50
            border
            border-slate-200
            rounded-xl
            p-6
          "
        >
          <p
            className="
              text-slate-600
            "
          >
            Loading monitored properties...
          </p>
        </div>
      )}

      {message && (
        <p
          className="
            mt-6
            text-red-600
            font-medium
          "
        >
          {message}
        </p>
      )}

      {!loading &&
        watchlist.length === 0 && (
          <div
            className="
              mt-8
              bg-slate-50
              border
              border-slate-200
              rounded-xl
              p-8
              text-center
            "
          >
            <h4
              className="
                text-lg
                font-bold
                text-slate-900
              "
            >
              No monitored properties
            </h4>

            <p
              className="
                text-slate-600
                mt-2
              "
            >
              Search for a property and
              select Save & Monitor Property.
            </p>
          </div>
        )}

      <div
        className="
          mt-8
          space-y-8
        "
      >
        {watchlist.map(
          (savedItem) => {
            const property =
              savedItem.properties;

            if (!property) {
              return null;
            }

            const cases =
              property.litigation_cases ||
              [];

            const risk =
              calculateRisk(cases);

            const hearings =
              getUpcomingHearings(
                cases
              );

            const activeCases =
              cases.filter(
                (item) => {
                  const status =
                    item.status
                      ?.toLowerCase();

                  return (
                    status ===
                      "pending" ||
                    status ===
                      "active"
                  );
                }
              );

            return (
              <div
                key={savedItem.id}
                className="
                  border
                  border-slate-200
                  rounded-2xl
                  overflow-hidden
                "
              >
                {/* PROPERTY HEADER */}

                <div
                  className="
                    p-6
                    bg-slate-50
                    border-b
                    border-slate-200
                  "
                >
                  <div
                    className="
                      flex
                      flex-col
                      lg:flex-row
                      lg:justify-between
                      gap-5
                    "
                  >
                    <div>
                      <p
                        className="
                          text-sm
                          text-slate-500
                        "
                      >
                        MONITORED PROPERTY
                      </p>

                      <h4
                        className="
                          text-2xl
                          font-bold
                          text-slate-950
                        "
                      >
                        Survey{" "}
                        {
                          property.survey_no
                        }
                        {property.subdivision &&
                          ` / ${property.subdivision}`}
                      </h4>

                      <p
                        className="
                          mt-2
                          text-slate-700
                        "
                      >
                        {
                          property.village
                        }
                        ,{" "}
                        {
                          property.district
                        }
                      </p>

                      <p
                        className="
                          text-sm
                          text-slate-500
                          mt-1
                        "
                      >
                        Owner:{" "}
                        {
                          property.owner_name
                        }
                      </p>
                    </div>

                    <div
                      className="
                        flex
                        items-start
                        gap-3
                        flex-wrap
                      "
                    >
                      <span
                        className={`
                          px-4
                          py-2
                          rounded-full
                          font-bold
                          ${
                            risk.level ===
                            "High"
                              ? "bg-red-100 text-red-700"
                              : risk.level ===
                                "Medium"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-green-100 text-green-700"
                          }
                        `}
                      >
                        {risk.level} Risk
                        {" • "}
                        {risk.score}
                      </span>

                      <button
                        onClick={() =>
                          removeProperty(
                            savedItem.id
                          )
                        }
                        className="
                          border
                          border-red-300
                          text-red-700
                          hover:bg-red-50
                          px-4
                          py-2
                          rounded-lg
                          text-sm
                          font-semibold
                        "
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div
                    className="
                      grid
                      sm:grid-cols-3
                      gap-4
                      mt-6
                    "
                  >
                    <Stat
                      title="Linked Cases"
                      value={
                        cases.length
                      }
                    />

                    <Stat
                      title="Active Cases"
                      value={
                        activeCases.length
                      }
                    />

                    <Stat
                      title="Upcoming Hearings"
                      value={
                        hearings.length
                      }
                    />
                  </div>
                </div>

                {/* ALERTS */}

                <div
                  className="
                    p-6
                  "
                >
                  <p
                    className="
                      text-sm
                      font-semibold
                      text-blue-700
                    "
                  >
                    MONITORING ALERTS
                  </p>

                  <h5
                    className="
                      text-xl
                      font-bold
                      text-slate-950
                      mt-1
                    "
                  >
                    Upcoming Hearings
                  </h5>

                  {hearings.length ===
                  0 ? (
                    <div
                      className="
                        mt-5
                        bg-green-50
                        border
                        border-green-200
                        rounded-xl
                        p-5
                      "
                    >
                      <p
                        className="
                          text-green-800
                          font-semibold
                        "
                      >
                        No upcoming hearings
                        found in available
                        records.
                      </p>
                    </div>
                  ) : (
                    <div
                      className="
                        mt-5
                        space-y-4
                      "
                    >
                      {hearings.map(
                        (
                          hearing
                        ) => {
                          const days =
                            daysUntil(
                              hearing.next_hearing!
                            );

                          return (
                            <div
                              key={
                                hearing.id
                              }
                              className="
                                bg-amber-50
                                border
                                border-amber-200
                                rounded-xl
                                p-5
                              "
                            >
                              <div
                                className="
                                  flex
                                  flex-col
                                  md:flex-row
                                  md:justify-between
                                  gap-4
                                "
                              >
                                <div>
                                  <p
                                    className="
                                      text-sm
                                      font-bold
                                      text-amber-700
                                    "
                                  >
                                    ⚠ UPCOMING
                                    HEARING
                                  </p>

                                  <h6
                                    className="
                                      text-lg
                                      font-bold
                                      text-slate-950
                                      mt-1
                                    "
                                  >
                                    {
                                      hearing.case_number
                                    }
                                  </h6>

                                  <p
                                    className="
                                      text-slate-700
                                      mt-1
                                    "
                                  >
                                    {
                                      hearing.court_name
                                    }
                                  </p>

                                  <p
                                    className="
                                      text-sm
                                      text-slate-600
                                    "
                                  >
                                    {
                                      hearing.case_type
                                    }
                                  </p>
                                </div>

                                <div
                                  className="
                                    md:text-right
                                  "
                                >
                                  <p
                                    className="
                                      font-bold
                                      text-slate-900
                                    "
                                  >
                                    {formatDate(
                                      hearing.next_hearing!
                                    )}
                                  </p>

                                  <span
                                    className="
                                      inline-block
                                      mt-2
                                      bg-amber-100
                                      text-amber-800
                                      px-3
                                      py-1
                                      rounded-full
                                      text-sm
                                      font-semibold
                                    "
                                  >
                                    {days ===
                                    0
                                      ? "Today"
                                      : days ===
                                        1
                                      ? "Tomorrow"
                                      : `In ${days} days`}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          }
        )}
      </div>

      <p
        className="
          text-xs
          text-slate-500
          mt-6
        "
      >
        Monitoring alerts are generated
        from litigation information
        currently stored in the prototype
        database. They are not official
        court notifications.
      </p>
    </div>
  );
}

function Stat({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div
      className="
        bg-white
        border
        border-slate-200
        rounded-xl
        p-4
      "
    >
      <p
        className="
          text-sm
          text-slate-500
        "
      >
        {title}
      </p>

      <p
        className="
          text-2xl
          font-bold
          text-slate-950
          mt-1
        "
      >
        {value}
      </p>
    </div>
  );
}