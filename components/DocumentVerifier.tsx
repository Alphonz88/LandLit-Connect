"use client";

import { useState } from "react";
import Tesseract from "tesseract.js";

type Property = {
  survey_no?: string;
  subdivision?: string;
  village?: string;
  owner_name?: string;
};

type Props = {
  property: Property;
};

export default function DocumentVerifier({
  property,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [ocrText, setOcrText] = useState("");
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function verifyDocument() {
    if (!file) {
      alert("Please upload a document first.");
      return;
    }

    setProcessing(true);
    setOcrText("");
    setResult(null);
    setProgress(0);

    try {
      const { data } =
        await Tesseract.recognize(
          file,
          "eng",
          {
            logger: (m) => {
              if (
                m.status ===
                "recognizing text" &&
                m.progress
              ) {
                setProgress(
                  Math.round(
                    m.progress * 100
                  )
                );
              }
            },
          }
        );

      const text = data.text || "";

      setOcrText(text);

      compareDocument(text);
    } catch (error) {
      console.log(error);
      alert("Unable to process document.");
    } finally {
      setProcessing(false);
    }
  }

  function compareDocument(text: string) {
    const normalizedText =
      text.toLowerCase();

    const survey =
      property.survey_no || "";

    const subdivision =
      property.subdivision || "";

    const village =
      property.village || "";

    const owner =
      property.owner_name || "";

    const surveyMatch =
      normalizedText.includes(
        survey.toLowerCase()
      );

    const subdivisionMatch =
      subdivision
        ? normalizedText.includes(
            subdivision.toLowerCase()
          )
        : true;

    const villageMatch =
      normalizedText.includes(
        village.toLowerCase()
      );

    const ownerMatch =
      normalizedText.includes(
        owner.toLowerCase()
      );

    const matches = [
      surveyMatch,
      subdivisionMatch,
      villageMatch,
      ownerMatch,
    ];

    const matched =
      matches.filter(Boolean).length;

    let status = "Mismatch";

    if (matched === matches.length) {
      status = "Verified";
    } else if (matched >= 2) {
      status = "Needs Review";
    }

    setResult({
      surveyMatch,
      subdivisionMatch,
      villageMatch,
      ownerMatch,
      matched,
      total: matches.length,
      status,
    });
  }

  return (
    <div className="
      bg-white
      border
      border-slate-200
      shadow-lg
      rounded-2xl
      p-8
    ">

      <div className="mb-6">

        <p className="
          text-sm
          font-semibold
          text-blue-700
        ">
          DOCUMENT VERIFICATION
        </p>

        <h3 className="
          text-2xl
          font-bold
          text-slate-950
        ">
          Verify Land Document
        </h3>

        <p className="
          mt-2
          text-slate-600
        ">
          Upload a land document and compare
          extracted information with the selected
          property record.
        </p>

      </div>

      <div className="
        border-2
        border-dashed
        border-slate-300
        rounded-xl
        p-8
        text-center
      ">

        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            setFile(
              e.target.files?.[0] ||
              null
            )
          }
          className="
            block
            mx-auto
            text-slate-700
          "
        />

        {file && (
          <p className="
            mt-3
            text-sm
            text-slate-600
          ">
            Selected: {file.name}
          </p>
        )}

      </div>

      <button
        onClick={verifyDocument}
        disabled={processing}
        className="
          mt-5
          bg-blue-700
          text-white
          px-6
          py-3
          rounded-lg
          font-semibold
          hover:bg-blue-800
          disabled:bg-slate-400
        "
      >
        {processing
          ? `Processing ${progress}%`
          : "Verify Document"}
      </button>

      {processing && (
        <div className="
          mt-4
          bg-slate-200
          rounded-full
          h-3
          overflow-hidden
        ">
          <div
            className="
              bg-blue-700
              h-full
              transition-all
            "
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      )}

      {result && (
        <div className="mt-8">

          <div
            className={`
              rounded-xl
              p-5
              border

              ${
                result.status ===
                "Verified"
                  ? "bg-green-50 border-green-300"
                  : result.status ===
                    "Needs Review"
                  ? "bg-amber-50 border-amber-300"
                  : "bg-red-50 border-red-300"
              }
            `}
          >

            <p className="
              text-sm
              font-medium
              text-slate-600
            ">
              Verification Result
            </p>

            <h4
              className={`
                text-2xl
                font-bold
                mt-1

                ${
                  result.status ===
                    "Verified"
                    ? "text-green-700"
                    : result.status ===
                      "Needs Review"
                    ? "text-amber-700"
                    : "text-red-700"
                }
              `}
            >
              {result.status}
            </h4>

            <p className="
              mt-2
              text-slate-700
            ">
              {result.matched} of{" "}
              {result.total} fields matched.
            </p>

          </div>

          <div className="
            grid
            md:grid-cols-2
            gap-4
            mt-5
          ">

            <MatchCard
              label="Survey Number"
              value={
                property.survey_no ||
                "N/A"
              }
              match={
                result.surveyMatch
              }
            />

            <MatchCard
              label="Subdivision"
              value={
                property.subdivision ||
                "N/A"
              }
              match={
                result.subdivisionMatch
              }
            />

            <MatchCard
              label="Village"
              value={
                property.village ||
                "N/A"
              }
              match={
                result.villageMatch
              }
            />

            <MatchCard
              label="Owner"
              value={
                property.owner_name ||
                "N/A"
              }
              match={
                result.ownerMatch
              }
            />

          </div>

        </div>
      )}

      {ocrText && (
        <details className="
          mt-8
          border
          border-slate-200
          rounded-xl
          p-5
        ">

          <summary className="
            cursor-pointer
            font-semibold
            text-slate-900
          ">
            View Extracted OCR Text
          </summary>

          <pre className="
            mt-4
            whitespace-pre-wrap
            text-sm
            text-slate-700
            bg-slate-50
            p-4
            rounded-lg
            max-h-64
            overflow-auto
          ">
            {ocrText}
          </pre>

        </details>
      )}

      <p className="
        text-xs
        text-slate-500
        mt-6
      ">
        OCR verification checks extracted
        information against available records.
        It does not certify that a document is
        legally authentic.
      </p>

    </div>
  );
}

function MatchCard({
  label,
  value,
  match,
}: {
  label: string;
  value: string;
  match: boolean;
}) {
  return (
    <div className="
      border
      border-slate-200
      rounded-xl
      p-4
    ">

      <div className="
        flex
        justify-between
        items-center
      ">

        <div>
          <p className="
            text-sm
            text-slate-500
          ">
            {label}
          </p>

          <p className="
            font-semibold
            text-slate-900
            mt-1
          ">
            {value}
          </p>
        </div>

        <span
          className={`
            px-3
            py-1
            rounded-full
            text-sm
            font-semibold

            ${
              match
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }
          `}
        >
          {match
            ? "Match"
            : "Mismatch"}
        </span>

      </div>

    </div>
  );
}