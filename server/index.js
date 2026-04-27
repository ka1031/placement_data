const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

const app = express();
app.use(cors());
app.use(express.json());

// Parse CSV once on startup
const csvContent = fs.readFileSync(path.join(__dirname, "data.csv"), "utf-8");
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  cast: (value, context) => {
    if (context.column === "Rank" || context.column === "CGPA" || context.column === "CTC" || context.column === "Stipend LPA") {
      const num = parseFloat(value);
      return isNaN(num) ? null : num;
    }
    return value;
  },
});

// GET /api/placements - with filtering, sorting, pagination
app.get("/api/placements", (req, res) => {
  const {
    search = "",
    branch = "",
    company = "",
    minCTC = "",
    maxCTC = "",
    sort = "Rank",
    order = "asc",
    page = 1,
    limit = 20,
  } = req.query;

  let filtered = [...records];

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.Name.toLowerCase().includes(q) ||
        r.Company.toLowerCase().includes(q)
    );
  }
  if (branch) filtered = filtered.filter((r) => r.Branch === branch);
  if (company) filtered = filtered.filter((r) => r.Company === company);
  if (minCTC) filtered = filtered.filter((r) => r.CTC >= parseFloat(minCTC));
  if (maxCTC) filtered = filtered.filter((r) => r.CTC <= parseFloat(maxCTC));

  // Sort
  filtered.sort((a, b) => {
    const av = a[sort], bv = b[sort];
    if (av === null) return 1;
    if (bv === null) return -1;
    if (typeof av === "number") return order === "asc" ? av - bv : bv - av;
    return order === "asc"
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av));
  });

  const total = filtered.length;
  const pageNum = parseInt(page);
  const pageSize = parseInt(limit);
  const paginated = filtered.slice((pageNum - 1) * pageSize, pageNum * pageSize);

  res.json({ data: paginated, total, page: pageNum, pages: Math.ceil(total / pageSize) });
});

// GET /api/stats
app.get("/api/stats", (req, res) => {
  const ctcs = records.map((r) => r.CTC).filter((c) => c !== null);
  const branches = {};
  const companies = {};
  const branchAvgCTC = {};

  records.forEach((r) => {
    branches[r.Branch] = (branches[r.Branch] || 0) + 1;
    companies[r.Company] = (companies[r.Company] || 0) + 1;
    if (!branchAvgCTC[r.Branch]) branchAvgCTC[r.Branch] = [];
    if (r.CTC) branchAvgCTC[r.Branch].push(r.CTC);
  });

  const branchStats = Object.entries(branchAvgCTC).map(([branch, ctcs]) => ({
    branch: branch.replace(/\(.*\)/, "").trim(),
    avgCTC: (ctcs.reduce((a, b) => a + b, 0) / ctcs.length).toFixed(2),
    count: branches[branch],
  })).sort((a, b) => b.avgCTC - a.avgCTC);

  const topCompanies = Object.entries(companies)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  res.json({
    total: records.length,
    avgCTC: (ctcs.reduce((a, b) => a + b, 0) / ctcs.length).toFixed(2),
    maxCTC: Math.max(...ctcs),
    minCTC: Math.min(...ctcs),
    branches: Object.keys(branches).sort(),
    companies: Object.keys(companies).sort(),
    branchStats,
    topCompanies,
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
