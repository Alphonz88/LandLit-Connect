# 🏡 LandLit Connect

### Smart Land Litigation Verification & Decision Support Platform

**Verify Before You Invest.**

LandLit Connect is a web-based prototype designed to help users explore property information and identify potential land litigation concerns through survey-number-based search, GIS visualization, litigation records, document verification, and risk indicators.

The platform aims to bring relevant property and litigation information into one place, making preliminary property verification more accessible.

---

## 🎥 Web Demo

[▶️ Watch the LandLit Connect Web Application Demo](https://drive.google.com/file/d/1QT7ZiComkPYdilqCXAqIhw9u1PDA6k2R/view?usp=drive_link)

---

## ✨ Key Features

- **Survey Number-Based Search** – Search property records using state, district, taluk, village, and survey number.
- **GIS-Based Property Visualization** – View available parcel geometries on an interactive map.
- **Litigation Verification** – Display litigation records associated with a property in the prototype database.
- **Litigation Risk Indicator** – Present an explainable Low, Medium, or High risk estimate based on configured factors.
- **OCR Document Verification** – Extract text from uploaded documents using OCR.
- **Property Monitoring** – Save properties to a watchlist for future reference.
- **Verification Report** – Generate a downloadable PDF containing the available property and litigation information.

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Styling | Tailwind CSS |
| Backend / API | Next.js |
| Database | PostgreSQL |
| Database Platform | Supabase |
| Geospatial | PostGIS, Leaflet, OpenStreetMap |
| OCR | Tesseract.js |
| PDF Generation | jsPDF |
| Development Tools | VS Code, Git, GitHub |

## 🔄 Application Workflow

1. Select the property location.
2. Enter the village and survey number.
3. Retrieve the matching property information available in the database.
4. View associated litigation records, if available.
5. Review the explainable litigation risk indicator.
6. Upload documents for OCR-based text extraction.
7. Save properties for monitoring.
8. Generate a property verification report.

## 🗺️ GIS and Location Data

The platform uses PostGIS for geospatial storage and spatial queries, with Leaflet and OpenStreetMap for map visualization.

**Important:** The accuracy of parcel visualization depends on the availability and quality of authoritative cadastral boundary data. PostGIS provides geospatial capabilities; it does not independently generate official land boundaries.

## 🧪 Project Status

LandLit Connect is an evolving prototype.

The current implementation demonstrates the application workflow using the data available in its database. Integration with authoritative government land records, court databases, and verified cadastral datasets remains an important area for further development.

## 🚀 Future Enhancements

- Integration with authoritative land-record databases.
- Court case data integration.
- Improved document validation and mismatch detection.
- Automated litigation status updates.
- More comprehensive GIS parcel coverage.
- Advanced property monitoring and notifications.

## ⚠️ Disclaimer

LandLit Connect is a preliminary information and decision-support prototype. Its risk indicators and displayed records are not legal opinions, official property-clearance certificates, or guarantees of ownership or litigation status.

Users should independently verify property details through the relevant government authorities and qualified legal professionals before making property decisions.

## 👨‍💻 Developer

**Alphonz Tony C**

B.Tech – Artificial Intelligence and Data Science

GitHub: [@Alphonz88](https://github.com/Alphonz88)

---
Smart Land Litigation Verification &amp; Decision Support Platform
>>>>>>> 7e58648d065cba364273e654e9164489104d486d
