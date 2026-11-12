import { useState } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const TEAL = "#0f766e"; const BLUE = "#0891b2"; const PURPLE = "#7c3aed";
const ORANGE = "#d97706"; const RED = "#dc2626"; const GREEN = "#16a34a";
const DIM = "#94a3b8"; const DARK = "#0f172a"; const CARD = "#1e293b";

const tabs = [
  { id: "invest", emoji: "💸", label: "Kaun Lagaye?" },
  { id: "equity", emoji: "📊", label: "Equity Split" },
  { id: "revenue", emoji: "💰", label: "Kaun Kitna Kamaye?" },
  { id: "models", emoji: "🤝", label: "3 Models" },
  { id: "advice", emoji: "🧠", label: "Meri Salah" },
];

const team = [
  { id: "CV-01", name: "Akshat Vats", role: "Project Lead + Full Stack", emoji: "🏗️", color: TEAL, weeks: 6, importance: 100, invest: 1700, equity: 40, contribution: "Poora project — vision, backend, AWS, deployment, management" },
  { id: "CV-02", name: "Akshat Kumar", role: "Android Developer", emoji: "📱", color: BLUE, weeks: 2, importance: 90, invest: 0, equity: 15, contribution: "Android app — Kotlin, Jetpack Compose, encryption on device" },
  { id: "CV-03", name: "Akshay Yadav", role: "React Frontend Dev", emoji: "🌐", color: PURPLE, weeks: 1, importance: 80, invest: 0, equity: 10, contribution: "Web dashboard — React 18, TypeScript, libsodium.js" },
  { id: "CV-04", name: "Akarsh Bhardwaj", role: "Backend Dev (Support)", emoji: "⚙️", color: ORANGE, weeks: 2, importance: 70, invest: 0, equity: 8, contribution: "Backend APIs — Node.js, Express, PostgreSQL, JWT" },
  { id: "CV-05a", name: "Ananya", role: "UI/UX Designer", emoji: "🎨", color: "#ec4899", weeks: 3, importance: 60, invest: 0, equity: 5, contribution: "UI design — Figma, FigJam, design system" },
  { id: "CV-05b", name: "Anokhi Agarwal", role: "UI/UX Designer", emoji: "🎨", color: "#f472b6", weeks: 3, importance: 60, invest: 0, equity: 5, contribution: "UI design — Figma, FigJam, component library" },
  { id: "CV-06a", name: "Arsh Rana", role: "DevOps Engineer", emoji: "🛠️", color: "#84cc16", weeks: 2, importance: 65, invest: 0, equity: 4, contribution: "AWS, GitHub Actions, Nginx, Docker setup" },
  { id: "CV-06b", name: "Ashwani Bhardwaj", role: "DevOps Engineer", emoji: "🛠️", color: "#65a30d", weeks: 2, importance: 65, invest: 0, equity: 4, contribution: "DevOps support — Cloudflare, CI/CD pipeline" },
  { id: "CV-07", name: "Akshat Singh", role: "Security Reviewer", emoji: "🔒", color: RED, weeks: 2, importance: 75, invest: 0, equity: 5, contribution: "Security audit — OWASP, Burp Suite, penetration testing" },
  { id: "CV-08", name: "Anaahita Tripathi", role: "QA Tester", emoji: "🧪", color: "#06b6d4", weeks: 1, importance: 55, invest: 0, equity: 4, contribution: "Testing — Postman, Jest, k6, Lighthouse" },
];

const equityData = team.map(m => ({ name: m.name.split(" ")[0], value: m.equity, color: m.color }));

const revenueScenario = [
  { month: "M3", rev: 7450 },
  { month: "M6", rev: 22350 },
  { month: "M9", rev: 60000 },
  { month: "M12", rev: 150000 },
  { month: "M18", rev: 400000 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: CARD, border: "1px solid #334155", borderRadius: 8, padding: "10px 14px" }}>
        <p style={{ color: DIM, marginBottom: 4, fontSize: 12 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || "#f1f5f9", margin: "2px 0", fontSize: 12, fontWeight: 600 }}>
            {p.name}: ₹{Number(p.value).toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function App() {
  const [active, setActive] = useState("invest");
  const [selectedModel, setSelectedModel] = useState("equity");

  return (
    <div style={{ background: DARK, minHeight: "100vh", fontFamily: "'Inter',sans-serif", color: "#e2e8f0", padding: "20px 16px" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ display: "inline-block", background: CARD, borderRadius: 14, padding: "12px 20px" }}>
          <p style={{ color: TEAL, fontWeight: 800, fontSize: 17, margin: 0 }}>💰 CloudVault — Paisa Discussion</p>
          <p style={{ color: DIM, fontSize: 11, margin: "4px 0 0" }}>11 log · 8 roles · Kaun lagaye, kaun kamaye</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", justifyContent: "center", marginBottom: 24 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)}
            style={{ padding: "7px 13px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600,
              background: active === t.id ? TEAL : CARD, color: active === t.id ? "#fff" : DIM }}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* KAUN LAGAYE */}
      {active === "invest" && (
        <div>
          <Card title="💸 Pehli Sachchi Baat — Investment ka Sach" color={TEAL}>
            <div style={{ background: "#0a2520", borderRadius: 10, padding: 14, marginBottom: 14, borderLeft: `3px solid ${TEAL}` }}>
              <p style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 13, margin: "0 0 6px" }}>🎯 Simple Answer</p>
              <p style={{ color: DIM, fontSize: 12, lineHeight: 1.8, margin: 0 }}>
                Is project mein <b style={{ color: "#f1f5f9" }}>kisi ko bhi paisa nahi lagana</b> — sirf ek cheez chhod ke. Play Store fee <b style={{ color: TEAL }}>₹1,700</b> — jo Akshat (tu) akela dega kyunki ye tera project hai aur tu Project Lead hai.
              </p>
            </div>

            <p style={{ color: DIM, fontSize: 12, margin: "0 0 14px" }}>Kyun baaki log paisa nahi lagaate? Kyunki sab ke paas already free tools hain:</p>

            {team.map((m, i) => (
              <div key={i} style={{ background: DARK, borderRadius: 10, padding: 11, marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 16 }}>{m.emoji}</span>
                    <div>
                      <p style={{ color: m.color, fontWeight: 700, fontSize: 12, margin: 0 }}>{m.name}</p>
                      <p style={{ color: DIM, fontSize: 10, margin: 0 }}>{m.role}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ color: m.invest > 0 ? ORANGE : GREEN, fontWeight: 800, fontSize: 14, margin: 0 }}>
                      {m.invest > 0 ? `₹${m.invest}` : "₹0"}
                    </p>
                    <p style={{ color: DIM, fontSize: 9, margin: 0 }}>{m.invest > 0 ? "One-time fee" : "Free tools use karo"}</p>
                  </div>
                </div>
                {m.invest > 0 && (
                  <p style={{ color: ORANGE, fontSize: 11, margin: "6px 0 0" }}>→ Play Store Developer Account (ek baar, lifetime valid)</p>
                )}
              </div>
            ))}

            <div style={{ background: "#0a1f0a", borderRadius: 10, padding: 12, marginTop: 6, borderLeft: `3px solid ${GREEN}` }}>
              <p style={{ color: GREEN, fontWeight: 700, fontSize: 12, margin: "0 0 4px" }}>✅ Conclusion</p>
              <p style={{ color: DIM, fontSize: 12, margin: 0 }}>Total upfront investment = <b style={{ color: "#f1f5f9" }}>sirf ₹1,700</b> (Akshat Vats ki taraf se). Baaki sab apna time aur skill lagate hain — yahi unki "investment" hai.</p>
            </div>
          </Card>
        </div>
      )}

      {/* EQUITY */}
      {active === "equity" && (
        <div>
          <Card title="📊 Equity Split — Kaun Kitna % Ka Maalik?" color={PURPLE}>
            <div style={{ background: "#0c1520", borderRadius: 10, padding: 12, marginBottom: 14, borderLeft: `3px solid ${BLUE}` }}>
              <p style={{ color: BLUE, fontWeight: 700, fontSize: 12, margin: "0 0 4px" }}>Equity kya hota hai?</p>
              <p style={{ color: DIM, fontSize: 12, margin: 0 }}>Equity = ownership. Agar CloudVault future mein ₹1 Crore ki company bani, toh 40% equity wale ko <b style={{ color: "#f1f5f9" }}>₹40 Lakh milenge</b>. Ye paisa tabhi milta hai jab company biki ya profit distribute ho.</p>
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={equityData} cx="50%" cy="50%" outerRadius={85} dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`} labelLine={false} fontSize={9}>
                  {equityData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v}%`, "Equity"]} />
              </PieChart>
            </ResponsiveContainer>

            {team.map((m, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < team.length - 1 ? "1px solid #1e293b" : "none" }}>
                <span style={{ fontSize: 14 }}>{m.emoji}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 12, margin: 0 }}>{m.name}</p>
                  <p style={{ color: DIM, fontSize: 10, margin: 0 }}>{m.role} · {m.weeks} week{m.weeks > 1 ? "s" : ""} active</p>
                </div>
                <div style={{ textAlign: "right", minWidth: 60 }}>
                  <p style={{ color: m.color, fontWeight: 800, fontSize: 14, margin: 0 }}>{m.equity}%</p>
                </div>
                <div style={{ width: 80, background: "#0f172a", borderRadius: 4, height: 6 }}>
                  <div style={{ width: `${m.equity * 2.5}%`, background: m.color, height: "100%", borderRadius: 4 }} />
                </div>
              </div>
            ))}

            <div style={{ background: "#0a2520", borderRadius: 10, padding: 12, marginTop: 12 }}>
              <p style={{ color: TEAL, fontWeight: 700, fontSize: 12, margin: "0 0 6px" }}>💡 Ye equity split kyun sahi hai?</p>
              <p style={{ color: DIM, fontSize: 12, lineHeight: 1.8, margin: 0 }}>
                Akshat Vats = 40% → <b style={{ color: "#f1f5f9" }}>Poora project lead kar raha hai, har phase mein active, idea bhi iska</b><br />
                Android Dev = 15% → <b style={{ color: "#f1f5f9" }}>Core product ka 50% Android app hai</b><br />
                Frontend = 10% → <b style={{ color: "#f1f5f9" }}>Web app equally important</b><br />
                Baaki = 4–8% each → <b style={{ color: "#f1f5f9" }}>Support roles, limited duration</b>
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* REVENUE */}
      {active === "revenue" && (
        <div>
          <Card title="💰 Kaun Kitna Kamayega — Revenue Scenarios" color={GREEN}>
            <p style={{ color: DIM, fontSize: 12, margin: "0 0 10px" }}>Projected monthly revenue × equity % = har member ka share</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueScenario}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#475569" tick={{ fill: DIM, fontSize: 10 }} />
                <YAxis stroke="#475569" tick={{ fill: DIM, fontSize: 9 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="rev" name="Monthly Revenue" fill={TEAL} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            <p style={{ color: DIM, fontSize: 11, margin: "12px 0 8px", fontWeight: 700 }}>At ₹1,50,000/month revenue (Month 12) — har kisi ka share:</p>
            {team.map((m, i) => {
              const share = Math.round(150000 * m.equity / 100);
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < team.length - 1 ? "1px solid #1e293b" : "none" }}>
                  <span style={{ fontSize: 14 }}>{m.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: "#f1f5f9", fontSize: 12, fontWeight: 600, margin: 0 }}>{m.name}</p>
                    <p style={{ color: DIM, fontSize: 10, margin: 0 }}>{m.equity}% equity</p>
                  </div>
                  <p style={{ color: share > 30000 ? TEAL : share > 10000 ? BLUE : DIM, fontWeight: 800, fontSize: 13, margin: 0 }}>
                    ₹{share.toLocaleString()}/mo
                  </p>
                </div>
              );
            })}

            <div style={{ background: "#0a1f0a", borderRadius: 10, padding: 12, marginTop: 12 }}>
              <p style={{ color: GREEN, fontWeight: 700, fontSize: 12, margin: "0 0 4px" }}>⚠️ But ek important baat</p>
              <p style={{ color: DIM, fontSize: 12, lineHeight: 1.8, margin: 0 }}>
                Equity-based income tabhi milti hai jab:<br />
                1️⃣ Company officially registered ho (LLP ya Pvt Ltd)<br />
                2️⃣ Founders agreement sign ho<br />
                3️⃣ Revenue distribute karne ka decision ho<br /><br />
                <b style={{ color: "#f1f5f9" }}>Abhi ke liye — contributor ko stipend/bounty model zyada practical hai.</b>
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* 3 MODELS */}
      {active === "models" && (
        <div>
          <Card title="🤝 3 Tarike — Team Ko Paisa Dene Ke" color={ORANGE}>
            <p style={{ color: DIM, fontSize: 12, margin: "0 0 14px" }}>Teen alag models hain. Tera situation decide karega kaun sa sahi hai.</p>

            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {[
                { id: "equity", label: "Equity Model", color: TEAL },
                { id: "bounty", label: "Bounty Model", color: BLUE },
                { id: "hybrid", label: "Hybrid Model", color: PURPLE },
              ].map(m => (
                <button key={m.id} onClick={() => setSelectedModel(m.id)}
                  style={{ flex: 1, padding: "8px 4px", borderRadius: 10, border: `2px solid ${selectedModel === m.id ? m.color : "#334155"}`,
                    background: selectedModel === m.id ? `${m.color}22` : DARK, color: selectedModel === m.id ? m.color : DIM,
                    cursor: "pointer", fontSize: 10, fontWeight: 700 }}>
                  {m.label}
                </button>
              ))}
            </div>

            {selectedModel === "equity" && (
              <div>
                <p style={{ color: TEAL, fontWeight: 800, fontSize: 14, margin: "0 0 10px" }}>📊 Equity Model — "Sab partners hain"</p>
                <p style={{ color: DIM, fontSize: 12, margin: "0 0 10px" }}>Har member ko % ownership milti hai. Jab company profit mein aaye ya biki, tabhi paisa milta hai. Abhi koi salary nahi.</p>
                <div style={{ background: DARK, borderRadius: 10, padding: 12, marginBottom: 8 }}>
                  <p style={{ color: GREEN, fontWeight: 700, fontSize: 12, margin: "0 0 6px" }}>✅ Fayde</p>
                  {["Long-term mein bahut zyada return", "Cash abhi kharcha nahi hota", "Team ko ownership feel hota hai — zyada kaam karte hain", "Startup culture mein standard practice"].map((f, i) => (
                    <p key={i} style={{ color: DIM, fontSize: 11, margin: "3px 0" }}>→ {f}</p>
                  ))}
                </div>
                <div style={{ background: DARK, borderRadius: 10, padding: 12, marginBottom: 8 }}>
                  <p style={{ color: RED, fontWeight: 700, fontSize: 12, margin: "0 0 6px" }}>❌ Nuksan</p>
                  {["Agreement sign karna padega — legal kaam", "Agar koi beech mein chhaad deta hai toh equity conflict", "Company registered honi chahiye", "Abhi real paisa nahi milta kisi ko"].map((f, i) => (
                    <p key={i} style={{ color: DIM, fontSize: 11, margin: "3px 0" }}>→ {f}</p>
                  ))}
                </div>
                <div style={{ background: "#0a2520", borderRadius: 8, padding: 10, borderLeft: `3px solid ${TEAL}` }}>
                  <p style={{ color: TEAL, fontSize: 11, margin: 0 }}>💡 Best for: Agar poori team serious hai aur long-term saath rehna chahti hai.</p>
                </div>
              </div>
            )}

            {selectedModel === "bounty" && (
              <div>
                <p style={{ color: BLUE, fontWeight: 800, fontSize: 14, margin: "0 0 10px" }}>💵 Bounty / Stipend Model — "Kaam ke badle paisa"</p>
                <p style={{ color: DIM, fontSize: 12, margin: "0 0 10px" }}>Har task ya milestone ke liye fixed amount decide karo. Kaam complete = paisa milta hai. Simple.</p>

                <div style={{ marginBottom: 10 }}>
                  {[
                    { role: "Android Developer", task: "Full Android app deliver karna", amount: "₹2,000–5,000" },
                    { role: "Frontend Dev", task: "React web app deliver karna", amount: "₹1,500–3,000" },
                    { role: "Backend Dev", task: "APIs + DB setup karna", amount: "₹1,000–2,000" },
                    { role: "UI/UX Designer", task: "Full design system + Figma", amount: "₹500–1,500 each" },
                    { role: "DevOps", task: "Deployment + CI/CD", amount: "₹500–1,000 each" },
                    { role: "Security", task: "Full audit complete karna", amount: "₹500–1,000" },
                    { role: "QA Tester", task: "Full testing + report", amount: "₹300–800" },
                  ].map((b, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #1e293b" }}>
                      <div>
                        <p style={{ color: "#f1f5f9", fontSize: 11, fontWeight: 600, margin: 0 }}>{b.role}</p>
                        <p style={{ color: DIM, fontSize: 10, margin: 0 }}>{b.task}</p>
                      </div>
                      <span style={{ color: BLUE, fontWeight: 800, fontSize: 12 }}>{b.amount}</span>
                    </div>
                  ))}
                </div>
                <p style={{ color: ORANGE, fontWeight: 700, fontSize: 12, margin: "0 0 4px" }}>Total budget needed: ~₹8,000–15,000</p>
                <div style={{ background: "#0c1a2d", borderRadius: 8, padding: 10, borderLeft: `3px solid ${BLUE}` }}>
                  <p style={{ color: BLUE, fontSize: 11, margin: 0 }}>💡 Best for: Agar team mein kuch log casual contributors hain aur sab co-founder nahi banna chahte.</p>
                </div>
              </div>
            )}

            {selectedModel === "hybrid" && (
              <div>
                <p style={{ color: PURPLE, fontWeight: 800, fontSize: 14, margin: "0 0 10px" }}>⚡ Hybrid Model — "Sabse Smart Option"</p>
                <p style={{ color: DIM, fontSize: 12, margin: "0 0 10px" }}>Core team ko equity do. Support roles ko bounty do. Dono ka fayda, dono ka risk avoid.</p>

                <div style={{ marginBottom: 10 }}>
                  <p style={{ color: GREEN, fontWeight: 700, fontSize: 11, margin: "0 0 8px" }}>🟢 Equity waale (Core Team — Long-term):</p>
                  {team.filter(m => ["CV-01","CV-02","CV-03","CV-04"].includes(m.id)).map((m, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1e293b" }}>
                      <p style={{ color: "#f1f5f9", fontSize: 12, margin: 0 }}>{m.emoji} {m.name}</p>
                      <span style={{ color: TEAL, fontWeight: 700, fontSize: 12 }}>{m.equity}% equity</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: 10 }}>
                  <p style={{ color: ORANGE, fontWeight: 700, fontSize: 11, margin: "0 0 8px" }}>🟡 Bounty waale (Support Roles — Short-term):</p>
                  {team.filter(m => !["CV-01","CV-02","CV-03","CV-04"].includes(m.id)).map((m, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1e293b" }}>
                      <p style={{ color: "#f1f5f9", fontSize: 12, margin: 0 }}>{m.emoji} {m.name}</p>
                      <span style={{ color: ORANGE, fontWeight: 700, fontSize: 12 }}>₹500–2,000 bounty</span>
                    </div>
                  ))}
                </div>

                <div style={{ background: "#1a0f2d", borderRadius: 8, padding: 10, borderLeft: `3px solid ${PURPLE}` }}>
                  <p style={{ color: PURPLE, fontSize: 11, margin: 0 }}>💡 Best for CloudVault: Core 4 log co-founders hain. Baaki 6 contributors hain — unhe milestone-based bounty do. Revenue aane par cash milega, pehle nahi.</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* MERI SALAH */}
      {active === "advice" && (
        <div>
          <Card title="🧠 Meri Personal Salah — Akshat Ke Liye" color={TEAL}>
            <div style={{ background: "#0a2520", borderRadius: 12, padding: 14, marginBottom: 14, borderLeft: `3px solid ${TEAL}` }}>
              <p style={{ color: TEAL, fontWeight: 800, fontSize: 13, margin: "0 0 6px" }}>Seedhi baat — kya karna chahiye abhi</p>
              <p style={{ color: DIM, fontSize: 12, lineHeight: 1.9, margin: 0 }}>
                Tu 1st year student hai. Company register karwana, equity agreements, ye sab <b style={{ color: "#f1f5f9" }}>abhi mat kar</b>. Pehle product ship karo. Pehle 1,000 users lao. <b style={{ color: TEAL }}>Tab ye conversations meaningful hongi.</b>
              </p>
            </div>

            {[
              {
                step: "Abhi karo (This week)",
                color: TEAL,
                items: [
                  { action: "Ek simple Google Doc banao", detail: "Har member ka naam, role, aur '% equity promised' likho. Sign karwa lo — informal hi sahi, kuch nahi se kuch better hai." },
                  { action: "Play Store fee tujhe hi bharna hai", detail: "₹1,700 — tera project, tera account. Kisi aur ko mat kehna split karne ko. Teri authority bani rehni chahiye." },
                  { action: "Bounty amounts decide karo", detail: "Har role ke liye max bounty batao upfront — 'Android dev: ₹3,000 on delivery'. Expectations clear rakho." },
                ]
              },
              {
                step: "Jab product launch ho (Month 1–3)",
                color: BLUE,
                items: [
                  { action: "Revenue aane par pehle infrastructure cover karo", detail: "Pehla ₹3,000–5,000 revenue → AWS/server bills bharo. Baad mein distribute karo." },
                  { action: "Bounty contributors ko pehle pay karo", detail: "Designers, DevOps, QA — inhone kaam kar diya. Inhein pehle clear karo. Core team ke equity wale wait kar sakte hain." },
                  { action: "Core team ke saath honest baat karo", detail: "Akshat Kumar, Akshay, Akarsh — ye long-term partners hain. Inke saath baithke equity document properly banao." },
                ]
              },
              {
                step: "Jab serious scale ho (Month 6+)",
                color: PURPLE,
                items: [
                  { action: "LLP ya Pvt Ltd register karo", detail: "Tab equity legal ho jaayegi. Chartered Accountant se milna — ABES ke alumni network mein mil jaayenge." },
                  { action: "Vesting schedule banao", detail: "1 saal se pehle kaun chhaad de toh uski equity reduce ho — ye standard startup practice hai." },
                  { action: "ABES incubator mein apply karo", detail: "Seed funding + legal support + mentorship. Student startup hone ka fayda uthao." },
                ]
              },
            ].map((s, si) => (
              <div key={si} style={{ background: DARK, borderRadius: 10, padding: 12, marginBottom: 10, borderLeft: `3px solid ${s.color}` }}>
                <p style={{ color: s.color, fontWeight: 800, fontSize: 13, margin: "0 0 10px" }}>📌 {s.step}</p>
                {s.items.map((item, ii) => (
                  <div key={ii} style={{ marginBottom: 8 }}>
                    <p style={{ color: "#f1f5f9", fontSize: 12, fontWeight: 700, margin: "0 0 2px" }}>→ {item.action}</p>
                    <p style={{ color: DIM, fontSize: 11, margin: 0 }}>{item.detail}</p>
                  </div>
                ))}
              </div>
            ))}

            <div style={{ background: "#0a2520", borderRadius: 12, padding: 14, borderLeft: `3px solid ${TEAL}` }}>
              <p style={{ color: "#f1f5f9", fontWeight: 800, fontSize: 13, lineHeight: 1.9, margin: 0 }}>
                "Pehle product ship karo.<br />
                <span style={{ color: TEAL }}>Paisa baad mein aata hai — trust pehle build hoti hai.</span><br />
                <span style={{ color: DIM, fontSize: 11, fontWeight: 400 }}>Tera sabse bada investment abhi tera time aur effort hai — rupee nahi.</span>"
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
