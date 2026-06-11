import React, { useState, useEffect } from "react";
import "./App.css";
import Papa from "papaparse";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function StatCard({ label, value, accent }) {
  return (
    <div className="stat-card" style={{ "--accent": accent }}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function BarChart({ data, valueKey, labelKey, title }) {
  const max = Math.max(...data.map((d) => parseFloat(d[valueKey])));
  return (
    <div className="chart-box">
      <div className="chart-title">{title}</div>
      <div className="bar-chart">
        {data.map((d, i) => (
          <div className="bar-row" key={i}>
            <div className="bar-label" title={d[labelKey]}>{d[labelKey]}</div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{ width: `${(parseFloat(d[valueKey]) / max) * 100}%`, animationDelay: `${i * 40}ms` }}
              />
            </div>
            <div className="bar-val">{d[valueKey]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SortIcon({ col, sort, order }) {
  if (sort !== col) return <span className="sort-icon muted">↕</span>;
  return <span className="sort-icon active">{order === "asc" ? "↑" : "↓"}</span>;
}

const ROLE_COLORS = { P: "#00e5a0", "P+I": "#5b8aff", I: "#ffd166" };

export default function App() {
  // Placement state
  const [stats, setStats] = useState(null);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [allData, setAllData] = useState([]);

  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("");
  const [company, setCompany] = useState("");
  const [minCTC, setMinCTC] = useState("");
  const [maxCTC, setMaxCTC] = useState("");
  const [sort, setSort] = useState("Rank");
  const [order, setOrder] = useState("asc");

  // Intern state
  const [internStats, setInternStats] = useState(null);
  const [internData, setInternData] = useState([]);
  const [internTotal, setInternTotal] = useState(0);
  const [internPages, setInternPages] = useState(1);
  const [internPage, setInternPage] = useState(1);

  const [internSearch, setInternSearch] = useState("");
  const [internBranch, setInternBranch] = useState("");
  const [internCompany, setInternCompany] = useState("");

  // Active tab
  const [tab, setTab] = useState("table");

  // ── Placement effect ──────────────────────────────────────────────
  useEffect(() => {
    Papa.parse("/placements.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data;
        setAllData(rows);

        // FILTERING
        let filtered = rows.filter((row) => {
          const matchesSearch =
            !search ||
            row.Name?.toLowerCase().includes(search.toLowerCase()) ||
            row.Company?.toLowerCase().includes(search.toLowerCase());
          const matchesBranch = !branch || row.Branch === branch;
          const matchesCompany = !company || row.Company === company;
          const ctc = parseFloat(row.CTC || 0);
          const matchesMin = !minCTC || ctc >= parseFloat(minCTC);
          const matchesMax = !maxCTC || ctc <= parseFloat(maxCTC);
          return matchesSearch && matchesBranch && matchesCompany && matchesMin && matchesMax;
        });

        // SORTING
        filtered.sort((a, b) => {
          let av = a[sort];
          let bv = b[sort];
          if (!isNaN(av) && !isNaN(bv)) { av = parseFloat(av); bv = parseFloat(bv); }
          if (av < bv) return order === "asc" ? -1 : 1;
          if (av > bv) return order === "asc" ? 1 : -1;
          return 0;
        });

        // PAGINATION
        const limit = 25;
        const start = (page - 1) * limit;
        setData(filtered.slice(start, start + limit));
        setTotal(filtered.length);
        setPages(Math.ceil(filtered.length / limit));

        // STATS
        const ctcValues = rows.map((r) => parseFloat(r.CTC || 0));
        const sortedCTC = [...ctcValues].sort((a, b) => a - b);
        const mid = Math.floor(sortedCTC.length / 2);
        const medianCTC = (sortedCTC.length % 2 !== 0
          ? sortedCTC[mid]
          : (sortedCTC[mid - 1] + sortedCTC[mid]) / 2
        ).toFixed(2);

        const branches = [...new Set(rows.map((r) => r.Branch))];
        const companies = [...new Set(rows.map((r) => r.Company))];

        const branchStats = branches.map((b) => {
          const branchRows = rows.filter((r) => r.Branch === b);
          const avg = branchRows.reduce((sum, r) => sum + parseFloat(r.CTC || 0), 0) / branchRows.length;
          return { branch: b, avgCTC: avg.toFixed(2) };
        });

        const branchMedianStats = branches.map((b) => {
          const branchCTCs = rows
            .filter((r) => r.Branch === b)
            .map((r) => parseFloat(r.CTC || 0))
            .sort((a, b) => a - b);
          const m = Math.floor(branchCTCs.length / 2);
          const median = (branchCTCs.length % 2 !== 0
            ? branchCTCs[m]
            : (branchCTCs[m - 1] + branchCTCs[m]) / 2
          ).toFixed(2);
          return { branch: b, medianCTC: median };
        });

        const companyMap = {};
        rows.forEach((r) => { companyMap[r.Company] = (companyMap[r.Company] || 0) + 1; });
        const topCompanies = Object.entries(companyMap)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        setStats({
          total: rows.length,
          avgCTC: (ctcValues.reduce((a, b) => a + b, 0) / ctcValues.length).toFixed(2),
          maxCTC: Math.max(...ctcValues).toFixed(2),
          minCTC: Math.min(...ctcValues).toFixed(2),
          medianCTC,
          branches,
          companies,
          branchStats,
          branchMedianStats,
          topCompanies,
        });
      },
    });
  }, [search, branch, company, minCTC, maxCTC, sort, order, page]);

  // ── Intern effect ─────────────────────────────────────────────────
  useEffect(() => {
    Papa.parse("/interns.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data;

        // FILTERING
        let filtered = rows.filter((row) => {
          const matchesSearch =
            !internSearch ||
            row.Name?.toLowerCase().includes(internSearch.toLowerCase()) ||
            row.Company?.toLowerCase().includes(internSearch.toLowerCase());
          const matchesBranch = !internBranch || row.Branch === internBranch;
          const matchesCompany = !internCompany || row.Company === internCompany;
          return matchesSearch && matchesBranch && matchesCompany;
        });

        // SORTING
        filtered.sort((a, b) => parseFloat(a.Rank) - parseFloat(b.Rank));

        // PAGINATION
        const limit = 25;
        const start = (internPage - 1) * limit;
        setInternData(filtered.slice(start, start + limit));
        setInternTotal(filtered.length);
        setInternPages(Math.ceil(filtered.length / limit));

        // STATS
        const stipendValues = rows.map((r) => parseFloat(r["Stipend LPA"] || 0));
        const sortedS = [...stipendValues].sort((a, b) => a - b);
        const mid = Math.floor(sortedS.length / 2);
        const medianStipend = (sortedS.length % 2 !== 0
          ? sortedS[mid]
          : (sortedS[mid - 1] + sortedS[mid]) / 2
        ).toFixed(2);

        const branches = [...new Set(rows.map((r) => r.Branch))];
        const companies = [...new Set(rows.map((r) => r.Company))];

        const branchStats = branches.map((b) => {
          const branchRows = rows.filter((r) => r.Branch === b);
          const avg = branchRows.reduce((sum, r) => sum + parseFloat(r["Stipend LPA"] || 0), 0) / branchRows.length;
          return { branch: b, avgStipend: avg.toFixed(2) };
        });

        const companyMap = {};
        rows.forEach((r) => { companyMap[r.Company] = (companyMap[r.Company] || 0) + 1; });
        const topCompanies = Object.entries(companyMap)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        setInternStats({
          total: rows.length,
          avgStipend: (stipendValues.reduce((a, b) => a + b, 0) / stipendValues.length).toFixed(2),
          maxStipend: Math.max(...stipendValues).toFixed(2),
          minStipend: Math.min(...stipendValues).toFixed(2),
          medianStipend,
          branches,
          companies,
          branchStats,
          topCompanies,
          allRows: rows,
        });
      },
    });
  }, [internSearch, internBranch, internCompany, internPage]);

  const handleSort = (col) => {
    if (sort === col) setOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSort(col); setOrder("asc"); }
  };

  const clearFilters = () => { setSearch(""); setBranch(""); setCompany(""); setMinCTC(""); setMaxCTC(""); };

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-pill">MIT MANIPAL</span>
            <h1>Placement Dashboard</h1>
          </div>
        </div>
      </header>

      <div className="tab-bar">
        <button className={`tab-btn ${tab === "table" ? "active" : ""}`} onClick={() => setTab("table")}>📋 Student Data</button>
        <button className={`tab-btn ${tab === "analytics" ? "active" : ""}`} onClick={() => setTab("analytics")}>📊 Analytics</button>
        <button className={`tab-btn ${tab === "interns" ? "active" : ""}`} onClick={() => setTab("interns")}>🎓 Intern Data</button>
        <button className={`tab-btn ${tab === "internAnalytics" ? "active" : ""}`} onClick={() => setTab("internAnalytics")}>📈 Intern Analytics</button>
      </div>

      {/* ── PLACEMENT TABLE TAB ── */}
      {tab === "table" && (
        <section className="table-section">
          {stats && (
            <section className="stats-row">
              <StatCard label="Avg CTC" value={`₹${stats.avgCTC} LPA`} accent="#00e5a0" />
              <StatCard label="Median CTC" value={`₹${stats.medianCTC} LPA`} accent="#00e5dd" />
              <StatCard label="Highest CTC" value={`₹${stats.maxCTC} LPA`} accent="#5b8aff" />
              <StatCard label="Lowest CTC" value={`₹${stats.minCTC} LPA`} accent="#ffd166" />
              <StatCard label="Branches" value={stats.branches.length} accent="#ff6b6b" />
              <StatCard label="Companies" value={stats.companies.length} accent="#c77dff" />
            </section>
          )}

          <div className="filters">
            <input className="filter-input search" placeholder="🔍 Search name or company..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="filter-input" value={branch} onChange={(e) => setBranch(e.target.value)}>
              <option value="">All Branches</option>
              {stats?.branches.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <select className="filter-input" value={company} onChange={(e) => setCompany(e.target.value)}>
              <option value="">All Companies</option>
              {stats?.companies.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input className="filter-input short" type="number" placeholder="Min CTC" value={minCTC} onChange={(e) => setMinCTC(e.target.value)} />
            <input className="filter-input short" type="number" placeholder="Max CTC" value={maxCTC} onChange={(e) => setMaxCTC(e.target.value)} />
            <button className="clear-btn" onClick={clearFilters}>✕ Clear</button>
          </div>

          <div className="result-meta">Showing <strong>{data.length}</strong> of <strong>{total}</strong> results</div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  {["Rank", "Name", "Branch", "CGPA", "Company", "Role", "CTC"].map((col) => (
                    <th key={col} onClick={() => handleSort(col)} className="sortable">
                      {col} <SortIcon col={col} sort={sort} order={order} />
                    </th>
                  ))}
                  <th>Stipend</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} className="data-row">
                    <td><span className="rank">#{row.Rank}</span></td>
                    <td className="name-cell">{row.Name}</td>
                    <td><span className="branch-tag">{row.Branch.replace(/\(.*\)/, "").trim()}</span></td>
                    <td><span className="cgpa">{row.CGPA}</span></td>
                    <td className="company-cell">{row.Company}</td>
                    <td><span className="role-badge" style={{ "--rc": ROLE_COLORS[row.Role] || "#aaa" }}>{row.Role}</span></td>
                    <td><span className="ctc">₹{row.CTC} L</span></td>
                    <td className="muted">{row["Stipend LPA"] ? `₹${row["Stipend LPA"]} L` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button disabled={page <= 1} onClick={() => setPage(1)}>«</button>
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>‹</button>
            <span className="page-info">Page {page} of {pages}</span>
            <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>›</button>
            <button disabled={page >= pages} onClick={() => setPage(pages)}>»</button>
          </div>
        </section>
      )}

      {/* ── PLACEMENT ANALYTICS TAB ── */}
      {tab === "analytics" && stats && (
        <section className="analytics-section">
          <div className="charts-grid">
            <BarChart data={stats.branchStats} valueKey="avgCTC" labelKey="branch" title="Average CTC by Branch (LPA)" />
            <BarChart data={stats.branchMedianStats} valueKey="medianCTC" labelKey="branch" title="Median CTC by Branch (LPA)" />
            <BarChart data={stats.topCompanies} valueKey="count" labelKey="name" title="Top Hiring Companies" />
            <div className="chart-box">
              <div className="chart-title">CGPA vs CTC</div>
              <div style={{ width: "100%", height: 400 }}>
                <ResponsiveContainer>
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                    <CartesianGrid />
                    <XAxis type="number" dataKey="CGPA" name="CGPA" />
                    <YAxis type="number" dataKey="CTC" name="CTC" unit=" LPA" />
                    <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                    <Scatter name="Students" data={allData} fill="#5b8aff" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── INTERN TABLE TAB ── */}
      {tab === "interns" && (
        <section className="table-section">
          {internStats && (
            <section className="stats-row">
              <StatCard label="Avg Stipend" value={`₹${internStats.avgStipend} LPA`} accent="#00e5a0" />
              <StatCard label="Median Stipend" value={`₹${internStats.medianStipend} LPA`} accent="#00e5dd" />
              <StatCard label="Highest Stipend" value={`₹${internStats.maxStipend} LPA`} accent="#5b8aff" />
              <StatCard label="Lowest Stipend" value={`₹${internStats.minStipend} LPA`} accent="#ffd166" />
              <StatCard label="Branches" value={internStats.branches.length} accent="#ff6b6b" />
              <StatCard label="Companies" value={internStats.companies.length} accent="#c77dff" />
            </section>
          )}

          <div className="filters">
            <input className="filter-input search" placeholder="🔍 Search name or company..." value={internSearch} onChange={(e) => setInternSearch(e.target.value)} />
            <select className="filter-input" value={internBranch} onChange={(e) => setInternBranch(e.target.value)}>
              <option value="">All Branches</option>
              {internStats?.branches.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <select className="filter-input" value={internCompany} onChange={(e) => setInternCompany(e.target.value)}>
              <option value="">All Companies</option>
              {internStats?.companies.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button className="clear-btn" onClick={() => { setInternSearch(""); setInternBranch(""); setInternCompany(""); }}>✕ Clear</button>
          </div>

          <div className="result-meta">Showing <strong>{internData.length}</strong> of <strong>{internTotal}</strong> results</div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th><th>Name</th><th>Branch</th><th>CGPA</th>
                  <th>Company</th><th>Role</th><th>Stipend</th><th>Stipend LPA</th>
                </tr>
              </thead>
              <tbody>
                {internData.map((row, i) => (
                  <tr key={i} className="data-row">
                    <td><span className="rank">#{row.Rank}</span></td>
                    <td className="name-cell">{row.Name}</td>
                    <td><span className="branch-tag">{row.Branch.replace(/\(.*\)/, "").trim()}</span></td>
                    <td><span className="cgpa">{row.CGPA}</span></td>
                    <td className="company-cell">{row.Company}</td>
                    <td><span className="role-badge" style={{ "--rc": ROLE_COLORS[row.Role] || "#aaa" }}>{row.Role}</span></td>
                    <td className="muted">{row.Stipend || "—"}</td>
                    <td><span className="ctc">₹{row["Stipend LPA"]} L</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button disabled={internPage <= 1} onClick={() => setInternPage(1)}>«</button>
            <button disabled={internPage <= 1} onClick={() => setInternPage((p) => p - 1)}>‹</button>
            <span className="page-info">Page {internPage} of {internPages}</span>
            <button disabled={internPage >= internPages} onClick={() => setInternPage((p) => p + 1)}>›</button>
            <button disabled={internPage >= internPages} onClick={() => setInternPage(internPages)}>»</button>
          </div>
        </section>
      )}

      {/* ── INTERN ANALYTICS TAB ── */}
      {tab === "internAnalytics" && internStats && (
        <section className="analytics-section">
          <div className="charts-grid">
            <BarChart data={internStats.branchStats} valueKey="avgStipend" labelKey="branch" title="Avg Stipend by Branch (LPA)" />
            <BarChart data={internStats.topCompanies} valueKey="count" labelKey="name" title="Top Intern Hiring Companies" />
            <div className="chart-box">
              <div className="chart-title">CGPA vs Stipend</div>
              <div style={{ width: "100%", height: 400 }}>
                <ResponsiveContainer>
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                    <CartesianGrid />
                    <XAxis type="number" dataKey="CGPA" name="CGPA" />
                    <YAxis type="number" dataKey="Stipend LPA" name="Stipend" unit=" LPA" />
                    <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                    <Scatter name="Interns" data={internStats.allRows} fill="#00e5a0" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>
      )}

      <footer className="footer">MIT Manipal Placement Data</footer>
    </div>
  );
}