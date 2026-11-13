import { useState } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#0f766e", "#0891b2", "#7c3aed", "#db2777", "#d97706", "#65a30d", "#dc2626", "#9333ea", "#0284c7", "#059669"];

const sections = [
  { id: "market", label: "📈 Market Size" },
  { id: "regional", label: "🌍 Regional Share" },
  { id: "pricing", label: "💰 Pricing" },
  { id: "segments", label: "🏢 Segments" },
  { id: "features", label: "⚙️ Features" },
  { id: "trends", label: "🚀 Trends" },
];

const marketGrowth = [
  { year: "2022", size: 89 },
  { year: "2023", size: 110 },
  { year: "2024", size: 136 },
  { year: "2025", size: 158 },
  { year: "2026", size: 179 },
  { year: "2027", size: 222 },
  { year: "2028", size: 275 },
  { year: "2029", size: 340 },
  { year: "2030", size: 421 },
  { year: "2031", size: 514 },
];

const regionalData = [
  { name: "North America", value: 37.4, revenue: 54.3 },
  { name: "Asia Pacific", value: 24.6, revenue: 35.8 },
  { name: "Europe", value: 22, revenue: 32.1 },
  { name: "Rest of World", value: 16, revenue: 23.4 },
];

const pricingData = [
  { name: "Internxt", price: 1.67, storage: 1000 },
  { name: "Google One", price: 1.99, storage: 100 },
  { name: "iCloud", price: 0.99, storage: 50 },
  { name: "pCloud", price: 3.49, storage: 500 },
  { name: "ProtonDrive", price: 4.99, storage: 200 },
  { name: "MEGA", price: 5.5, storage: 400 },
  { name: "OneDrive", price: 6.99, storage: 1000 },
  { name: "Dropbox", price: 11.99, storage: 2000 },
];

const freeTierData = [
  { name: "MEGA", free: 20 },
  { name: "Google Drive", free: 15 },
  { name: "pCloud", free: 10 },
  { name: "Box", free: 10 },
  { name: "OneDrive", free: 5 },
  { name: "iCloud", free: 5 },
  { name: "ProtonDrive", free: 5 },
  { name: "Dropbox", free: 2 },
];

const segmentData = [
  { name: "Large Enterprise", revenue: 62.75, users: 8, growth: 12 },
  { name: "Mid-Market", revenue: 18, users: 15, growth: 18 },
  { name: "SMB", revenue: 12, users: 25, growth: 23.9 },
  { name: "Small Teams", revenue: 4, users: 35, growth: 20 },
  { name: "Individuals", revenue: 3.25, users: 17, growth: 10 },
];

const featureData = [
  { feature: "File Sync", score: 100 },
  { feature: "Web Interface", score: 100 },
  { feature: "Mobile Apps", score: 100 },
  { feature: "AES-256", score: 95 },
  { feature: "Versioning", score: 90 },
  { feature: "Sharing", score: 85 },
  { feature: "2FA", score: 80 },
  { feature: "Offline", score: 75 },
  { feature: "E2E Encrypt", score: 15 },
  { feature: "AI Search", score: 5 },
];

const trendData = [
  { name: "Privacy Premium", current: 12, projected: 18 },
  { name: "AI Storage", current: 5, projected: 30 },
  { name: "Hybrid Cloud", current: 69, projected: 85 },
  { name: "Compliance Auto", current: 20, projected: 80 },
  { name: "Edge+Cloud", current: 25, projected: 55 },
  { name: "Green Storage", current: 10, projected: 40 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "10px 14px" }}>
        <p style={{ color: "#94a3b8", marginBottom: 4, fontSize: 12 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, margin: "2px 0", fontSize: 13, fontWeight: 600 }}>
            {p.name}: {p.value}{p.name?.includes("$") || p.name === "price" ? "" : ""}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function App() {
  const [active, setActive] = useState("market");

  return (
    <div style={{ background: "#0f172a", minHeight: "100vh", fontFamily: "'Inter', sans-serif", color: "#e2e8f0", padding: "20px 16px" }}>
      <h1 style={{ textAlign: "center", fontSize: 22, fontWeight: 700, marginBottom: 4, color: "#f1f5f9" }}>
        ☁️ Cloud Storage Market 2026
      </h1>
      <p style={{ textAlign: "center", color: "#64748b", fontSize: 13, marginBottom: 20 }}>Interactive visual breakdown</p>

      {/* Nav Tabs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 28 }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setActive(s.id)}
            style={{
              padding: "7px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
              background: active === s.id ? "#0f766e" : "#1e293b",
              color: active === s.id ? "#fff" : "#94a3b8",
              transition: "all 0.2s"
            }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* MARKET SIZE */}
      {active === "market" && (
        <div>
          <Card title="Global Market Size ($B) — 2022 to 2031" subtitle="23.45% CAGR · $179B → $514B">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={marketGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="year" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 11 }} unit="B" />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="size" stroke="#0f766e" strokeWidth={3} dot={{ fill: "#0f766e", r: 5 }} name="Market Size ($B)" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 16 }}>
            <StatBox label="2026 Market" value="$179B" color="#0f766e" />
            <StatBox label="2031 Market" value="$514B" color="#0891b2" />
            <StatBox label="CAGR" value="23.45%" color="#7c3aed" />
          </div>
        </div>
      )}

      {/* REGIONAL */}
      {active === "regional" && (
        <div>
          <Card title="Regional Market Share (2025)" subtitle="North America leads · Asia Pacific fastest growing">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={regionalData} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name" label={({ name, value }) => `${name.split(" ")[0]}: ${value}%`} labelLine={false}>
                  {regionalData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [`${v}% ($${regionalData.find(d=>d.name===n)?.revenue}B)`, n]} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
          <Card title="Revenue by Region ($B)" subtitle="" style={{ marginTop: 16 }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={regionalData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 11 }} unit="B" />
                <YAxis type="category" dataKey="name" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 10 }} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Revenue ($B)" radius={[0, 6, 6, 0]}>
                  {regionalData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* PRICING */}
      {active === "pricing" && (
        <div>
          <Card title="Monthly Price ($/mo) by Provider" subtitle="Entry-level paid tier comparison">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={pricingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <YAxis stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 11 }} unit="$" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="price" name="Price/mo ($)" radius={[6, 6, 0, 0]}>
                  {pricingData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card title="Free Storage Tier (GB) by Provider" subtitle="" style={{ marginTop: 16 }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={freeTierData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 11 }} unit="GB" />
                <YAxis type="category" dataKey="name" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 11 }} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="free" name="Free Storage (GB)" radius={[0, 6, 6, 0]}>
                  {freeTierData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* SEGMENTS */}
      {active === "segments" && (
        <div>
          <Card title="Revenue Share vs User Share by Segment" subtitle="Large enterprises = 63% revenue, only 8% users">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={segmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 9 }} />
                <YAxis stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 11 }} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
                <Bar dataKey="revenue" name="Revenue %" fill="#0f766e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="users" name="Users %" fill="#0891b2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card title="Growth Rate by Segment (%)" subtitle="SMBs are the fastest growing segment" style={{ marginTop: 16 }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={segmentData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 11 }} unit="%" />
                <YAxis type="category" dataKey="name" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 10 }} width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="growth" name="Growth Rate (%)" radius={[0, 6, 6, 0]}>
                  {segmentData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* FEATURES */}
      {active === "features" && (
        <div>
          <Card title="Feature Ubiquity Across Providers (%)" subtitle="How common each feature is among major providers">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={featureData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 11 }} unit="%" domain={[0, 100]} />
                <YAxis type="category" dataKey="feature" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 11 }} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="score" name="Adoption %" radius={[0, 6, 6, 0]}>
                  {featureData.map((d, i) => (
                    <Cell key={i} fill={d.score >= 80 ? "#0f766e" : d.score >= 40 ? "#d97706" : "#dc2626"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 2, background: "#0f766e", display: "inline-block" }} /><span style={{ fontSize: 12, color: "#94a3b8" }}>Table stakes (80–100%)</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 2, background: "#d97706", display: "inline-block" }} /><span style={{ fontSize: 12, color: "#94a3b8" }}>Differentiators (40–79%)</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 2, background: "#dc2626", display: "inline-block" }} /><span style={{ fontSize: 12, color: "#94a3b8" }}>Rare advantages (&lt;40%)</span></div>
          </div>
        </div>
      )}

      {/* TRENDS */}
      {active === "trends" && (
        <div>
          <Card title="Market Trends: Current vs Projected Adoption (%)" subtitle="Enterprise adoption rates — 2026 vs 2031 projections">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 9 }} />
                <YAxis stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 11 }} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
                <Bar dataKey="current" name="Current (2026)" fill="#0891b2" radius={[4, 4, 0, 0]} />
                <Bar dataKey="projected" name="Projected (2031)" fill="#0f766e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {trendData.map((t, i) => (
              <div key={i} style={{ background: "#1e293b", borderRadius: 10, padding: "10px 14px" }}>
                <p style={{ color: "#94a3b8", fontSize: 11, margin: 0 }}>{t.name}</p>
                <p style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 16, margin: "4px 0 0" }}>
                  {t.current}% → <span style={{ color: "#0f766e" }}>{t.projected}%</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ title, subtitle, children, style = {} }) {
  return (
    <div style={{ background: "#1e293b", borderRadius: 14, padding: "16px", ...style }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", margin: "0 0 2px" }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 14px" }}>{subtitle}</p>}
      {children}
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div style={{ background: "#1e293b", borderRadius: 12, padding: "14px", textAlign: "center" }}>
      <p style={{ color: "#64748b", fontSize: 11, margin: "0 0 4px" }}>{label}</p>
      <p style={{ color, fontWeight: 700, fontSize: 20, margin: 0 }}>{value}</p>
    </div>
  );
}
