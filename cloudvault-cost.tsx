import { useState } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const TEAL = "#0f766e";
const BLUE = "#0891b2";
const PURPLE = "#7c3aed";
const ORANGE = "#d97706";
const RED = "#dc2626";
const GREEN = "#16a34a";
const DIM = "#94a3b8";
const DARK = "#0f172a";
const CARD = "#1e293b";

const tabs = [
  { id: "summary", emoji: "💰", label: "Total Summary" },
  { id: "infra", emoji: "☁️", label: "Infrastructure" },
  { id: "tools", emoji: "🛠️", label: "Tools & Services" },
  { id: "phase", emoji: "📅", label: "Phase-wise" },
  { id: "free", emoji: "🆓", label: "Free Tricks" },
];

const pieData = [
  { name: "AWS S3 Storage", value: 800, color: ORANGE },
  { name: "AWS EC2 Server", value: 1200, color: BLUE },
  { name: "Domain + SSL", value: 150, color: PURPLE },
  { name: "Database (RDS)", value: 600, color: TEAL },
  { name: "Email Service", value: 100, color: GREEN },
  { name: "Monitoring", value: 150, color: DIM },
];

const phaseChart = [
  { phase: "Week 1-6\n(Build)", infra: 0, tools: 0, ads: 0, total: 0 },
  { phase: "Month 2-3\n(Launch)", infra: 800, tools: 200, ads: 0, total: 1000 },
  { phase: "Month 4-6\n(Grow)", infra: 2000, tools: 300, ads: 2000, total: 4300 },
  { phase: "Month 7-12\n(Scale)", infra: 5000, tools: 500, ads: 10000, total: 15500 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: CARD, border: "1px solid #334155", borderRadius: 8, padding: "10px 14px" }}>
        <p style={{ color: DIM, marginBottom: 4, fontSize: 12 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || "#f1f5f9", margin: "2px 0", fontSize: 12, fontWeight: 600 }}>
            {p.name}: ₹{p.value?.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function App() {
  const [active, setActive] = useState("summary");

  return (
    <div style={{ background: DARK, minHeight: "100vh", fontFamily: "'Inter',sans-serif", color: "#e2e8f0", padding: "20px 16px" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ display: "inline-block", background: CARD, borderRadius: 14, padding: "12px 20px" }}>
          <p style={{ color: TEAL, fontWeight: 800, fontSize: 17, margin: 0 }}>💸 CloudVault — Poora Kharcha</p>
          <p style={{ color: DIM, fontSize: 11, margin: "4px 0 0" }}>Launch se lekar scale tak — har rupee ka hisaab</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", justifyContent: "center", marginBottom: 24 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)}
            style={{ padding: "7px 13px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600,
              background: active === t.id ? TEAL : CARD, color: active === t.id ? "#fff" : DIM, transition: "all 0.2s" }}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* SUMMARY */}
      {active === "summary" && (
        <div>
          <Card title="💰 Ek Nazar Mein — Total Cost" color={TEAL}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <BigStat label="Week 1–6 (Build)" value="₹0" sub="Bilkul free mein build hoga" color={GREEN} />
              <BigStat label="Month 1–3 (Launch)" value="₹800–1,500" sub="Per month" color={TEAL} />
              <BigStat label="Month 4–6 (Grow)" value="₹3,000–5,000" sub="Per month" color={BLUE} />
              <BigStat label="Month 7–12 (Scale)" value="₹10,000–20,000" sub="Per month (ads included)" color={ORANGE} />
            </div>
            <div style={{ background: "#0a2520", borderRadius: 10, padding: 14, borderLeft: `3px solid ${TEAL}` }}>
              <p style={{ color: TEAL, fontWeight: 800, fontSize: 13, margin: "0 0 6px" }}>🎯 Sabse important baat</p>
              <p style={{ color: DIM, fontSize: 12, lineHeight: 1.8, margin: 0 }}>
                Pehle 6 hafte mein <b style={{ color: "#f1f5f9" }}>ek bhi rupee nahi lagega</b>. Sab free tiers se hoga — AWS Free Tier, Vercel free, Supabase free. Jab users aane lagein tab hi paisa lagega.
              </p>
            </div>
          </Card>

          <Card title="Kharcha Kahan Jaata Hai?" color={BLUE} style={{ marginTop: 14 }}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={85} dataKey="value" nameKey="name"
                  label={({ name, percent }) => `${name.split(" ")[1] || name.split(" ")[0]}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false} fontSize={9}>
                  {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={(v) => [`₹${v}/mo`, ""]} />
              </PieChart>
            </ResponsiveContainer>
            <p style={{ color: DIM, fontSize: 11, textAlign: "center", margin: "4px 0 0" }}>
              Monthly infra cost at ~1,000 users = <b style={{ color: "#f1f5f9" }}>₹3,000/mo total</b>
            </p>
          </Card>

          <Card title="Aur Revenue Kab Aayega?" color={GREEN} style={{ marginTop: 14 }}>
            <div style={{ background: "#0a1f0a", borderRadius: 10, padding: 14, borderLeft: `3px solid ${GREEN}` }}>
              <p style={{ color: "#f1f5f9", fontSize: 12, lineHeight: 1.9, margin: 0 }}>
                1,000 users × 5% conversion = <b style={{ color: GREEN }}>50 paying users</b><br />
                50 × ₹149/mo = <b style={{ color: GREEN }}>₹7,450/month revenue</b><br />
                Infra cost at 1K users = ~₹3,000/mo<br />
                <b style={{ color: "#f1f5f9" }}>Net profit = ₹4,450/month 🎉</b><br />
                <span style={{ color: DIM, fontSize: 11 }}>Yani 3rd month se hi profitable ho sakta hai CloudVault!</span>
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* INFRASTRUCTURE */}
      {active === "infra" && (
        <div>
          <Card title="☁️ AWS / Infrastructure Cost — User ke Saath Badhta Hai" color={ORANGE}>
            <p style={{ color: DIM, fontSize: 12, margin: "0 0 14px" }}>Infrastructure cost = server + storage + database. Jitne zyada users, utna zyada kharcha. But revenue bhi usi speed se badhta hai.</p>

            {[
              {
                service: "AWS S3 — File Storage",
                icon: "🗄️",
                color: ORANGE,
                free: "5 GB free (12 months)",
                at100: "₹200–400/mo",
                at1k: "₹800–1,500/mo",
                at10k: "₹5,000–8,000/mo",
                note: "Sabse bada cost driver. Per GB ~₹2/mo. 1000 users × 5GB avg = 5TB = ~₹800/mo",
                tip: "Free users ko 5GB cap karo strictly. Storage limit = cost limit."
              },
              {
                service: "AWS EC2 — Backend Server",
                icon: "🖥️",
                color: BLUE,
                free: "t2.micro free (12 months)",
                at100: "₹0 (free tier)",
                at1k: "₹800–1,200/mo",
                at10k: "₹3,000–5,000/mo",
                note: "Node.js backend yahan chalega. t3.small (~₹1,200/mo) se 5,000 users easily handle hote hain.",
                tip: "Start with free tier t2.micro. Upgrade sirf jab speed slow ho."
              },
              {
                service: "PostgreSQL — Database",
                icon: "🗃️",
                color: PURPLE,
                free: "Supabase free tier (500MB)",
                at100: "₹0 (Supabase free)",
                at1k: "₹600–800/mo",
                at10k: "₹2,000–3,000/mo",
                note: "Users, files, metadata sab yahan. Supabase free tier 50,000 users tak chalega (careful usage se).",
                tip: "Supabase use karo — PostgreSQL + Auth + Storage sab ek jagah. AWS RDS se sasta."
              },
              {
                service: "Vercel — Web Frontend",
                icon: "🌐",
                color: TEAL,
                free: "Free forever (hobby plan)",
                at100: "₹0",
                at1k: "₹0",
                at10k: "₹1,700/mo (Pro plan)",
                note: "React web app yahan deploy hoga. 10K users tak bilkul free.",
                tip: "Vercel hobby plan mein unlimited deployments milti hain. Best decision."
              },
              {
                service: "Domain Name",
                icon: "🔗",
                color: GREEN,
                free: "—",
                at100: "₹800–1,200/year",
                at1k: "Same",
                at10k: "Same",
                note: "cloudvault.app ya cloudvault.in — ek baar khareed lo, saal bhar chalta hai.",
                tip: "GoDaddy ya Namecheap se lo. .in domain sirf ₹600/year mein milta hai."
              },
              {
                service: "SSL Certificate",
                icon: "🔐",
                color: RED,
                free: "Let's Encrypt — FREE forever",
                at100: "₹0",
                at1k: "₹0",
                at10k: "₹0",
                note: "HTTPS ke liye SSL zaroori hai. Let's Encrypt bilkul free deta hai.",
                tip: "Kabhi paid SSL mat khareedna. Let's Encrypt = same security, zero cost."
              },
            ].map((s, i) => (
              <div key={i} style={{ background: DARK, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <p style={{ color: s.color, fontWeight: 800, fontSize: 13, margin: "0 0 8px" }}>{s.icon} {s.service}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 8 }}>
                  <CostTag label="Free Tier" val={s.free} color="#1e293b" />
                  <CostTag label="100 Users" val={s.at100} color="#0c1a2d" />
                  <CostTag label="1K Users" val={s.at1k} color="#0a1f1a" />
                  <CostTag label="10K Users" val={s.at10k} color="#1a1020" />
                </div>
                <p style={{ color: DIM, fontSize: 11, margin: "0 0 4px" }}>📌 {s.note}</p>
                <p style={{ color: TEAL, fontSize: 11, margin: 0 }}>💡 Tip: {s.tip}</p>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* TOOLS */}
      {active === "tools" && (
        <div>
          <Card title="🛠️ Development Tools — Kitne Mein?" color={PURPLE}>
            <p style={{ color: DIM, fontSize: 12, margin: "0 0 14px" }}>Khushi ki baat — zyaadatar development tools students ke liye bilkul free hain!</p>

            <div style={{ marginBottom: 14 }}>
              <p style={{ color: GREEN, fontWeight: 700, fontSize: 12, margin: "0 0 8px" }}>🆓 Completely FREE Tools</p>
              {[
                { tool: "Android Studio", use: "Android app banane ke liye", cost: "₹0" },
                { tool: "VS Code", use: "React + Node.js code karne ke liye", cost: "₹0" },
                { tool: "GitHub", use: "Code store karna + version control", cost: "₹0" },
                { tool: "Postman", use: "API test karne ke liye", cost: "₹0" },
                { tool: "Figma (free)", use: "UI design ke liye (3 projects free)", cost: "₹0" },
                { tool: "Firebase (free tier)", use: "Push notifications + analytics", cost: "₹0" },
                { tool: "Google Analytics", use: "Website traffic track karna", cost: "₹0" },
                { tool: "Let's Encrypt", use: "SSL certificate (HTTPS)", cost: "₹0" },
              ].map((t, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid #1e293b" }}>
                  <div>
                    <p style={{ color: "#f1f5f9", fontSize: 12, fontWeight: 600, margin: 0 }}>{t.tool}</p>
                    <p style={{ color: DIM, fontSize: 10, margin: 0 }}>{t.use}</p>
                  </div>
                  <span style={{ color: GREEN, fontWeight: 800, fontSize: 13 }}>{t.cost}</span>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 14 }}>
              <p style={{ color: ORANGE, fontWeight: 700, fontSize: 12, margin: "0 0 8px" }}>💳 Paid (But Cheap / Optional)</p>
              {[
                { tool: "Razorpay", use: "Payment gateway — UPI, cards accept karne ke liye", cost: "2% per transaction", when: "Sirf jab paid users aayein" },
                { tool: "SendGrid / Resend", use: "Email bhejne ke liye (verification, receipts)", cost: "₹0 (100 emails/day free)", when: "Launch se hi chahiye" },
                { tool: "Sentry (free tier)", use: "App crashes track karna", cost: "₹0 (5K errors/month free)", when: "Beta launch se" },
                { tool: "Cloudflare", use: "CDN + DDoS protection + DNS", cost: "₹0 (free plan bahut achha hai)", when: "Domain setup ke time" },
                { tool: "Play Store Account", use: "Android app publish karne ke liye", cost: "₹1,700 (one-time only)", when: "Launch ke time — zaroori hai" },
                { tool: "Apple Dev Account", use: "iOS app (optional)", cost: "₹8,000/year", when: "Pehle Android focus karo" },
              ].map((t, i) => (
                <div key={i} style={{ background: DARK, borderRadius: 8, padding: 10, marginBottom: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <p style={{ color: "#f1f5f9", fontSize: 12, fontWeight: 600, margin: "0 0 2px" }}>{t.tool}</p>
                    <span style={{ color: ORANGE, fontWeight: 700, fontSize: 12 }}>{t.cost}</span>
                  </div>
                  <p style={{ color: DIM, fontSize: 11, margin: "0 0 3px" }}>{t.use}</p>
                  <p style={{ color: TEAL, fontSize: 10, margin: 0 }}>⏰ {t.when}</p>
                </div>
              ))}
            </div>

            <div style={{ background: "#0a1f1a", borderRadius: 10, padding: 12, borderLeft: `3px solid ${TEAL}` }}>
              <p style={{ color: TEAL, fontWeight: 700, fontSize: 12, margin: "0 0 4px" }}>🎓 GitHub Student Developer Pack</p>
              <p style={{ color: DIM, fontSize: 12, margin: 0 }}>ABES ka .edu email hai tere paas? GitHub Student Pack se <b style={{ color: "#f1f5f9" }}>₹50,000+ ke tools bilkul free</b> milte hain — DigitalOcean credits, Namecheap domain, JetBrains IDE, aur bahut kuch. Apply karo aaj hi: <span style={{ color: BLUE }}>education.github.com/pack</span></p>
            </div>
          </Card>
        </div>
      )}

      {/* PHASE WISE */}
      {active === "phase" && (
        <div>
          <Card title="📅 Phase-wise Cost Breakdown" color={BLUE}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={phaseChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="phase" stroke="#475569" tick={{ fill: DIM, fontSize: 9 }} />
                <YAxis stroke="#475569" tick={{ fill: DIM, fontSize: 9 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: DIM, fontSize: 10 }} />
                <Bar dataKey="infra" name="Infrastructure" fill={ORANGE} stackId="a" />
                <Bar dataKey="tools" name="Tools" fill={BLUE} stackId="a" />
                <Bar dataKey="ads" name="Advertising" fill={PURPLE} stackId="a" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>

            {[
              {
                phase: "🔨 Phase 1 — Build (Week 1–6)",
                cost: "₹0 / month",
                color: GREEN,
                breakdown: [
                  { item: "AWS Free Tier (12 months)", cost: "₹0" },
                  { item: "Supabase Free Tier", cost: "₹0" },
                  { item: "Vercel Hobby Plan", cost: "₹0" },
                  { item: "GitHub Free", cost: "₹0" },
                  { item: "Development tools", cost: "₹0" },
                ],
                total: "₹0",
                note: "Pura MVP banao bina ek rupee lagaye. AWS 12 mahine free deta hai naye accounts ko."
              },
              {
                phase: "🚀 Phase 2 — Launch (Month 1–3)",
                cost: "₹800–1,500 / month",
                color: TEAL,
                breakdown: [
                  { item: "Domain name (cloudvault.in)", cost: "₹600/year = ₹50/mo" },
                  { item: "AWS S3 (first 200 users)", cost: "₹200–400/mo" },
                  { item: "EC2 t2.micro (free tier still)", cost: "₹0" },
                  { item: "Play Store one-time fee", cost: "₹1,700 (once)" },
                  { item: "SendGrid email (free tier)", cost: "₹0" },
                ],
                total: "~₹1,000/mo + ₹1,700 one-time",
                note: "Play Store fee ek baar hi lagti hai. Uske baad app lifetime publish kar sakte ho."
              },
              {
                phase: "📈 Phase 3 — Growth (Month 4–6)",
                cost: "₹3,000–5,000 / month",
                color: BLUE,
                breakdown: [
                  { item: "AWS S3 (1,000 users × 3GB avg)", cost: "₹800–1,200/mo" },
                  { item: "EC2 t3.small (free tier khatam)", cost: "₹1,000–1,200/mo" },
                  { item: "Supabase Pro (if needed)", cost: "₹2,000/mo" },
                  { item: "Cloudflare (DDoS protection)", cost: "₹0 (free plan)" },
                  { item: "Content creation (optional)", cost: "₹500–1,000/mo" },
                ],
                total: "~₹4,000/mo",
                note: "Yahan se revenue bhi aana shuru ho jaata hai. 1000 users × 5% = 50 paying × ₹149 = ₹7,450/mo."
              },
              {
                phase: "⚡ Phase 4 — Scale (Month 7–12)",
                cost: "₹10,000–20,000 / month",
                color: ORANGE,
                breakdown: [
                  { item: "AWS S3 (10,000 users)", cost: "₹4,000–6,000/mo" },
                  { item: "EC2 t3.medium", cost: "₹2,500–3,500/mo" },
                  { item: "RDS PostgreSQL", cost: "₹2,000–3,000/mo" },
                  { item: "Google Ads (optional)", cost: "₹3,000–8,000/mo" },
                  { item: "CDN / Cloudflare Pro", cost: "₹1,500/mo" },
                ],
                total: "~₹15,000/mo",
                note: "Par ab revenue bhi ₹50,000–80,000/mo ho chuki hai. Profit mein ho tum!"
              },
            ].map((p, i) => (
              <div key={i} style={{ background: DARK, borderRadius: 10, padding: 12, marginBottom: 10, borderLeft: `3px solid ${p.color}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <p style={{ color: p.color, fontWeight: 800, fontSize: 13, margin: 0 }}>{p.phase}</p>
                  <span style={{ color: "#f1f5f9", fontWeight: 800, fontSize: 13 }}>{p.cost}</span>
                </div>
                {p.breakdown.map((b, j) => (
                  <div key={j} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: j < p.breakdown.length - 1 ? "1px solid #1e293b" : "none" }}>
                    <span style={{ color: DIM, fontSize: 11 }}>{b.item}</span>
                    <span style={{ color: "#cbd5e1", fontSize: 11, fontWeight: 600 }}>{b.cost}</span>
                  </div>
                ))}
                <div style={{ background: CARD, borderRadius: 6, padding: 8, marginTop: 8 }}>
                  <p style={{ color: DIM, fontSize: 11, margin: 0 }}>💡 {p.note}</p>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* FREE TRICKS */}
      {active === "free" && (
        <div>
          <Card title="🆓 Kharcha Zero Karne ke Jugaad" color={GREEN}>
            <p style={{ color: DIM, fontSize: 12, margin: "0 0 14px" }}>Student hone ka fayda uthao. Ye sab free milta hai agar sahi se apply karo.</p>
            {[
              {
                trick: "GitHub Student Pack",
                saves: "₹50,000+ worth of tools",
                color: GREEN,
                how: "ABES .edu email se education.github.com/pack pe apply karo. DigitalOcean $200 credits, JetBrains free, Namecheap domain free — sab milta hai.",
                effort: "10 minute"
              },
              {
                trick: "AWS Free Tier (12 months)",
                saves: "₹15,000–20,000",
                color: ORANGE,
                how: "Naya AWS account banao. Pehle 12 mahine: EC2 t2.micro free, S3 5GB free, RDS free. CloudVault ka poora MVP FREE mein chalega.",
                effort: "30 minutes setup"
              },
              {
                trick: "Supabase Free Forever",
                saves: "₹2,000/mo",
                color: TEAL,
                how: "PostgreSQL + Auth + Storage sab free mein. 500MB database, 1GB file storage, 50,000 users tak free. AWS RDS se bahut sasta.",
                effort: "5 minute signup"
              },
              {
                trick: "Vercel Free Tier",
                saves: "₹1,500/mo",
                color: BLUE,
                how: "React frontend deploy karo Vercel pe. Hobby plan mein unlimited deploys, custom domain, HTTPS sab free. 10K users tak koi cost nahi.",
                effort: "GitHub connect karo — 2 minutes"
              },
              {
                trick: "Cloudflare Free Plan",
                saves: "₹1,000/mo (CDN + Security)",
                color: PURPLE,
                how: "Domain Cloudflare pe point karo. Free mein CDN (fast loading worldwide), DDoS protection, analytics sab milta hai.",
                effort: "DNS settings change — 15 minutes"
              },
              {
                trick: "ABES Startup Cell / Incubator",
                saves: "Potentially ₹5–10 Lakh funding",
                color: RED,
                how: "ABES mein startup incubation program hai. CloudVault present karo wahan. Free server resources, mentorship, aur seed funding mil sakta hai.",
                effort: "1 pitch presentation"
              },
              {
                trick: "Google Cloud Startup Program",
                saves: "$2,000 in GCP credits",
                color: GREEN,
                how: "cloud.google.com/startup pe apply karo. Early stage startups ko $2,000 credits milte hain. Firebase, Cloud Run sab free.",
                effort: "Application form — 20 minutes"
              },
            ].map((t, i) => (
              <div key={i} style={{ background: DARK, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <p style={{ color: t.color, fontWeight: 800, fontSize: 13, margin: 0 }}>🎯 {t.trick}</p>
                  <span style={{ background: "#0a2520", color: TEAL, fontSize: 10, padding: "3px 8px", borderRadius: 8, fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>Saves {t.saves}</span>
                </div>
                <p style={{ color: DIM, fontSize: 12, margin: "0 0 6px" }}>{t.how}</p>
                <p style={{ color: ORANGE, fontSize: 11, margin: 0 }}>⏱️ Effort: {t.effort}</p>
              </div>
            ))}

            <div style={{ background: "#0a2520", borderRadius: 12, padding: 14, marginTop: 6, borderLeft: `3px solid ${TEAL}` }}>
              <p style={{ color: TEAL, fontWeight: 800, fontSize: 13, margin: "0 0 6px" }}>🧮 Agar sab free tricks use karo toh...</p>
              <p style={{ color: "#f1f5f9", fontSize: 12, lineHeight: 1.9, margin: 0 }}>
                Pehle 12 mahine ka actual kharcha: <b style={{ color: GREEN }}>~₹1,700 (sirf Play Store fee)</b><br />
                Baaki sab free tiers aur credits se cover ho jaata hai.<br />
                <span style={{ color: DIM, fontSize: 11 }}>Ek student ke liye isse better deal nahi ho sakti.</span>
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function Card({ title, color, children, style = {} }) {
  return (
    <div style={{ background: CARD, borderRadius: 14, padding: 16, borderTop: `3px solid ${color}`, ...style }}>
      <h2 style={{ fontSize: 14, fontWeight: 800, color: "#f1f5f9", margin: "0 0 12px" }}>{title}</h2>
      {children}
    </div>
  );
}

function BigStat({ label, value, sub, color }) {
  return (
    <div style={{ background: DARK, borderRadius: 12, padding: 14, textAlign: "center" }}>
      <p style={{ color: DIM, fontSize: 10, margin: "0 0 4px", fontWeight: 600 }}>{label}</p>
      <p style={{ color, fontWeight: 800, fontSize: 18, margin: "0 0 2px" }}>{value}</p>
      <p style={{ color: "#475569", fontSize: 10, margin: 0 }}>{sub}</p>
    </div>
  );
}

function CostTag({ label, val, color }) {
  return (
    <div style={{ background: color, borderRadius: 6, padding: "6px 8px", textAlign: "center" }}>
      <p style={{ color: DIM, fontSize: 9, margin: "0 0 2px" }}>{label}</p>
      <p style={{ color: "#f1f5f9", fontSize: 10, fontWeight: 700, margin: 0 }}>{val}</p>
    </div>
  );
}
