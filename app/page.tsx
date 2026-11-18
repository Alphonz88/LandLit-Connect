"use client";



import { useEffect, useState } from "react";

import dynamic from "next/dynamic";

import { jsPDF } from "jspdf";



import { supabase } from "@/lib/supabase";

import DocumentVerifier from "@/components/DocumentVerifier";

import PropertyWatchlist from "@/components/PropertyWatchlist";

import MyWatchlist from "@/components/MyWatchlist";



type StateItem = {

  id: number;

  name: string;

};



type DistrictItem = {

  id: number;

  state_id: number;

  name: string;

};



type TalukItem = {

  id: number;

  district_id: number;

  name: string;

};



type VillageItem = {

  id: number;

  taluk_id: number;

  name: string;

};



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



type DashboardData = {

  totalProperties: number;

  litigationProperties: number;

  activeCases: number;

  monitoredProperties: number;

  upcomingHearings: number;

  lowRisk: number;

  mediumRisk: number;

  highRisk: number;

};



const ParcelMap = dynamic<{

  parcels: MapParcel[];

  onSelectParcel: (

    village: string,

    surveyNo: string

  ) => void;

}>(() => import("@/components/ParcelMap"), {

  ssr: false,

});



export default function Home() {

  const [states, setStates] = useState<StateItem[]>([]);

  const [districts, setDistricts] =

    useState<DistrictItem[]>([]);

  const [taluks, setTaluks] =

    useState<TalukItem[]>([]);

  const [villages, setVillages] =

    useState<VillageItem[]>([]);

  const [surveyNumbers, setSurveyNumbers] =

    useState<string[]>([]);



  const [mapParcels, setMapParcels] =

    useState<MapParcel[]>([]);



  const [stateId, setStateId] = useState("");

  const [districtId, setDistrictId] = useState("");

  const [talukId, setTalukId] = useState("");

  const [villageId, setVillageId] = useState("");



  const [stateName, setStateName] = useState("");

  const [district, setDistrict] = useState("");

  const [taluk, setTaluk] = useState("");

  const [village, setVillage] = useState("");

  const [surveyNo, setSurveyNo] = useState("");



  const [property, setProperty] = useState<any>(null);

  const [message, setMessage] = useState("");

  const [searching, setSearching] = useState(false);

  const [locationLoading, setLocationLoading] =

    useState(true);

  const [mapLoading, setMapLoading] =

    useState(true);

  const [dashboardLoading, setDashboardLoading] =

    useState(true);



  const [dashboard, setDashboard] =

    useState<DashboardData>({

      totalProperties: 0,

      litigationProperties: 0,

      activeCases: 0,

      monitoredProperties: 0,

      upcomingHearings: 0,

      lowRisk: 0,

      mediumRisk: 0,

      highRisk: 0,

    });



  const cases =

    property?.litigation_cases || [];



  const risk = property

    ? calculateRisk(cases)

    : null;



  useEffect(() => {

    loadStates();

    loadDashboard();

    loadMapParcels();

  }, []);



  async function loadStates() {

    setLocationLoading(true);



    const { data, error } =

      await supabase

        .from("states")

        .select("id, name")

        .order("name");



    if (error) {

      logSupabaseError("Supabase request", error);

      setMessage(

        "Unable to load states."

      );

      setLocationLoading(false);

      return;

    }



    setStates(data || []);

    setLocationLoading(false);

  }



  async function loadDistricts(

    selectedStateId: string

  ) {

    setDistricts([]);

    setTaluks([]);

    setVillages([]);

    setSurveyNumbers([]);



    const { data, error } =

      await supabase

        .from("districts")

        .select(

          "id, state_id, name"

        )

        .eq(

          "state_id",

          Number(selectedStateId)

        )

        .order("name");



    if (error) {

      logSupabaseError("Supabase request", error);

      setMessage(

        "Unable to load districts."

      );

      return;

    }



    setDistricts(data || []);

  }



  async function loadTaluks(

    selectedDistrictId: string

  ) {

    setTaluks([]);

    setVillages([]);

    setSurveyNumbers([]);



    const { data, error } =

      await supabase

        .from("taluks")

        .select(

          "id, district_id, name"

        )

        .eq(

          "district_id",

          Number(selectedDistrictId)

        )

        .order("name");



    if (error) {

      logSupabaseError("Supabase request", error);

      setMessage(

        "Unable to load taluks."

      );

      return;

    }



    setTaluks(data || []);

  }



  async function loadVillages(

    selectedTalukId: string

  ) {

    setVillages([]);

    setSurveyNumbers([]);



    const { data, error } =

      await supabase

        .from("villages")

        .select(

          "id, taluk_id, name"

        )

        .eq(

          "taluk_id",

          Number(selectedTalukId)

        )

        .order("name");



    if (error) {

      logSupabaseError("Supabase request", error);

      setMessage(

        "Unable to load villages."

      );

      return;

    }



    setVillages(data || []);

  }



  async function loadSurveyNumbers(

    selectedVillage: string,

    selectedState = stateName,

    selectedDistrict = district,

    selectedTaluk = taluk

  ) {

    setSurveyNumbers([]);

    setSurveyNo("");



    const { data, error } =

      await supabase

        .from("properties")

        .select("survey_no")

        .eq("state", selectedState)

        .eq(

          "district",

          selectedDistrict

        )

        .eq("taluk", selectedTaluk)

        .eq(

          "village",

          selectedVillage

        )

        .order("survey_no");



    if (error) {

      logSupabaseError("Supabase request", error);

      setMessage(

        "Unable to load survey numbers."

      );

      return;

    }



    const numbers = Array.from(

      new Set(

        (data || [])

          .map(

            (item) =>

              item.survey_no

          )

          .filter(

            (

              value

            ): value is string =>

              typeof value ===

                "string" &&

              value.trim() !== ""

          )

      )

    ).sort((a, b) =>

      a.localeCompare(

        b,

        undefined,

        {

          numeric: true,

        }

      )

    );



    setSurveyNumbers(numbers);

  }



  async function loadMapParcels() {

    setMapLoading(true);



    const { data, error } =

      await supabase.rpc(

        "get_map_parcels"

      );



    if (error) {

      logSupabaseError("Supabase request", error);

      setMapParcels([]);

      setMapLoading(false);

      return;

    }



    setMapParcels(

      (data as MapParcel[]) ||

        []

    );



    setMapLoading(false);

  }



  async function loadDashboard() {

    setDashboardLoading(true);



    const {

      data: propertyData,

      error: propertyError,

    } = await supabase

      .from("properties")

      .select(`

        id,

        litigation_cases (

          id,

          status,

          filing_date,

          next_hearing

        )

      `);



    const {

      data: savedData,

      error: savedError,

    } = await supabase

      .from("saved_properties")

      .select("id");



    if (propertyError) {

      logSupabaseError("Dashboard properties", propertyError);

    }



    if (savedError) {

      logSupabaseError("Dashboard saved properties", savedError);

    }



    const properties =

      propertyData || [];



    let litigationProperties = 0;

    let activeCases = 0;

    let upcomingHearings = 0;

    let lowRisk = 0;

    let mediumRisk = 0;

    let highRisk = 0;



    const today = new Date();



    today.setHours(

      0,

      0,

      0,

      0

    );



    properties.forEach(

      (item: any) => {

        const propertyCases =

          item.litigation_cases ||

          [];



        if (

          propertyCases.length >

          0

        ) {

          litigationProperties++;

        }



        propertyCases.forEach(

          (caseItem: any) => {

            const status =

              caseItem.status

                ?.toLowerCase()

                .trim();



            if (

              status ===

                "pending" ||

              status === "active"

            ) {

              activeCases++;

            }



            if (

              caseItem.next_hearing

            ) {

              const hearingDate =

                new Date(

                  caseItem.next_hearing

                );



              hearingDate.setHours(

                0,

                0,

                0,

                0

              );



              if (

                hearingDate >=

                today

              ) {

                upcomingHearings++;

              }

            }

          }

        );



        const propertyRisk =

          calculateRisk(

            propertyCases

          );



        if (

          propertyRisk.level ===

          "High"

        ) {

          highRisk++;

        } else if (

          propertyRisk.level ===

          "Medium"

        ) {

          mediumRisk++;

        } else {

          lowRisk++;

        }

      }

    );



    setDashboard({

      totalProperties:

        properties.length,

      litigationProperties,

      activeCases,

      monitoredProperties:

        savedData?.length || 0,

      upcomingHearings,

      lowRisk,

      mediumRisk,

      highRisk,

    });



    setDashboardLoading(false);

  }



  async function fetchProperty(

    stateValue: string,

    districtValue: string,

    talukValue: string,

    villageValue: string,

    surveyValue: string

  ) {

    setMessage("");

    setProperty(null);

    setSearching(true);



    const { data, error } =

      await supabase

        .from("properties")

        .select(`

          *,

          litigation_cases (*)

        `)

        .eq(

          "state",

          stateValue

        )

        .eq(

          "district",

          districtValue

        )

        .eq(

          "taluk",

          talukValue

        )

        .eq(

          "village",

          villageValue

        )

        .eq(

          "survey_no",

          surveyValue

        )

        .limit(1);



    if (error) {

      logSupabaseError("Supabase request", error);



      setMessage(

        "Error: " +

          error.message

      );



      setSearching(false);

      return;

    }



    if (

      !data ||

      data.length === 0

    ) {

      setMessage(

        "No property record was found for the selected location and Survey Number."

      );



      setSearching(false);

      return;

    }



    setProperty(data[0]);

    setSearching(false);



    setTimeout(() => {

      document

        .getElementById(

          "property-result"

        )

        ?.scrollIntoView({

          behavior: "smooth",

          block: "start",

        });

    }, 150);

  }



  async function searchProperty() {

    if (

      !stateName ||

      !district ||

      !taluk ||

      !village ||

      !surveyNo

    ) {

      setMessage(

        "Please select State, District, Taluk / Tehsil, Village and Survey Number."

      );



      return;

    }



    await fetchProperty(

      stateName,

      district,

      taluk,

      village,

      surveyNo

    );

  }



  async function selectParcel(

    selectedVillage: string,

    selectedSurveyNo: string

  ) {

    setMessage("");



    const { data, error } =

      await supabase

        .from("properties")

        .select(`

          *,

          litigation_cases (*)

        `)

        .eq(

          "village",

          selectedVillage

        )

        .eq(

          "survey_no",

          selectedSurveyNo

        )

        .limit(1);



    if (error) {

      logSupabaseError("Supabase request", error);



      setMessage(

        "Unable to retrieve the selected parcel."

      );



      return;

    }



    if (

      !data ||

      data.length === 0

    ) {

      setMessage(

        "Selected GIS parcel could not be matched with the property database."

      );



      return;

    }



    const result = data[0];



    setStateName(

      result.state || ""

    );



    setDistrict(

      result.district || ""

    );



    setTaluk(

      result.taluk || ""

    );



    setVillage(

      result.village || ""

    );



    setSurveyNo(

      result.survey_no || ""

    );



    setProperty(result);



    const stateRecord =

      states.find(

        (item) =>

          item.name ===

          result.state

      );



    if (stateRecord) {

      setStateId(

        String(stateRecord.id)

      );



      const {

        data:

          districtData,

      } = await supabase

        .from("districts")

        .select(

          "id, state_id, name"

        )

        .eq(

          "state_id",

          stateRecord.id

        )

        .order("name");



      const availableDistricts =

        districtData || [];



      setDistricts(

        availableDistricts

      );



      const districtRecord =

        availableDistricts.find(

          (item) =>

            item.name ===

            result.district

        );



      if (districtRecord) {

        setDistrictId(

          String(

            districtRecord.id

          )

        );



        const {

          data:

            talukData,

        } = await supabase

          .from("taluks")

          .select(

            "id, district_id, name"

          )

          .eq(

            "district_id",

            districtRecord.id

          )

          .order("name");



        const availableTaluks =

          talukData || [];



        setTaluks(

          availableTaluks

        );



        const talukRecord =

          availableTaluks.find(

            (item) =>

              item.name ===

              result.taluk

          );



        if (talukRecord) {

          setTalukId(

            String(

              talukRecord.id

            )

          );



          const {

            data:

              villageData,

          } = await supabase

            .from("villages")

            .select(

              "id, taluk_id, name"

            )

            .eq(

              "taluk_id",

              talukRecord.id

            )

            .order("name");



          const availableVillages =

            villageData || [];



          setVillages(

            availableVillages

          );



          const villageRecord =

            availableVillages.find(

              (item) =>

                item.name ===

                result.village

            );



          if (

            villageRecord

          ) {

            setVillageId(

              String(

                villageRecord.id

              )

            );

          }

        }

      }

    }



    const {

      data: surveyData,

    } = await supabase

      .from("properties")

      .select("survey_no")

      .eq(

        "state",

        result.state

      )

      .eq(

        "district",

        result.district

      )

      .eq(

        "taluk",

        result.taluk

      )

      .eq(

        "village",

        result.village

      );



    const availableSurveyNumbers =

      Array.from(

        new Set(

          (surveyData || [])

            .map(

              (item) =>

                item.survey_no

            )

            .filter(

              (

                value

              ): value is string =>

                typeof value ===

                  "string" &&

                value.trim() !==

                  ""

            )

        )

      );



    setSurveyNumbers(

      availableSurveyNumbers

    );



    setTimeout(() => {

      document

        .getElementById(

          "property-result"

        )

        ?.scrollIntoView({

          behavior: "smooth",

          block: "start",

        });

    }, 150);

  }



  function downloadLandReport() {

    if (

      !property ||

      !risk

    ) {

      return;

    }



    const pdf =

      new jsPDF();



    let y = 20;



    const left = 15;



    function checkPage(

      requiredSpace = 15

    ) {

      if (

        y +

          requiredSpace >

        280

      ) {

        pdf.addPage();

        y = 20;

      }

    }



    function heading(

      text: string

    ) {

      checkPage(20);



      y += 5;



      pdf.setFont(

        "helvetica",

        "bold"

      );



      pdf.setFontSize(14);



      pdf.text(

        text,

        left,

        y

      );



      y += 10;

    }



    function field(

      label: string,

      value: any

    ) {

      checkPage(12);



      pdf.setFontSize(10);



      pdf.setFont(

        "helvetica",

        "bold"

      );



      pdf.text(

        `${label}:`,

        left,

        y

      );



      pdf.setFont(

        "helvetica",

        "normal"

      );



      const display =

        value !== null &&

        value !== undefined &&

        value !== ""

          ? String(value)

          : "Not Available";



      const lines =

        pdf.splitTextToSize(

          display,

          125

        );



      pdf.text(

        lines,

        60,

        y

      );



      y += Math.max(

        7,

        lines.length * 6

      );

    }



    pdf.setFont(

      "helvetica",

      "bold"

    );



    pdf.setFontSize(22);



    pdf.text(

      "LandLit Connect",

      left,

      y

    );



    y += 8;



    pdf.setFontSize(11);



    pdf.setFont(

      "helvetica",

      "normal"

    );



    pdf.text(

      "Land Litigation Verification & Decision Support Report",

      left,

      y

    );



    y += 6;



    pdf.text(

      "Verify Before You Invest",

      left,

      y

    );



    y += 10;



    pdf.line(

      15,

      y,

      195,

      y

    );



    y += 10;



    field(

      "Generated",

      new Date().toLocaleString(

        "en-IN"

      )

    );



    heading(

      "1. Property Details"

    );



    field(

      "State",

      property.state

    );



    field(

      "District",

      property.district

    );



    field(

      "Taluk / Tehsil",

      property.taluk

    );



    field(

      "Village",

      property.village

    );



    field(

      "Survey Number",

      property.survey_no

    );



    field(

      "Subdivision",

      property.subdivision

    );



    field(

      "Owner",

      property.owner_name

    );



    field(

      "Area",

      property.area

    );



    field(

      "Land Type",

      property.land_type

    );



    heading(

      "2. Litigation Risk Assessment"

    );



    field(

      "Risk Level",

      risk.level

    );



    field(

      "Risk Score",

      `${risk.score} / 100`

    );



    field(

      "Linked Cases",

      cases.length

    );



    field(

      "Risk Factors",

      risk.reasons.length > 0

        ? risk.reasons.join(

            ", "

          )

        : "No major litigation risk factors found in the available records."

    );



    heading(

      "3. Litigation Cases"

    );



    if (

      cases.length === 0

    ) {

      field(

        "Result",

        "No litigation cases found in the available records."

      );

    } else {

      cases.forEach(

        (

          item: any,

          index: number

        ) => {

          checkPage(50);



          pdf.setFont(

            "helvetica",

            "bold"

          );



          pdf.setFontSize(12);



          pdf.text(

            `Case ${index + 1}`,

            left,

            y

          );



          y += 8;



          field(

            "Case Number",

            item.case_number

          );



          field(

            "Court",

            item.court_name

          );



          field(

            "Case Type",

            item.case_type

          );



          field(

            "Status",

            item.status

          );



          field(

            "Filing Date",

            formatDate(

              item.filing_date

            )

          );



          field(

            "Next Hearing",

            formatDate(

              item.next_hearing

            )

          );



          y += 4;

        }

      );

    }



    heading(

      "4. Disclaimer"

    );



    const disclaimer =

      "This report is generated by the LandLit Connect prototype using records currently available in its database. Parcel geometry is only as accurate as the cadastral or GIS geometry supplied to the PostGIS database. A low risk score or absence of litigation records does not guarantee that a property is legally dispute-free. This report is intended for decision support only and does not replace official land-record, court or professional legal verification.";



    const lines =

      pdf.splitTextToSize(

        disclaimer,

        180

      );



    checkPage(

      lines.length * 6

    );



    pdf.setFont(

      "helvetica",

      "normal"

    );



    pdf.setFontSize(9);



    pdf.text(

      lines,

      left,

      y

    );



    const totalPages =

      pdf.getNumberOfPages();



    for (

      let i = 1;

      i <= totalPages;

      i++

    ) {

      pdf.setPage(i);



      pdf.setFontSize(8);



      pdf.text(

        `LandLit Connect | Page ${i} of ${totalPages}`,

        105,

        290,

        {

          align: "center",

        }

      );

    }



    pdf.save(

      `LandLit_Report_${property.survey_no}.pdf`

    );

  }



  return (

    <main className="min-h-screen bg-slate-100 text-slate-900">

      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">

        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

          <div>

            <h1 className="text-2xl font-bold text-blue-700">

              LandLit Connect

            </h1>



            <p className="text-xs text-slate-500">

              Verify Before You Invest

            </p>

          </div>



          <div className="hidden lg:flex gap-6 text-sm font-semibold text-slate-600">

            <a

              href="#home"

              className="hover:text-blue-700"

            >

              Home

            </a>



            <a

              href="#verify"

              className="hover:text-blue-700"

            >

              Verify

            </a>



            <a

              href="#gis"

              className="hover:text-blue-700"

            >

              GIS Map

            </a>



            <a

              href="#watchlist"

              className="hover:text-blue-700"

            >

              Watchlist

            </a>

          </div>



          <span className="hidden md:inline-flex bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold">

            Smart Land Verification

          </span>

        </div>

      </nav>



      <section className="max-w-7xl mx-auto px-6 py-10">

        <div

          id="home"

          className="scroll-mt-28"

        >

          <p className="text-sm font-bold text-blue-700">

            LANDLIT CONNECT

          </p>



          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-5">

            <div>

              <h2 className="text-4xl font-bold text-slate-950 mt-2">

                Land Litigation Overview

              </h2>



              <p className="text-slate-600 mt-3 max-w-2xl">

                Property records,

                litigation activity,

                parcel mapping,

                risk assessment,

                monitoring and upcoming

                hearing information.

              </p>

            </div>



            <button

              onClick={

                loadDashboard

              }

              className="border border-blue-300 bg-white text-blue-700 hover:bg-blue-50 px-5 py-2 rounded-lg font-semibold"

            >

              Refresh Home

            </button>

          </div>



          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-8">

            <DashboardCard

              title="Total Properties"

              value={

                dashboardLoading

                  ? "..."

                  : dashboard.totalProperties

              }

              subtitle="Database records"

            />



            <DashboardCard

              title="Litigation Properties"

              value={

                dashboardLoading

                  ? "..."

                  : dashboard.litigationProperties

              }

              subtitle="Properties with cases"

            />



            <DashboardCard

              title="Active Cases"

              value={

                dashboardLoading

                  ? "..."

                  : dashboard.activeCases

              }

              subtitle="Pending / active"

            />



            <DashboardCard

              title="Monitored"

              value={

                dashboardLoading

                  ? "..."

                  : dashboard.monitoredProperties

              }

              subtitle="Saved properties"

            />



            <DashboardCard

              title="Upcoming Hearings"

              value={

                dashboardLoading

                  ? "..."

                  : dashboard.upcomingHearings

              }

              subtitle="Future hearings"

            />

          </div>



          <div className="mt-6 bg-white border border-slate-200 rounded-2xl shadow-sm p-7">

            <p className="text-sm font-semibold text-blue-700">

              RISK DISTRIBUTION

            </p>



            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mt-2">

              <div>

                <h3 className="text-2xl font-bold text-slate-950">

                  Property Risk Overview

                </h3>



                <p className="text-sm text-slate-500 mt-2">

                  Calculated from

                  litigation records

                  available in the

                  prototype database.

                </p>

              </div>



              <div className="grid grid-cols-3 gap-3">

                <RiskStat

                  title="Low"

                  value={

                    dashboard.lowRisk

                  }

                  type="low"

                />



                <RiskStat

                  title="Medium"

                  value={

                    dashboard.mediumRisk

                  }

                  type="medium"

                />



                <RiskStat

                  title="High"

                  value={

                    dashboard.highRisk

                  }

                  type="high"

                />

              </div>

            </div>

          </div>

        </div>



        <div

          id="verify"

          className="mt-12 scroll-mt-28"

        >

          <p className="text-sm font-semibold text-blue-700">

            PROPERTY VERIFICATION

          </p>



          <h3 className="text-3xl font-bold text-slate-950 mt-1">

            Verify a Property

          </h3>



          <p className="text-slate-600 mt-2">

            Select State, District,

            Taluk / Tehsil, Village

            and Survey Number.

          </p>



          <div className="mt-5 bg-white border border-slate-200 shadow-lg rounded-2xl p-8">

            {locationLoading ? (

              <p className="text-slate-600">

                Loading locations...

              </p>

            ) : (

              <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-5">

                <SelectField

                  label="State"

                  value={stateId}

                  placeholder="Select State"

                  options={states}

                  onChange={async (

                    id

                  ) => {

                    const selected =

                      states.find(

                        (

                          item

                        ) =>

                          String(

                            item.id

                          ) === id

                      );



                    setStateId(id);



                    setStateName(

                      selected?.name ||

                        ""

                    );



                    setDistrictId("");

                    setDistrict("");

                    setTalukId("");

                    setTaluk("");

                    setVillageId("");

                    setVillage("");

                    setSurveyNo("");

                    setProperty(null);

                    setMessage("");



                    if (id) {

                      await loadDistricts(

                        id

                      );

                    }

                  }}

                />



                <SelectField

                  label="District"

                  value={

                    districtId

                  }

                  placeholder={

                    !stateId

                      ? "Select State First"

                      : districts.length ===

                        0

                      ? "No District Data"

                      : "Select District"

                  }

                  options={

                    districts

                  }

                  disabled={

                    !stateId ||

                    districts.length ===

                      0

                  }

                  onChange={async (

                    id

                  ) => {

                    const selected =

                      districts.find(

                        (

                          item

                        ) =>

                          String(

                            item.id

                          ) === id

                      );



                    setDistrictId(

                      id

                    );



                    setDistrict(

                      selected?.name ||

                        ""

                    );



                    setTalukId("");

                    setTaluk("");

                    setVillageId("");

                    setVillage("");

                    setSurveyNo("");

                    setProperty(null);

                    setMessage("");



                    if (id) {

                      await loadTaluks(

                        id

                      );

                    }

                  }}

                />



                <SelectField

                  label="Taluk / Tehsil"

                  value={talukId}

                  placeholder={

                    !districtId

                      ? "Select District First"

                      : taluks.length ===

                        0

                      ? "No Taluk Data"

                      : "Select Taluk / Tehsil"

                  }

                  options={taluks}

                  disabled={

                    !districtId ||

                    taluks.length ===

                      0

                  }

                  onChange={async (

                    id

                  ) => {

                    const selected =

                      taluks.find(

                        (

                          item

                        ) =>

                          String(

                            item.id

                          ) === id

                      );



                    setTalukId(id);



                    setTaluk(

                      selected?.name ||

                        ""

                    );



                    setVillageId("");

                    setVillage("");

                    setSurveyNo("");

                    setProperty(null);

                    setMessage("");



                    if (id) {

                      await loadVillages(

                        id

                      );

                    }

                  }}

                />



                <SelectField

                  label="Village"

                  value={

                    villageId

                  }

                  placeholder={

                    !talukId

                      ? "Select Taluk First"

                      : villages.length ===

                        0

                      ? "No Village Data"

                      : "Select Village"

                  }

                  options={

                    villages

                  }

                  disabled={

                    !talukId ||

                    villages.length ===

                      0

                  }

                  onChange={async (

                    id

                  ) => {

                    const selected =

                      villages.find(

                        (

                          item

                        ) =>

                          String(

                            item.id

                          ) === id

                      );



                    setVillageId(

                      id

                    );



                    setVillage(

                      selected?.name ||

                        ""

                    );



                    setSurveyNo("");

                    setProperty(null);

                    setMessage("");



                    if (

                      selected?.name

                    ) {

                      await loadSurveyNumbers(

                        selected.name

                      );

                    }

                  }}

                />



                <SelectStringField

                  label="Survey Number"

                  value={surveyNo}

                  placeholder={

                    !village

                      ? "Select Village First"

                      : surveyNumbers.length ===

                        0

                      ? "No Survey Records"

                      : "Select Survey No."

                  }

                  options={

                    surveyNumbers

                  }

                  disabled={

                    !village ||

                    surveyNumbers.length ===

                      0

                  }

                  onChange={(

                    value

                  ) => {

                    setSurveyNo(

                      value

                    );



                    setProperty(

                      null

                    );



                    setMessage("");

                  }}

                />

              </div>

            )}



            <button

              onClick={

                searchProperty

              }

              disabled={

                searching

              }

              className="mt-7 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-400 text-white px-8 py-3 rounded-lg font-semibold"

            >

              {searching

                ? "Verifying..."

                : "Verify Property"}

            </button>



            {message && (

              <div className="mt-5 bg-red-50 border border-red-200 rounded-lg p-4">

                <p className="text-red-700 font-medium">

                  {message}

                </p>

              </div>

            )}

          </div>

        </div>



        {property && (

          <div

            id="property-result"

            className="mt-8 bg-white border border-slate-200 shadow-lg rounded-2xl p-8 scroll-mt-28"

          >

            <div className="flex flex-col lg:flex-row lg:justify-between gap-5">

              <div>

                <p className="text-sm font-semibold text-blue-700">

                  PROPERTY FOUND

                </p>



                <h3 className="text-3xl font-bold text-slate-950 mt-1">

                  Survey{" "}

                  {

                    property.survey_no

                  }



                  {property.subdivision &&

                    ` / ${property.subdivision}`}

                </h3>

              </div>



              <div className="flex gap-3 flex-wrap items-start">

                <span className="bg-amber-100 text-amber-800 border border-amber-200 px-4 py-2 rounded-full font-semibold">

                  Prototype Data

                </span>



                <button

                  onClick={

                    downloadLandReport

                  }

                  className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-lg font-semibold"

                >

                  Download PDF Report

                </button>

              </div>

            </div>



            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 mt-8">

              <Info

                title="State"

                value={

                  property.state

                }

              />



              <Info

                title="District"

                value={

                  property.district

                }

              />



              <Info

                title="Taluk / Tehsil"

                value={

                  property.taluk

                }

              />



              <Info

                title="Village"

                value={

                  property.village

                }

              />



              <Info

                title="Survey Number"

                value={

                  property.survey_no

                }

              />



              <Info

                title="Subdivision"

                value={

                  property.subdivision

                }

              />



              <Info

                title="Owner"

                value={

                  property.owner_name

                }

              />



              <Info

                title="Area"

                value={

                  property.area

                }

              />



              <Info

                title="Land Type"

                value={

                  property.land_type

                }

              />

            </div>

          </div>

        )}



        {property && (

          <div className="mt-8 grid lg:grid-cols-3 gap-6">

            <div className="lg:col-span-2 bg-white border border-slate-200 shadow-lg rounded-2xl p-8">

              <p className="text-sm font-semibold text-blue-700">

                LITIGATION DETAILS

              </p>



              <div className="flex justify-between items-center gap-4">

                <h3 className="text-2xl font-bold text-slate-950">

                  Linked Cases

                </h3>



                <span className="bg-red-100 text-red-700 px-4 py-2 rounded-full font-semibold">

                  {cases.length}{" "}

                  Case(s)

                </span>

              </div>



              {cases.length ===

              0 ? (

                <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-5">

                  <p className="text-green-800 font-semibold">

                    No litigation

                    cases found in

                    the available

                    records.

                  </p>



                  <p className="text-sm text-green-700 mt-2">

                    This does not

                    guarantee that

                    the property is

                    legally

                    dispute-free.

                  </p>

                </div>

              ) : (

                <div className="space-y-5 mt-6">

                  {cases.map(

                    (

                      item: any

                    ) => (

                      <div

                        key={

                          item.id

                        }

                        className="border border-slate-200 rounded-xl p-5"

                      >

                        <div className="flex justify-between gap-4">

                          <div>

                            <p className="text-sm text-slate-500">

                              Case

                              Number

                            </p>



                            <h4 className="text-xl font-bold text-slate-900">

                              {

                                item.case_number

                              }

                            </h4>

                          </div>



                          <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-semibold self-start">

                            {

                              item.status

                            }

                          </span>

                        </div>



                        <div className="grid md:grid-cols-2 gap-5 mt-5">

                          <Info

                            title="Court"

                            value={

                              item.court_name

                            }

                          />



                          <Info

                            title="Case Type"

                            value={

                              item.case_type

                            }

                          />



                          <Info

                            title="Filed On"

                            value={formatDate(

                              item.filing_date

                            )}

                          />



                          <Info

                            title="Next Hearing"

                            value={formatDate(

                              item.next_hearing

                            )}

                          />

                        </div>

                      </div>

                    )

                  )}

                </div>

              )}

            </div>



            {risk && (

              <div className="bg-white border border-slate-200 shadow-lg rounded-2xl p-8">

                <p className="text-sm font-semibold text-blue-700">

                  LITIGATION RISK

                </p>



                <h3 className="text-2xl font-bold text-slate-950 mt-1">

                  Risk Assessment

                </h3>



                <div className="text-center mt-8">

                  <div

                    className={`inline-flex items-center justify-center w-28 h-28 rounded-full text-3xl font-bold ${

                      risk.level ===

                      "High"

                        ? "bg-red-100 text-red-700"

                        : risk.level ===

                          "Medium"

                        ? "bg-amber-100 text-amber-700"

                        : "bg-green-100 text-green-700"

                    }`}

                  >

                    {risk.score}

                  </div>



                  <p

                    className={`text-2xl font-bold mt-4 ${

                      risk.level ===

                      "High"

                        ? "text-red-700"

                        : risk.level ===

                          "Medium"

                        ? "text-amber-700"

                        : "text-green-700"

                    }`}

                  >

                    {risk.level}{" "}

                    Risk

                  </p>



                  <p className="text-sm text-slate-500">

                    Score out of

                    100

                  </p>

                </div>



                <div className="mt-8">

                  <h4 className="font-bold text-slate-900">

                    Why this

                    risk?

                  </h4>



                  <div className="space-y-3 mt-4">

                    {risk.reasons

                      .length > 0 ? (

                      risk.reasons.map(

                        (

                          reason: string,

                          index: number

                        ) => (

                          <div

                            key={

                              index

                            }

                            className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700"

                          >

                            ✓{" "}

                            {

                              reason

                            }

                          </div>

                        )

                      )

                    ) : (

                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700">

                        No major

                        litigation

                        risk factors

                        found in

                        available

                        records.

                      </div>

                    )}

                  </div>

                </div>



                <p className="text-xs text-slate-500 mt-8 border-t pt-4">

                  Decision-support

                  result based on

                  available records.

                  This is not a

                  legal certificate.

                </p>

              </div>

            )}

          </div>

        )}



        {property && (

          <div className="mt-10">

            <DocumentVerifier

              property={property}

            />

          </div>

        )}



        {property && (

          <div className="mt-10">

            <PropertyWatchlist

              property={property}

            />

          </div>

        )}



        <div

          id="gis"

          className="mt-12 scroll-mt-28"

        >

          <p className="text-sm font-semibold text-blue-700">

            GIS LAND VIEW

          </p>



          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">

            <div>

              <h3 className="text-3xl font-bold text-slate-950 mt-1">

                Interactive Parcel Map

              </h3>



              <p className="text-slate-600 mt-2">

                Parcel boundaries

                are stored and

                processed using

                PostGIS.

              </p>

            </div>



            <div className="flex gap-3">

              <span className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-semibold text-slate-700">

                {

                  mapParcels.length

                }{" "}

                mapped parcel(s)

              </span>



              <button

                onClick={

                  loadMapParcels

                }

                className="bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-semibold"

              >

                Refresh Map

              </button>

            </div>

          </div>



          <div className="mt-5">

            {mapLoading ? (

              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-600">

                Loading parcel

                map...

              </div>

            ) : mapParcels.length ===

              0 ? (

              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">

                <h4 className="text-xl font-bold text-slate-900">

                  No parcel

                  geometry

                  available

                </h4>



                <p className="text-slate-500 mt-2">

                  Add valid PostGIS

                  parcel geometry to

                  the properties

                  table.

                </p>

              </div>

            ) : (

              <ParcelMap

                parcels={

                  mapParcels

                }

                onSelectParcel={

                  selectParcel

                }

              />

            )}

          </div>



          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">

            <p className="text-sm text-blue-800">

              PostGIS stores the

              parcel geometry, but

              the boundary is only

              accurate when the

              original cadastral or

              GIS coordinates are

              accurate.

            </p>

          </div>

        </div>



        <div

          id="watchlist"

          className="mt-12 scroll-mt-28"

        >

          <MyWatchlist />

        </div>



        <div className="mt-12 border-t border-slate-200 pt-7 pb-10 text-center">

          <p className="text-sm text-slate-500 max-w-4xl mx-auto">

            LandLit Connect is a

            prototype

            decision-support

            platform. Results

            depend on available

            records and GIS data

            and do not replace

            official land-record,

            court or legal

            verification.

          </p>

        </div>

      </section>

    </main>

  );

}




function logSupabaseError(
  context: string,
  error: {
    message?: string | null;
    code?: string | null;
    details?: string | null;
    hint?: string | null;
  } | null
) {
  if (!error) return;

  console.log(`[${context}]`, {
    message: error.message ?? "Unknown Supabase error",
    code: error.code ?? "",
    details: error.details ?? "",
    hint: error.hint ?? "",
  });
}

function SelectField({

  label,

  value,

  placeholder,

  options,

  disabled = false,

  onChange,

}: {

  label: string;

  value: string;

  placeholder: string;

  options: {

    id: number;

    name: string;

  }[];

  disabled?: boolean;

  onChange: (

    value: string

  ) => void;

}) {

  return (

    <div>

      <label className="font-semibold text-slate-800">

        {label}

      </label>



      <select

        value={value}

        disabled={disabled}

        onChange={(e) =>

          onChange(

            e.target.value

          )

        }

        className="w-full mt-2 border border-slate-300 rounded-lg p-3 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"

      >

        <option value="">

          {placeholder}

        </option>



        {options.map(

          (item) => (

            <option

              key={item.id}

              value={

                item.id

              }

            >

              {item.name}

            </option>

          )

        )}

      </select>

    </div>

  );

}



function SelectStringField({

  label,

  value,

  placeholder,

  options,

  disabled = false,

  onChange,

}: {

  label: string;

  value: string;

  placeholder: string;

  options: string[];

  disabled?: boolean;

  onChange: (

    value: string

  ) => void;

}) {

  return (

    <div>

      <label className="font-semibold text-slate-800">

        {label}

      </label>



      <select

        value={value}

        disabled={disabled}

        onChange={(e) =>

          onChange(

            e.target.value

          )

        }

        className="w-full mt-2 border border-slate-300 rounded-lg p-3 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"

      >

        <option value="">

          {placeholder}

        </option>



        {options.map(

          (item) => (

            <option

              key={item}

              value={item}

            >

              {item}

            </option>

          )

        )}

      </select>

    </div>

  );

}



function DashboardCard({

  title,

  value,

  subtitle,

}: {

  title: string;

  value:

    | number

    | string;

  subtitle: string;

}) {

  return (

    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 hover:shadow-md transition">

      <p className="text-sm font-semibold text-slate-500">

        {title}

      </p>



      <p className="text-4xl font-bold text-slate-950 mt-3">

        {value}

      </p>



      <p className="text-xs text-slate-500 mt-2">

        {subtitle}

      </p>

    </div>

  );

}



function RiskStat({

  title,

  value,

  type,

}: {

  title: string;

  value: number;

  type:

    | "low"

    | "medium"

    | "high";

}) {

  const style =

    type === "high"

      ? "bg-red-50 border-red-200 text-red-700"

      : type ===

        "medium"

      ? "bg-amber-50 border-amber-200 text-amber-700"

      : "bg-green-50 border-green-200 text-green-700";



  return (

    <div

      className={`border rounded-xl px-5 py-4 text-center ${style}`}

    >

      <p className="text-2xl font-bold">

        {value}

      </p>



      <p className="text-xs font-semibold mt-1">

        {title}

      </p>

    </div>

  );

}



function calculateRisk(

  cases: any[]

) {

  let score = 0;



  const reasons: string[] =

    [];



  const activeCases =

    cases.filter(

      (item) => {

        const status =

          item.status

            ?.toLowerCase()

            .trim();



        return (

          status ===

            "pending" ||

          status ===

            "active"

        );

      }

    );



  if (

    activeCases.length >

    0

  ) {

    score += 40;



    reasons.push(

      `${activeCases.length} active/pending case(s)`

    );

  }



  if (cases.length > 1) {

    score += 20;



    reasons.push(

      "Multiple litigation cases found"

    );

  }



  const recentCases =

    cases.filter(

      (item) => {

        if (

          !item.filing_date

        ) {

          return false;

        }



        const filingDate =

          new Date(

            item.filing_date

          );



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



        return (

          years >= 0 &&

          years <= 2

        );

      }

    );



  if (

    recentCases.length >

    0

  ) {

    score += 15;



    reasons.push(

      "Recent litigation activity"

    );

  }



  score =

    Math.min(

      score,

      100

    );



  let level = "Low";



  if (score >= 61) {

    level = "High";

  } else if (

    score >= 31

  ) {

    level = "Medium";

  }



  return {

    score,

    level,

    reasons,

  };

}



function formatDate(

  date:

    | string

    | null

) {

  if (!date) {

    return "Not Available";

  }



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



function Info({

  title,

  value,

}: {

  title: string;

  value?:

    | string

    | number

    | null;

}) {

  return (

    <div>

      <p className="text-sm font-medium text-slate-500">

        {title}

      </p>



      <p className="text-lg font-semibold text-slate-900 mt-1">

        {value !== null &&

        value !==

          undefined &&

        value !== ""

          ? String(value)

          : "Not Available"}

      </p>

    </div>

  );

}