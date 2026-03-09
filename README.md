# Car Data Scraper

A Chrome extension that uses **Claude AI** to extract car listing data (VIN, make, model, year, price, mileage, etc.) from any webpage. The user reviews the extracted data, edits if needed, and pushes it to a configurable API endpoint.

## Architecture

```
┌─────────────────────────────────┐
│  Chrome Extension (Manifest V3) │
│  ┌─────────────┐ ┌───────────┐  │
│  │   Popup UI  │ │  Options  │  │
│  │  (React)    │ │  (React)  │  │
│  └──────┬──────┘ └───────────┘  │
│         │ chrome.runtime.msg     │
│  ┌──────▼──────────────────┐    │
│  │   Background Service    │    │
│  │       Worker            │    │
│  └──────┬──────────────────┘    │
│         │ chrome.tabs.msg        │
│  ┌──────▼──────────────────┐    │
│  │   Content Script        │    │
│  │  (captures page HTML)   │    │
│  └─────────────────────────┘    │
└──────────┬──────────────────────┘
           │ POST /extract
┌──────────▼──────────────────────┐
│  Backend (Express + TypeScript) │
│  ┌──────────────────────────┐   │
│  │    Claude Haiku API      │   │
│  │  (structured extraction) │   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘
           │ POST (user action)
┌──────────▼──────────────────────┐
│     Your API Endpoint           │
└─────────────────────────────────┘
```

### How it works

1. User navigates to any car listing page
2. Clicks the extension icon → "Scan Page"
3. Content script captures the page HTML (scripts/styles removed, capped at 400 KB)
4. Background worker sends the HTML to the **backend**
5. Backend calls **Claude Haiku** with a structured extraction prompt
6. Claude returns JSON with all detected car fields
7. Popup shows an editable form with the extracted data
8. User reviews, edits if needed, clicks **"Push to API"**
9. Background worker POSTs the data to your configured API endpoint

---

## Project Structure

```
glowing-succotash/
├── backend/                # Express server — calls Claude API
│   ├── src/
│   │   ├── index.ts        # HTTP server (POST /extract, GET /health)
│   │   ├── extractCarData.ts  # Claude API integration
│   │   └── types.ts        # Shared TypeScript types
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── extension/              # Chrome Extension (Manifest V3)
│   ├── manifest.json
│   ├── popup/index.html    # Popup entry HTML
│   ├── options/index.html  # Options page entry HTML
│   ├── public/icons/       # PNG icons (16, 48, 128px)
│   ├── src/
│   │   ├── types/          # CarData, StorageConfig, message types
│   │   ├── utils/          # chrome.storage helpers
│   │   ├── background/     # Service worker
│   │   ├── content/        # Content script (HTML capture)
│   │   ├── popup/          # React popup UI
│   │   └── options/        # React options page
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── scripts/
    └── generate-icons.js   # Generates placeholder PNG icons
```

---

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set your ANTHROPIC_API_KEY
npm install
npm run dev        # development (tsx watch)
# or
npm run build && npm start   # production
```

The backend listens on `http://localhost:3000` by default.

### 2. Chrome Extension

```bash
cd extension
npm install
npm run build      # outputs to extension/dist/
# For development with watch mode:
npm run dev
```

Load the extension in Chrome:
1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** → select the `extension/dist/` folder

### 3. Configure the Extension

1. Click the extension icon in Chrome → **Settings** (top right of popup)
2. Set **Backend URL**: `http://localhost:3000` (or your deployed backend URL)
3. Click **Test Connection** to verify
4. Set **API Endpoint URL**: where car data should be POSTed
5. Optionally set an **Auth Token**
6. Click **Save Settings**

---

## Extracted Car Fields

| Field | Type | Description |
|---|---|---|
| `vin` | string | 17-char Vehicle Identification Number |
| `make` | string | Manufacturer / brand (e.g. "Toyota") |
| `model` | string | Model name (e.g. "Camry") |
| `year` | number | Model year |
| `trim` | string | Trim level (e.g. "XSE") |
| `price` | number | Listed price (numeric, no currency symbol) |
| `priceCurrency` | string | ISO 4217 currency code (e.g. "USD") |
| `mileage` | number | Odometer reading |
| `mileageUnit` | "km"/"mi" | Mileage unit |
| `color` | string | Exterior color |
| `transmission` | enum | automatic / manual / cvt / other |
| `fuelType` | enum | gasoline / diesel / electric / hybrid / other |
| `engine` | string | Engine description |
| `bodyStyle` | string | sedan / suv / truck / etc. |
| `driveType` | string | AWD / FWD / RWD / 4WD |
| `doors` | number | Number of doors |
| `condition` | enum | new / used / certified |
| `stockNumber` | string | Dealer stock number |
| `description` | string | Brief listing description |
| `sourceUrl` | string | Page URL |
| `extractedAt` | string | ISO 8601 timestamp |

---

## API Payload

The extension POSTs the `CarData` object as JSON:

```json
{
  "vin": "1HGBH41JXMN109186",
  "make": "Honda",
  "model": "Civic",
  "year": 2021,
  "trim": "Sport",
  "price": 24500,
  "priceCurrency": "USD",
  "mileage": 15200,
  "mileageUnit": "mi",
  "color": "Sonic Gray Pearl",
  "transmission": "automatic",
  "fuelType": "gasoline",
  "engine": "1.5L Turbocharged",
  "bodyStyle": "Sedan",
  "driveType": "FWD",
  "doors": 4,
  "condition": "used",
  "stockNumber": "HC12345",
  "description": "One owner, clean title, fully serviced.",
  "sourceUrl": "https://example-dealer.com/listing/12345",
  "extractedAt": "2026-03-07T12:00:00.000Z"
}
```

Headers: `Content-Type: application/json`, `Authorization: Bearer <token>` (if configured).

---

## Deployment

For production, deploy the backend to any Node.js host (Railway, Render, Fly.io, etc.) and update the **Backend URL** in the extension settings to point to your deployed instance.

Set `ALLOWED_ORIGINS` in the backend `.env` to your extension's origin (find it in `chrome://extensions`) to restrict access.
