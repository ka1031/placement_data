# MIT Manipal Placement Dashboard

A full-stack Express + React app to browse and analyze placement data.

## Features
- 📋 Paginated student data table (771 students)
- 🔍 Search by name or company
- 🔽 Filter by branch, company, CTC range
- ↕️ Sort by any column
- 📊 Analytics tab: avg CTC by branch, top hiring companies

## Setup

### 1. Install dependencies

```bash
# From root folder
npm install

# Server deps
cd server && npm install && cd ..

# Client deps
cd client && npm install && cd ..
```

### 2. Run

**Terminal 1 — Start the Express API server (port 3001):**
```bash
cd server && node index.js
```

**Terminal 2 — Start the React dev server (port 3000):**
```bash
cd client && npm start
```

Open **http://localhost:3000** in your browser.

> The React app proxies `/api` requests to Express on port 3001 automatically.

## Project Structure

```
placement-dashboard/
├── server/
│   ├── index.js       # Express API
│   ├── data.csv       # Placement data
│   └── package.json
├── client/
│   ├── src/
│   │   ├── App.js     # Main React component
│   │   └── App.css    # Styles
│   ├── public/
│   │   └── index.html
│   └── package.json
└── README.md
```

## API Endpoints

- `GET /api/placements` — paginated, filterable, sortable list
  - Query params: `search`, `branch`, `company`, `minCTC`, `maxCTC`, `sort`, `order`, `page`, `limit`
- `GET /api/stats` — summary stats: avg/max/min CTC, branch list, top companies
