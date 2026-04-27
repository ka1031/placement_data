import React, { useState, useEffect, useCallback } from "react";
import "./App.css";

const API = process.env.REACT_APP_API_URL || "/api";

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
  const [stats, setStats] = useState(null);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState("table");

  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("");
  const [company, setCompany] = useState("");
  const [minCTC, setMinCTC] = useState("");
  const [maxCTC, setMaxCTC] = useState("");
  const [sort, setSort] = useState("Rank");
  const [order, setOrder] = useState("asc");

  useEffect(() => {
    fetch(`${API}/stats`).then((r) => r.json()).then(setStats);
  }, []);

  const fetchData = useCallback(() => {
    const params = new URLSearchParams({ search, branch, company, minCTC, maxCTC, sort, order, page, limit: 25 });
    fetch(`${API}/placements?${params}`)
      .then((r) => r.json())
      .then((res) => { setData(res.data); setTotal(res.total); setPages(res.pages); });
  }, [search, branch, company, minCTC, maxCTC, sort, order, page]);

  useEffect(() => { setPage(1); }, [search, branch, company, minCTC, maxCTC, sort, order]);
  useEffect(() => { fetchData(); }, [fetchData]);

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
          <div className="header-meta">
            {stats && <span className="total-badge">{stats.total} Students Placed</span>}
          </div>
        </div>
      </header>

      {stats && (
        <section className="stats-row">
          <StatCard label="Avg CTC" value={`₹${stats.avgCTC} LPA`} accent="#00e5a0" />
          <StatCard label="Highest CTC" value={`₹${stats.maxCTC} LPA`} accent="#5b8aff" />
          <StatCard label="Lowest CTC" value={`₹${stats.minCTC} LPA`} accent="#ffd166" />
          <StatCard label="Branches" value={stats.branches.length} accent="#ff6b6b" />
          <StatCard label="Companies" value={stats.companies.length} accent="#c77dff" />
        </section>
      )}

      <div className="tab-bar">
        <button className={`tab-btn ${tab === "table" ? "active" : ""}`} onClick={() => setTab("table")}>📋 Student Data</button>
        <button className={`tab-btn ${tab === "analytics" ? "active" : ""}`} onClick={() => setTab("analytics")}>📊 Analytics</button>
      </div>

      {tab === "table" && (
        <section className="table-section">
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

      {tab === "analytics" && stats && (
        <section className="analytics-section">
          <div className="charts-grid">
            <BarChart
              data={stats.branchStats}
              valueKey="avgCTC"
              labelKey="branch"
              title="Average CTC by Branch (LPA)"
            />
            <BarChart
              data={stats.topCompanies}
              valueKey="count"
              labelKey="name"
              title="Top Hiring Companies"
            />
          </div>
        </section>
      )}

      <footer className="footer">MIT Manipal Placement Data · Built with Express + React</footer>
    </div>
  );
}
