# MechReport AI ⚙️
### Mechanical Quality Inspection Report Analyzer & Verification Engine

MechReport AI is a production-ready, privacy-preserving web application specifically engineered to read, extract, reconstruct, validate, compare, and audit mechanical inspection PDF documents—focusing on **ZEISS GEAR PRO 2023 SP1 Involute Lead Inspection** reports.

---

## 🌟 Key Features

1. **Native PDF Coordinate Extraction Engine**
   - High-precision text item extraction via `pdfjs-dist` preserving 2D coordinates $(X, Y)$, widths, heights, and rotated vertical margin streams.
   - Robust coordinate-based extraction that does not rely on arbitrary reading orders.
   - Built-in OCR fallback via `Tesseract.js` for scanned or rasterized reports.

2. **Accurate Measurement Table Reconstruction**
   - Reconstructs the 16-column bottom table:
     - **Left Flank ($-$)**: `Qn`, `[...]` (Tolerance), `Ø` (Average), Tooth `33`, Tooth `23`, Tooth `12`, Tooth `1`, `Qa`
     - **Crowning**: $vf_{H\beta}$ left and right crowning variation
     - **Right Flank ($+$)**: `Qa`, Tooth `1`, Tooth `12`, Tooth `23`, Tooth `33`, `Ø` (Average), `Qn`, `[...]` (Tolerance)
   - Accurately captures all 4 measurement rows:
     - **$F_\beta$ / $F_p$**: Total lead deviation ($\mu\text{m}$)
     - **$f_{f\beta}$ / $ffp$**: Lead form deviation ($\mu\text{m}$)
     - **$f_{H\beta}$**: Lead slope deviation ($\mu\text{m}$)
     - **$v_{fH\beta}$**: Lead crowning modification ($\mu\text{m}$)
   - Preserves negative numbers (e.g. $-90$, $-49$, $-38$), nulls, and decimal precision.

3. **Independent Tolerance Verification & Decision Engine**
   - Strictly separates the **Source ZEISS Status** (printed `not OK` or `OK`) from the **Calculated Status** (`OK`, `NOT_OK`, `INCOMPLETE`, `REVIEW_REQUIRED`).
   - Compares tooth-by-tooth measurements against extracted or user-configured DIN 3962 / ISO 1328 tolerance limits.
   - Provides explicit human-readable explanations and deviation quantities for every out-of-tolerance value.

4. **Interactive Results Inspector & Manual Override**
   - Interactive 16-column matrix highlighting out-of-tolerance values with visual warning borders.
   - Inline correction mode allowing quality engineers to adjust values and recalculate status in real time.
   - Traceability tab showing source file IDs, timestamps, and coordinate counts.
   - Embedded side-by-side original PDF preview.

5. **Multi-Report Comparison Analytics**
   - Compare 2 to 8 gear reports simultaneously.
   - Interactive trend charts (Recharts) displaying $f_{H\beta}$, $ffp$, and $F_p$ variations across parts with upper/lower tolerance reference lines.
   - Side-by-side comparative matrix across Teeth 1, 12, 23, 33 on both flanks.

6. **Export Center**
   - **Excel (.xlsx)**: Multi-sheet workbook (`Summary`, `Measurements`, `Tolerance Violations`).
   - **CSV**: Standard flat dataset for databases and SPC analysis tools.
   - **PDF Summary**: Formatted inspection certificate generated client-side via `jsPDF`.

7. **Client-Side Privacy & IndexedDB Storage**
   - 100% of PDF processing happens locally in the browser or on your dedicated server.
   - Zero confidential CAD or CMM inspection PDFs are sent to third-party AI APIs.
   - IndexedDB persistence for inspection history and custom drawing tolerances.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Icons & Visuals**: Lucide React, Recharts
- **PDF Extraction**: PDF.js (`pdfjs-dist`), Canvas API, Tesseract.js (OCR fallback)
- **Data Validation & Persistence**: Zod, IndexedDB (`idb-keyval`)
- **Exports**: SheetJS (`xlsx`), `jsPDF`, `jspdf-autotable`, native CSV generator
- **Deployment Platform**: Vercel

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18.x or 20.x+
- npm or yarn

### Installation
```bash
# Clone the repository and install dependencies
npm install
```

### Run Regression Test Suite
Run the automated regression test suite to verify extraction accuracy across all 8 provided ZEISS GEAR PRO reference reports:
```bash
npm run test:extraction
```
Expected output:
```text
======================================================================
   MECHREPORT AI: REGRESSION TEST SUITE (8 REFERENCE REPORTS)        
======================================================================

[PASS] M0166472_Z43_K13_260703 0047 C_04.11.2026_04.18.09.pdf
[PASS] M0166472_Z43_K13_260704  0048 B_04.11.2026_04.00.48.pdf
[PASS] M0166472_Z43_K13_260704 0004 B_04.11.2026_01.57.35.pdf
[PASS] M0166472_Z43_K13_260704 0036 B_03.11.2026_18.10.23.pdf
[PASS] M0166472_Z43_K13_260707 0045 C_04.11.2026_01.10.57.pdf
[PASS] M0166472_Z43_K13_260707 0057 C_04.11.2026_03.40.26.pdf
[PASS] M0166472_Z43_K13_260707 0058 C_04.11.2026_04.05.09.pdf
[PASS] M0166472_Z43_K13_260707 0060 C_04.11.2026_05.26.52.pdf

----------------------------------------------------------------------
Test Result: 8 / 8 sample reports passed.
----------------------------------------------------------------------
ALL 8 REFERENCE REPORTS VERIFIED ACCURATELY.
```

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm run start
```

---

## 🚢 Vercel Deployment

This project is structured for 1-click deployment on Vercel:
1. Push code to GitHub/GitLab.
2. Import project into Vercel.
3. Framework preset: **Next.js**.
4. Build command: `npm run build` (or `next build`).
5. Output directory: `.next`.
6. Deploy! All PDF worker scripts and sample assets are bundled statically under `/public`.

---

## ⚙️ Tested ZEISS Report Specifications

- **Drawing Number**: `M0166472_Z43_K13`
- **Revision (AE-Stand)**: `23_003500_24_002539`
- **Gear Type**: Involute external spur gear
- **Teeth Count ($z$)**: 43
- **Normal Module ($m_n$)**: 3.032 mm
- **Normal Pressure Angle ($\alpha_n$)**: 28.000°
- **Helix Angle ($\beta$)**: 0.000°
- **Profile Shift ($x$)**: -1.533
- **Pitch Diameter ($d$)**: 130.372 mm
- **Base Diameter ($d_b$)**: 115.112 mm
- **Root / Tip Diameters ($d_f / d_a$)**: 113.039 / 124.426 mm
- **Face Width ($b$)**: 38.400 mm
- **Inspection Standard**: DIN 3962:1978-08 / ISO 1328-1:2013-09
- **Tolerance Limits**:
  - $ff\beta \le 20\,\mu\text{m}$
  - $-38\,\mu\text{m} \le f_{H\beta} \le +30\,\mu\text{m}$ (Left)
  - $-37\,\mu\text{m} \le f_{H\beta} \le +30\,\mu\text{m}$ (Right)

