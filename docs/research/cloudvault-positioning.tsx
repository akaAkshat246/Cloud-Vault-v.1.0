import { useState } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, LineChart, Line,
  ScatterChart, Scatter, ZAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, PieChart, Pie, ReferenceLine
} from "recharts";

const TEAL = "#0f766e";
const BLUE = "#0891b2";
const PURPLE = "#7c3aed";
const RED = "#dc2626";
const ORANGE = "#d97706";
const GREEN = "#16a34a";
const GRAY = "#475569";
const DIM = "#94a3b8";

const tabs = [
  { id: "position", label: "📍 Market Position" },
  { id: "edges", label: "⚔️ Competitive Edges" },
  { id: "tam", label: "🎯 TAM / SAM / SOM" },
  { id: "radar", label: "🕸️ Feature Radar" },
  { id: "pricing", label: "💰 Pricing Power" },
  { id: "roadmap", label: "🚀 Growth Roadmap" },
];

// Radar: CloudVault vs competitors
const radarData = [
  { axis: "Privacy/E2E", CloudVault: 98, GoogleDrive: 20, OneDrive: 25, Dropbox: 40, ProtonDrive: 95 },
  { axis: "UX Quality", CloudVault: 82, GoogleDrive: 88, OneDrive: 80, Dropbox: 85, ProtonDrive: 60 },
  { axis: "Pricing Value", CloudVault: 90, GoogleDrive: 70, OneDrive: 65, Dropbox: 45, ProtonDrive: 55 },
  { axis: "Mobile (Android)", CloudVault: 88, GoogleDrive: 92, OneDrive: 85, Dropbox: 80, ProtonDrive: 65 },
  { axis: "Open/Auditable", CloudVault: 85, GoogleDrive: 10, OneDrive: 10, Dropbox: 30, ProtonDrive: 80 },
  { axis: "Collab Features", CloudVault: 45, GoogleDrive: 98, OneDrive: 95, Dropbox: 70, ProtonDrive: 30 },
  { axis: "Storage/Price", CloudVault: 88, GoogleDrive: 72, OneDrive: 70, Dropbox: 50, ProtonDrive: 60 },
];

// Competitive edge scores (CloudVault advantage)
const edgeData = [
  { edge: "E2E Encryption (default)", cv: 98, avg: 25, gap: 73 },
  { edge: "Android-first Native", cv: 88, avg: 60, gap: 28 },
  { edge: "Pricing vs Value", cv: 90, avg: 58, gap: 32 },
  { edge: "UX Simplicity", cv: 82, avg: 75, gap: 7 },
  { edge: "Student / Young Users", cv: 85, avg: 30, gap: 55 },
  { edge: "Open Architecture", cv: 80, avg: 22, gap: 58 },
  { edge: "No Data Harvesting", cv: 95, avg: 18, gap: 77 },
];

// TAM SAM SOM
const tamData = [
  { name: "TAM\nGlobal Cloud Storage", value: 179, color: "#1e3a5f" },
  { name: "SAM\nPrivacy-first segment", value: 22, color: BLUE },
  { name: "SOM\nAndroid+Privacy users", value: 2.2, color: TEAL },
];

// Pricing positioning scatter
const pricingScatter = [
  { name: "Google Drive", privacy: 20, price: 1.99, size: 600 },
  { name: "OneDrive", privacy: 25, price: 6.99, size: 500 },
  { name: "Dropbox", privacy: 40, price: 11.99, size: 350 },
  { name: "ProtonDrive", privacy: 95, price: 4.99, size: 80 },
  { name: "MEGA", privacy: 80, price: 4.5, size: 120 },
  { name: "Sync.com", privacy: 90, price: 8, size: 60 },
  { name: "Tresorit", privacy: 98, price: 14, size: 40 },
  { name: "CloudVault", privacy: 98, price: 2.5, size: 180 },
];

// Growth roadmap
const roadmapData = [
  { week: "W1-2", users: 0, milestone: "MVP Build" },
  { week: "W3-4", users: 50, milestone: "Beta testers" },
  { week: "W5-6", users: 200, milestone: "Play Store launch" },
  { week: "M3", users: 1000, milestone: "1K users" },
  { week: "M6", users: 5000, milestone: "5K users" },
  { week: "M12", users: 20000, milestone: "20K users" },
  { week: "M18", users: 60000, milestone: "Monetize" },
  { week: "M24", users: 150000, milestone: "150K users" },
];

// Competitor weakness = CloudVault opportunity
const weaknessData = [
  { competitor: "Google Drive", weakness: "Zero E2E encryption", opportunity: 95 },
  { competitor: "OneDrive", weakness: "Microsoft data access", opportunity: 90 },
  { competitor: "Dropbox", weakness: "Expensive, no encryption", opportunity: 85 },
  { competitor: "ProtonDrive", weakness: "Poor UX, limited Android", opportunity: 70 },
  { competitor: "MEGA", weakness: "Trust issues, closed", opportunity: 60 },
  { competitor: "Tresorit", weakness: "Way too expensive", opportunity: 88 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "10px 14px", maxWidth: 220 }}>
        <p style={{ color: DIM, marginBottom: 4, fontSize: 12 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || "#f1f5f9", margin: "2px 0", fontSize: 13, fontWeight: 600 }}>
            {p.name}: {typeof p.value === "number" ? p.value : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const ScatterTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0]?.payload;
    return (
      <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "10px 14px" }}>
        <p style={{ color: d?.name === "CloudVault" ? TEAL : "#f1f5f9", fontWeight: 700, margin: 0 }}>{d?.name}</p>
        <p style={{ color: DIM, fontSize: 12, margin: "4px 0 0" }}>Privacy Score: {d?.privacy}/100</p>
        <p style={{ color: DIM, fontSize: 12, margin: "2px 0 0" }}>Price: ${d?.price}/mo</p>
      </div>
    );
  }
  return null;
};

export default function App() {
  const [active, setActive] = useState("position");

  return (
    <div style={{ background: "#0f172a", minHeight: "100vh", fontFamily: "'Inter',sans-serif", color: "#e2e8f0", padding: "20px 16px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#1e293b", borderRadius: 16, padding: "10px 20px", marginBottom: 10 }}>
          <span style={{ fontSize: 22 }}>☁️</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9" }}>CloudVault</span>
          <span style={{ background: TEAL, color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>YOUR PRODUCT</span>
        </div>
        <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>Market Position & Competitive Edge Analysis</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 24 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)}
            style={{ padding: "7px 13px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600,
              background: active === t.id ? TEAL : "#1e293b", color: active === t.id ? "#fff" : DIM, transition: "all 0.2s" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── MARKET POSITION ── */}
      {active === "position" && (
        <div>
          <Card title="Where CloudVault Sits in the Market" subtitle="Privacy score vs monthly price — the ideal quadrant is top-left (high privacy, low cost)">
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="price" name="Price" type="number" stroke={GRAY} tick={{ fill: DIM, fontSize: 11 }} label={{ value: "Price/mo ($)", position: "insideBottom", offset: -10, fill: DIM, fontSize: 11 }} domain={[0, 16]} />
                <YAxis dataKey="privacy" name="Privacy" type="number" stroke={GRAY} tick={{ fill: DIM, fontSize: 11 }} label={{ value: "Privacy Score", angle: -90, position: "insideLeft", fill: DIM, fontSize: 11 }} domain={[0, 100]} />
                <ZAxis dataKey="size" range={[40, 300]} />
                <Tooltip content={<ScatterTooltip />} />
                <ReferenceLine x={5} stroke="#334155" strokeDasharray="4 4" />
                <ReferenceLine y={70} stroke="#334155" strokeDasharray="4 4" />
                <Scatter data={pricingScatter.filter(d => d.name !== "CloudVault")} fill={GRAY} opacity={0.7} />
                <Scatter data={pricingScatter.filter(d => d.name === "CloudVault")} fill={TEAL} />
              </ScatterChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 8 }}>
              <Legend2 color={TEAL} label="CloudVault (your position)" />
              <Legend2 color={GRAY} label="Competitors" />
            </div>
            <div style={{ background: "#0f2027", borderRadius: 10, padding: "10px 14px", marginTop: 14, borderLeft: `3px solid ${TEAL}` }}>
              <p style={{ color: TEAL, fontWeight: 700, fontSize: 13, margin: "0 0 4px" }}>💡 Your Sweet Spot</p>
              <p style={{ color: DIM, fontSize: 12, margin: 0 }}>CloudVault is the <b style={{ color: "#f1f5f9" }}>only product</b> targeting the top-left quadrant — maximum privacy at minimum price. No competitor owns this position today.</p>
            </div>
          </Card>

          <Card title="Competitor Weakness → Your Opportunity" subtitle="How much each rival's flaw benefits you (score out of 100)" style={{ marginTop: 16 }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weaknessData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke={GRAY} tick={{ fill: DIM, fontSize: 11 }} domain={[0, 100]} />
                <YAxis type="category" dataKey="competitor" stroke={GRAY} tick={{ fill: DIM, fontSize: 10 }} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="opportunity" name="Opportunity Score" radius={[0, 6, 6, 0]}>
                  {weaknessData.map((_, i) => <Cell key={i} fill={i === 0 ? RED : i === 5 ? GREEN : ORANGE} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* ── COMPETITIVE EDGES ── */}
      {active === "edges" && (
        <div>
          <Card title="CloudVault vs Market Average — Edge Gap" subtitle="Higher gap = stronger competitive advantage for you">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={edgeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="edge" stroke={GRAY} tick={{ fill: DIM, fontSize: 8 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis stroke={GRAY} tick={{ fill: DIM, fontSize: 11 }} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: DIM, fontSize: 11 }} />
                <Bar dataKey="cv" name="CloudVault Score" fill={TEAL} radius={[4, 4, 0, 0]} />
                <Bar dataKey="avg" name="Market Average" fill={GRAY} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
            {edgeData.sort((a,b) => b.gap - a.gap).slice(0,6).map((e, i) => (
              <div key={i} style={{ background: "#1e293b", borderRadius: 10, padding: "10px 12px" }}>
                <p style={{ color: DIM, fontSize: 10, margin: "0 0 4px" }}>{e.edge}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, background: "#0f172a", borderRadius: 4, height: 6 }}>
                    <div style={{ width: `${e.gap}%`, background: e.gap > 60 ? TEAL : e.gap > 30 ? BLUE : GRAY, height: "100%", borderRadius: 4 }} />
                  </div>
                  <span style={{ color: e.gap > 60 ? TEAL : "#f1f5f9", fontWeight: 700, fontSize: 13 }}>+{e.gap}</span>
                </div>
              </div>
            ))}
          </div>

          <Card title="Top 3 Defensible Moats" subtitle="" style={{ marginTop: 16 }}>
            {[
              { icon: "🔐", title: "E2E Encryption by Default", desc: "Google/Microsoft can't offer this without breaking their ad/indexing model. This is structurally impossible for them to copy.", color: TEAL },
              { icon: "💸", title: "Privacy at Accessible Price", desc: "Tresorit charges $14/mo for the same privacy. CloudVault can capture the massive underserved mid-market.", color: BLUE },
              { icon: "📱", title: "Android-Native First", desc: "Most privacy tools are desktop/web-first. A Kotlin + Jetpack Compose native app is a real differentiator in India & emerging markets.", color: PURPLE },
            ].map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: i < 2 ? "1px solid #1e293b" : "none" }}>
                <span style={{ fontSize: 22 }}>{m.icon}</span>
                <div>
                  <p style={{ color: m.color, fontWeight: 700, fontSize: 13, margin: "0 0 3px" }}>{m.title}</p>
                  <p style={{ color: DIM, fontSize: 12, margin: 0 }}>{m.desc}</p>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* ── TAM SAM SOM ── */}
      {active === "tam" && (
        <div>
          <Card title="TAM → SAM → SOM Funnel" subtitle="Your realistic addressable market in 2026 ($B)">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={tamData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke={GRAY} tick={{ fill: DIM, fontSize: 11 }} unit="B$" />
                <YAxis type="category" dataKey="name" stroke={GRAY} tick={{ fill: DIM, fontSize: 10 }} width={130} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Market Size ($B)" radius={[0, 8, 8, 0]}>
                  {tamData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 16 }}>
              <StatBox label="TAM" sublabel="Global cloud storage" value="$179B" color="#1e3a5f" bright={BLUE} />
              <StatBox label="SAM" sublabel="Privacy-first users" value="$22B" color="#0c2a3a" bright={BLUE} />
              <StatBox label="SOM" sublabel="Realistic 3yr target" value="$2.2B" color="#0a2520" bright={TEAL} />
            </div>
          </Card>

          <Card title="Who Is Your Real Customer?" subtitle="ICP breakdown — Ideal Customer Profile" style={{ marginTop: 16 }}>
            {[
              { emoji: "🎓", who: "Students & Young Professionals", why: "Privacy-aware, price-sensitive, Android-first, India-heavy", fit: 95 },
              { emoji: "🧑‍💻", who: "Developers & Tech-Savvy Users", why: "Trust open architecture, want control, pay for tools", fit: 85 },
              { emoji: "🧕", who: "Privacy-Conscious Individuals", why: "Distrust Google/Microsoft data practices", fit: 90 },
              { emoji: "🏢", who: "Small Teams (5–20 people)", why: "Want Dropbox-level UX + encryption, can't afford Tresorit", fit: 75 },
            ].map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < 3 ? "1px solid #1e293b" : "none" }}>
                <span style={{ fontSize: 20 }}>{c.emoji}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 13, margin: "0 0 2px" }}>{c.who}</p>
                  <p style={{ color: DIM, fontSize: 11, margin: 0 }}>{c.why}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ color: TEAL, fontWeight: 700, fontSize: 14, margin: 0 }}>{c.fit}%</p>
                  <p style={{ color: GRAY, fontSize: 10, margin: 0 }}>ICP fit</p>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* ── FEATURE RADAR ── */}
      {active === "radar" && (
        <div>
          <Card title="Feature Radar — CloudVault vs Big 4" subtitle="Score out of 100 across 7 dimensions">
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={110}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="axis" tick={{ fill: DIM, fontSize: 10 }} />
                <Radar name="CloudVault" dataKey="CloudVault" stroke={TEAL} fill={TEAL} fillOpacity={0.3} strokeWidth={2} />
                <Radar name="Google Drive" dataKey="GoogleDrive" stroke={RED} fill={RED} fillOpacity={0.1} strokeWidth={1.5} />
                <Radar name="OneDrive" dataKey="OneDrive" stroke={BLUE} fill={BLUE} fillOpacity={0.1} strokeWidth={1.5} />
                <Radar name="ProtonDrive" dataKey="ProtonDrive" stroke={PURPLE} fill={PURPLE} fillOpacity={0.1} strokeWidth={1.5} />
                <Legend wrapperStyle={{ color: DIM, fontSize: 11 }} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
            <div style={{ background: "#0f2027", borderRadius: 10, padding: "10px 14px", marginTop: 10, borderLeft: `3px solid ${TEAL}` }}>
              <p style={{ color: DIM, fontSize: 12, margin: 0 }}>
                CloudVault <b style={{ color: TEAL }}>dominates</b> Privacy, Open Architecture & Pricing Value.
                Gap areas: Collaboration features (invest post-launch) and Mobile polish (your core focus now).
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* ── PRICING POWER ── */}
      {active === "pricing" && (
        <div>
          <Card title="Privacy Score vs Price — Market Map" subtitle="CloudVault targets the empty top-left: max privacy, min price">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              {pricingScatter.map((d, i) => (
                <div key={i} style={{ background: d.name === "CloudVault" ? "#0a2520" : "#1e293b", border: d.name === "CloudVault" ? `1px solid ${TEAL}` : "1px solid transparent", borderRadius: 10, padding: "10px 12px" }}>
                  <p style={{ color: d.name === "CloudVault" ? TEAL : "#f1f5f9", fontWeight: 700, fontSize: 13, margin: "0 0 4px" }}>{d.name}</p>
                  <p style={{ color: DIM, fontSize: 11, margin: 0 }}>Privacy: {d.privacy}/100 · ${d.price}/mo</p>
                  <div style={{ marginTop: 6, background: "#0f172a", borderRadius: 4, height: 5 }}>
                    <div style={{ width: `${d.privacy}%`, background: d.name === "CloudVault" ? TEAL : GRAY, height: "100%", borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Pricing Strategy Recommendation" subtitle="" style={{ marginTop: 16 }}>
            {[
              { tier: "Free Tier", price: "5–10 GB free", why: "Acquisition funnel — match Google's free tier", color: GRAY },
              { tier: "Personal", price: "~₹149/mo (~$1.8)", why: "Beat Google One (₹130) with privacy as upgrade reason", color: BLUE },
              { tier: "Pro", price: "~₹349/mo (~$4.2)", why: "Match ProtonDrive with better Android UX", color: TEAL },
              { tier: "Team", price: "~₹249/user/mo", why: "Undercut Dropbox Business significantly", color: PURPLE },
            ].map((t, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < 3 ? "1px solid #1e293b" : "none" }}>
                <div>
                  <p style={{ color: t.color, fontWeight: 700, fontSize: 13, margin: "0 0 2px" }}>{t.tier}</p>
                  <p style={{ color: DIM, fontSize: 11, margin: 0 }}>{t.why}</p>
                </div>
                <span style={{ background: "#0f172a", color: "#f1f5f9", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", marginLeft: 10 }}>{t.price}</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* ── ROADMAP ── */}
      {active === "roadmap" && (
        <div>
          <Card title="CloudVault Growth Projection" subtitle="User milestones from launch to 150K users">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={roadmapData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="week" stroke={GRAY} tick={{ fill: DIM, fontSize: 10 }} />
                <YAxis stroke={GRAY} tick={{ fill: DIM, fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="users" stroke={TEAL} strokeWidth={3} dot={{ fill: TEAL, r: 5 }} name="Users" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Launch Phases" subtitle="" style={{ marginTop: 16 }}>
            {[
              { phase: "Phase 1 — Ship (Weeks 1–6)", items: ["Build Android + Web MVP", "Play Store launch", "GitHub Pages for privacy policy", "Beta: 50–200 users"], color: TEAL },
              { phase: "Phase 2 — Grow (Month 2–6)", items: ["Product Hunt launch", "Reddit r/privacy, r/degoogle", "Referral program", "Target: 5K users"], color: BLUE },
              { phase: "Phase 3 — Monetize (Month 6–18)", items: ["Launch paid tiers (₹149/₹349)", "Team plan for small orgs", "Target: 20K users, ₹10L MRR"], color: PURPLE },
              { phase: "Phase 4 — Scale (Month 18–24)", items: ["B2B outreach (small businesses)", "Open source core for trust", "Target: 150K users, acquisition talks"], color: ORANGE },
            ].map((p, i) => (
              <div key={i} style={{ padding: "12px 0", borderBottom: i < 3 ? "1px solid #1e293b" : "none" }}>
                <p style={{ color: p.color, fontWeight: 700, fontSize: 13, margin: "0 0 6px" }}>{p.phase}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {p.items.map((item, j) => (
                    <span key={j} style={{ background: "#0f172a", color: DIM, fontSize: 11, padding: "3px 8px", borderRadius: 6 }}>• {item}</span>
                  ))}
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}

function Card({ title, subtitle, children, style = {} }) {
  return (
    <div style={{ background: "#1e293b", borderRadius: 14, padding: 16, ...style }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", margin: "0 0 2px" }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 14px" }}>{subtitle}</p>}
      {children}
    </div>
  );
}

function StatBox({ label, sublabel, value, color, bright }) {
  return (
    <div style={{ background: color, borderRadius: 10, padding: "12px", textAlign: "center" }}>
      <p style={{ color: "#64748b", fontSize: 10, margin: "0 0 2px", fontWeight: 700 }}>{label}</p>
      <p style={{ color: bright, fontWeight: 800, fontSize: 18, margin: "0 0 2px" }}>{value}</p>
      <p style={{ color: "#475569", fontSize: 10, margin: 0 }}>{sublabel}</p>
    </div>
  );
}

function Legend2({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block" }} />
      <span style={{ color: "#94a3b8", fontSize: 11 }}>{label}</span>
    </div>
  );
}
