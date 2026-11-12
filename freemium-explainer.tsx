import { useState } from "react";
import { BarChart, Bar, LineChart, Line, FunnelChart, Funnel, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";

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
  { id: "what", emoji: "🧠", label: "What is it?" },
  { id: "how", emoji: "⚙️", label: "How it Works" },
  { id: "math", emoji: "🔢", label: "The Math" },
  { id: "effects", emoji: "📊", label: "Effects" },
  { id: "challenges", emoji: "⚠️", label: "Challenges" },
  { id: "implement", emoji: "🛠️", label: "What to Build" },
  { id: "mistakes", emoji: "❌", label: "Don'ts" },
];

// Funnel data
const funnelData = [
  { name: "Visitors", value: 10000, fill: "#1e3a5f" },
  { name: "Sign Up (Free)", value: 2000, fill: BLUE },
  { name: "Active Users", value: 800, fill: PURPLE },
  { name: "Paid Users", value: 40, fill: TEAL },
];

// Revenue growth
const revenueData = [
  { month: "M1", revenue: 0, users: 200 },
  { month: "M2", revenue: 0, users: 500 },
  { month: "M3", revenue: 500, users: 1000 },
  { month: "M4", revenue: 1200, users: 2000 },
  { month: "M6", revenue: 4000, users: 5000 },
  { month: "M9", revenue: 12000, users: 12000 },
  { month: "M12", revenue: 30000, users: 20000 },
  { month: "M18", revenue: 90000, users: 50000 },
];

// Conversion benchmarks
const conversionData = [
  { name: "Spotify", rate: 26 },
  { name: "Dropbox", rate: 4 },
  { name: "Slack", rate: 30 },
  { name: "Evernote", rate: 3 },
  { name: "CloudVault\n(target)", rate: 8 },
  { name: "Industry avg", rate: 5 },
];

// Feature split
const featureSplit = [
  { tier: "Free", features: ["5 GB storage", "AES-256 encryption", "Android + Web app", "File sync", "Basic sharing", "2 device limit"], color: BLUE, price: "₹0" },
  { tier: "Personal", features: ["100 GB storage", "Everything in Free", "Unlimited devices", "Version history (30 days)", "Priority support", "Offline access"], color: TEAL, price: "₹149/mo" },
  { tier: "Pro", features: ["1 TB storage", "Everything in Personal", "Version history (1 year)", "Advanced sharing controls", "Password-protected links", "API access"], color: PURPLE, price: "₹349/mo" },
];

// Challenges
const challenges = [
  {
    problem: "Too generous free tier",
    effect: "Users never need to upgrade → zero revenue",
    fix: "Make free useful but limited. 5GB fills up in ~3 months of normal use.",
    severity: "high",
    emoji: "🎁"
  },
  {
    problem: "Too stingy free tier",
    effect: "Users don't sign up → no funnel → no paid users either",
    fix: "Free must feel genuinely useful. At least match competitors' free tiers.",
    severity: "high",
    emoji: "🔒"
  },
  {
    problem: "Server costs before revenue",
    effect: "You pay AWS for free users. 2000 free users = real money out of pocket.",
    fix: "Cap storage hard. Use S3 lifecycle rules. Set a free user cost budget.",
    severity: "medium",
    emoji: "💸"
  },
  {
    problem: "Low conversion rate",
    effect: "Industry avg is 2–5%. 1000 users → only 20–50 paying.",
    fix: "Add in-app nudges at the right moment (when they hit 80% storage).",
    severity: "medium",
    emoji: "📉"
  },
  {
    problem: "Upgrade path unclear",
    effect: "User doesn't know WHY to upgrade — just sees a paywall",
    fix: "Show value BEFORE blocking. 'You're using 4.8 GB of 5 GB — upgrade for more.'",
    severity: "medium",
    emoji: "🚧"
  },
  {
    problem: "Free users abuse storage",
    effect: "Someone uploads 100GB using multiple accounts",
    fix: "Phone number / email verification. Rate limiting on uploads.",
    severity: "low",
    emoji: "🤖"
  },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: CARD, border: "1px solid #334155", borderRadius: 8, padding: "10px 14px" }}>
        <p style={{ color: DIM, marginBottom: 4, fontSize: 12 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || "#f1f5f9", margin: "2px 0", fontSize: 13, fontWeight: 600 }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function App() {
  const [active, setActive] = useState("what");

  return (
    <div style={{ background: DARK, minHeight: "100vh", fontFamily: "'Inter',sans-serif", color: "#e2e8f0", padding: "20px 16px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ display: "inline-block", background: CARD, borderRadius: 14, padding: "12px 20px" }}>
          <p style={{ color: TEAL, fontWeight: 800, fontSize: 17, margin: 0 }}>💎 Freemium Model</p>
          <p style={{ color: DIM, fontSize: 11, margin: "4px 0 0" }}>Complete guide for CloudVault — from concept to implementation</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", justifyContent: "center", marginBottom: 24 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)}
            style={{ padding: "7px 12px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600,
              background: active === t.id ? TEAL : CARD, color: active === t.id ? "#fff" : DIM, transition: "all 0.2s" }}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* ── WHAT IS IT ── */}
      {active === "what" && (
        <div>
          <Card title="🧠 Freemium in One Line" color={TEAL}>
            <div style={{ background: "#0a2520", borderRadius: 10, padding: 16, textAlign: "center", margin: "10px 0 16px" }}>
              <p style={{ color: "#f1f5f9", fontSize: 15, fontWeight: 700, margin: 0 }}>
                "Give the product for <span style={{ color: TEAL }}>free</span> to many,<br />sell <span style={{ color: ORANGE }}>upgrades</span> to the few who love it."
              </p>
            </div>
            <p style={{ color: DIM, fontSize: 12, lineHeight: 1.8, margin: 0 }}>
              FREE + PREMIUM = <b style={{ color: "#f1f5f9" }}>FREEMIUM</b><br /><br />
              The logic is simple: most people won't pay for something they haven't tried. So you let them try it free — build trust, build habit — then charge for more.
            </p>
          </Card>

          <Card title="Real World Examples" color={BLUE} style={{ marginTop: 14 }}>
            {[
              { app: "Spotify", free: "Music with ads", paid: "No ads + offline + quality", lesson: "Ads make free painful → upgrade feels like relief" },
              { app: "Dropbox", free: "2 GB storage", paid: "2 TB + team features", lesson: "Storage fills up naturally → upgrade feels necessary" },
              { app: "Notion", free: "Unlimited personal use", paid: "Team collaboration", lesson: "Individual habit → team adoption → company pays" },
              { app: "Canva", free: "Basic templates", paid: "Premium assets + brand kit", lesson: "Free builds skill → paid unlocks professional results" },
              { app: "CloudVault", free: "5 GB encrypted", paid: "More storage + features", lesson: "Free builds trust in privacy → paid gives more space" },
            ].map((e, i) => (
              <div key={i} style={{ padding: "10px 0", borderBottom: i < 4 ? "1px solid #334155" : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                  <span style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 13 }}>{e.app}</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Tag color="#1e3a5f" text={`Free: ${e.free}`} />
                    <Tag color="#0a2520" text={`Paid: ${e.paid}`} />
                  </div>
                </div>
                <p style={{ color: ORANGE, fontSize: 11, margin: 0 }}>💡 {e.lesson}</p>
              </div>
            ))}
          </Card>

          <Card title="Why Freemium Works Psychologically" color={PURPLE} style={{ marginTop: 14 }}>
            {[
              { icon: "🧠", title: "Loss Aversion", desc: "Once users store files in CloudVault, they fear losing access. They upgrade to keep what they have." },
              { icon: "🔁", title: "Habit Formation", desc: "After 30 days of daily use, CloudVault becomes routine. They won't switch even if a competitor is cheaper." },
              { icon: "🤝", title: "Trust First", desc: "No credit card signup = lower barrier to try. Trust is built before money is involved." },
              { icon: "📣", title: "Word of Mouth", desc: "Free users share your app with friends. You grow without spending on ads." },
            ].map((p, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < 3 ? "1px solid #334155" : "none" }}>
                <span style={{ fontSize: 20 }}>{p.icon}</span>
                <div>
                  <p style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 13, margin: "0 0 3px" }}>{p.title}</p>
                  <p style={{ color: DIM, fontSize: 12, margin: 0 }}>{p.desc}</p>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* ── HOW IT WORKS ── */}
      {active === "how" && (
        <div>
          <Card title="⚙️ The Freemium Funnel" color={BLUE}>
            <p style={{ color: DIM, fontSize: 12, margin: "0 0 14px" }}>Every freemium business works like a funnel — wide at top, narrow at bottom. Only a small % converts to paid, but that's enough.</p>
            <div style={{ marginBottom: 16 }}>
              {funnelData.map((d, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ color: DIM, fontSize: 11 }}>{d.name}</span>
                    <span style={{ color: "#f1f5f9", fontSize: 11, fontWeight: 700 }}>{d.value.toLocaleString()}</span>
                  </div>
                  <div style={{ background: "#0f172a", borderRadius: 4, height: 20, position: "relative" }}>
                    <div style={{ width: `${(d.value / 10000) * 100}%`, background: d.fill, height: "100%", borderRadius: 4, transition: "width 0.5s" }} />
                    <span style={{ position: "absolute", left: 8, top: 3, color: "#fff", fontSize: 10, fontWeight: 600 }}>
                      {((d.value / 10000) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: "#0a2520", borderRadius: 10, padding: 12, borderLeft: `3px solid ${TEAL}` }}>
              <p style={{ color: TEAL, fontWeight: 700, fontSize: 12, margin: "0 0 4px" }}>Key Insight for CloudVault</p>
              <p style={{ color: DIM, fontSize: 12, margin: 0 }}>Out of 10,000 visitors → only 40 pay. But 40 × ₹149 = <b style={{ color: "#f1f5f9" }}>₹5,960/month</b>. As users grow, revenue compounds fast.</p>
            </div>
          </Card>

          <Card title="The 3-Step Upgrade Journey" color={TEAL} style={{ marginTop: 14 }}>
            {[
              { step: "1", title: "User Signs Up Free", desc: "No credit card. Just email. They upload photos, documents. Start building the habit.", icon: "🆓", color: BLUE },
              { step: "2", title: "Trigger Moment", desc: "They hit 80% of 5GB. CloudVault shows: 'You're almost full. Upgrade for ₹149/mo to get 100GB.' This is the conversion moment.", icon: "⚡", color: ORANGE },
              { step: "3", title: "They Upgrade (or Lose Files)", desc: "Loss aversion kicks in. They don't want to delete memories. ₹149 feels cheap vs the effort of moving everything elsewhere.", icon: "💳", color: TEAL },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: i < 2 ? "1px solid #334155" : "none" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: s.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18 }}>
                  {s.icon}
                </div>
                <div>
                  <p style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 13, margin: "0 0 3px" }}>Step {s.step}: {s.title}</p>
                  <p style={{ color: DIM, fontSize: 12, margin: 0 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </Card>

          <Card title="CloudVault Tier Design" color={PURPLE} style={{ marginTop: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {featureSplit.map((tier, i) => (
                <div key={i} style={{ background: DARK, borderRadius: 10, padding: 10, border: `1px solid ${tier.color}33` }}>
                  <p style={{ color: tier.color, fontWeight: 800, fontSize: 13, margin: "0 0 2px" }}>{tier.tier}</p>
                  <p style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 14, margin: "0 0 10px" }}>{tier.price}</p>
                  {tier.features.map((f, j) => (
                    <p key={j} style={{ color: DIM, fontSize: 10, margin: "3px 0", display: "flex", gap: 4, alignItems: "flex-start" }}>
                      <span style={{ color: tier.color, flexShrink: 0 }}>✓</span> {f}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── THE MATH ── */}
      {active === "math" && (
        <div>
          <Card title="🔢 The Numbers Behind Freemium" color={TEAL}>
            <p style={{ color: DIM, fontSize: 12, margin: "0 0 14px" }}>Two most important metrics in freemium:</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <MathBox label="Conversion Rate" formula="Paid Users ÷ Total Users × 100" example="40 ÷ 1000 × 100 = 4%" color={TEAL} />
              <MathBox label="ARPU" formula="Total Revenue ÷ Paid Users" example="₹5,960 ÷ 40 = ₹149" color={BLUE} />
              <MathBox label="LTV" formula="ARPU × Avg Months Active" example="₹149 × 18 = ₹2,682" color={PURPLE} />
              <MathBox label="CAC" formula="Marketing Spend ÷ New Users" example="₹0 ÷ 1000 = ₹0 (organic)" color={GREEN} />
            </div>
            <div style={{ background: "#0a2520", borderRadius: 10, padding: 12, borderLeft: `3px solid ${TEAL}` }}>
              <p style={{ color: TEAL, fontWeight: 700, fontSize: 12, margin: "0 0 6px" }}>CloudVault at 20,000 users (Month 12)</p>
              <p style={{ color: DIM, fontSize: 12, margin: "3px 0" }}>• 8% conversion = <b style={{ color: "#f1f5f9" }}>1,600 paying users</b></p>
              <p style={{ color: DIM, fontSize: 12, margin: "3px 0" }}>• Avg plan = ₹200/mo → <b style={{ color: "#f1f5f9" }}>₹3,20,000/month</b></p>
              <p style={{ color: DIM, fontSize: 12, margin: "3px 0" }}>• Annual = <b style={{ color: TEAL }}>~₹38 Lakhs/year</b> from a student project 🔥</p>
            </div>
          </Card>

          <Card title="Industry Conversion Rate Benchmarks" color={BLUE} style={{ marginTop: 14 }}>
            <p style={{ color: DIM, fontSize: 11, margin: "0 0 10px" }}>Even 2% is good. 8% is exceptional. CloudVault can hit 8% because privacy users are more motivated.</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={conversionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#475569" tick={{ fill: DIM, fontSize: 9 }} />
                <YAxis stroke="#475569" tick={{ fill: DIM, fontSize: 10 }} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="rate" name="Conversion Rate %" radius={[6, 6, 0, 0]}>
                  {conversionData.map((d, i) => (
                    <Cell key={i} fill={d.name.includes("CloudVault") ? TEAL : d.name.includes("avg") ? ORANGE : "#334155"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Revenue Growth Projection" color={PURPLE} style={{ marginTop: 14 }}>
            <p style={{ color: DIM, fontSize: 11, margin: "0 0 10px" }}>Revenue starts at ₹0. Grows slowly. Then compounds fast after Month 6.</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#475569" tick={{ fill: DIM, fontSize: 10 }} />
                <YAxis stroke="#475569" tick={{ fill: DIM, fontSize: 9 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="revenue" stroke={TEAL} strokeWidth={2.5} dot={{ fill: TEAL, r: 4 }} name="Revenue (₹)" />
                <Line type="monotone" dataKey="users" stroke={BLUE} strokeWidth={2} strokeDasharray="5 5" dot={false} name="Users" />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8 }}>
              <Legend2 color={TEAL} label="Revenue (₹)" />
              <Legend2 color={BLUE} label="Users (dashed)" />
            </div>
          </Card>
        </div>
      )}

      {/* ── EFFECTS ── */}
      {active === "effects" && (
        <div>
          <Card title="📊 Positive Effects of Freemium" color={GREEN}>
            {[
              { icon: "🚀", title: "Viral Growth", desc: "Free users share CloudVault with friends. No ad budget needed. Dropbox grew to 4M users in 15 months purely through referrals.", metric: "10x cheaper than paid ads" },
              { icon: "🔒", title: "Lock-in Effect", desc: "Once users store 50+ files in CloudVault, switching cost is high. They stay. Churn drops below 5%/month.", metric: ">18 months avg retention" },
              { icon: "🏆", title: "Brand Trust", desc: "A product you use free builds more trust than one you paid for without trying. Privacy-first users especially distrust paid-only products.", metric: "3x higher NPS score" },
              { icon: "📈", title: "Data on Real Usage", desc: "Free users show you exactly how they use the app. You can see which features are most used before building paid features.", metric: "Better product decisions" },
              { icon: "🌍", title: "Market Penetration", desc: "Especially in India where ₹149 feels like a decision — free entry removes the barrier completely. More users = more word of mouth.", metric: "India: 70% users start free" },
            ].map((e, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < 4 ? "1px solid #334155" : "none" }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{e.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <p style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 13, margin: "0 0 3px" }}>{e.title}</p>
                    <Tag color="#0a2520" text={e.metric} />
                  </div>
                  <p style={{ color: DIM, fontSize: 12, margin: 0 }}>{e.desc}</p>
                </div>
              </div>
            ))}
          </Card>

          <Card title="📉 Negative Effects (if done wrong)" color={RED} style={{ marginTop: 14 }}>
            {[
              { icon: "💸", title: "Serving free users costs real money", desc: "AWS S3 charges you per GB stored and per GB transferred. 1000 users × 5GB = 5TB of storage you pay for monthly." },
              { icon: "😐", title: "Most users never convert", desc: "92–98% of freemium users NEVER pay. You build a product for thousands and earn from only dozens." },
              { icon: "😤", title: "Paywalls create frustration", desc: "If the free limit hits at the wrong time (mid-upload), users feel cheated and leave angry reviews." },
              { icon: "🐌", title: "Revenue takes time", desc: "Month 1–3 = zero revenue. You're investing time + money before seeing any return. Mentally tough for students." },
            ].map((e, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < 3 ? "1px solid #334155" : "none" }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{e.icon}</span>
                <div>
                  <p style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 13, margin: "0 0 3px" }}>{e.title}</p>
                  <p style={{ color: DIM, fontSize: 12, margin: 0 }}>{e.desc}</p>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* ── CHALLENGES ── */}
      {active === "challenges" && (
        <div>
          <Card title="⚠️ Every Challenge + How to Fix It" color={ORANGE}>
            <p style={{ color: DIM, fontSize: 12, margin: "0 0 14px" }}>These are the real problems every freemium startup faces. Read each one carefully.</p>
            {challenges.map((c, i) => (
              <div key={i} style={{ background: DARK, borderRadius: 10, padding: 12, marginBottom: 10, borderLeft: `3px solid ${c.severity === "high" ? RED : c.severity === "medium" ? ORANGE : BLUE}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <p style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 13, margin: 0 }}>{c.emoji} {c.problem}</p>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, fontWeight: 700,
                    background: c.severity === "high" ? "#2d1515" : c.severity === "medium" ? "#2d1f0a" : "#0f1f2d",
                    color: c.severity === "high" ? RED : c.severity === "medium" ? ORANGE : BLUE }}>
                    {c.severity.toUpperCase()}
                  </span>
                </div>
                <p style={{ color: RED, fontSize: 11, margin: "0 0 6px" }}>❌ Problem: {c.effect}</p>
                <p style={{ color: TEAL, fontSize: 11, margin: 0 }}>✅ Fix: {c.fix}</p>
              </div>
            ))}
          </Card>

          <Card title="The Goldilocks Problem" color={PURPLE} style={{ marginTop: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, textAlign: "center" }}>
              <div style={{ background: "#2d1515", borderRadius: 10, padding: 12 }}>
                <p style={{ fontSize: 20, margin: "0 0 6px" }}>❌</p>
                <p style={{ color: RED, fontWeight: 700, fontSize: 12, margin: "0 0 4px" }}>Too Generous</p>
                <p style={{ color: DIM, fontSize: 10, margin: 0 }}>50GB free → No one upgrades → No revenue → You shut down</p>
              </div>
              <div style={{ background: "#0a2520", borderRadius: 10, padding: 12, border: `1px solid ${TEAL}` }}>
                <p style={{ fontSize: 20, margin: "0 0 6px" }}>✅</p>
                <p style={{ color: TEAL, fontWeight: 700, fontSize: 12, margin: "0 0 4px" }}>Just Right</p>
                <p style={{ color: DIM, fontSize: 10, margin: 0 }}>5GB free → Fills in ~3 months → Natural upgrade moment</p>
              </div>
              <div style={{ background: "#2d1515", borderRadius: 10, padding: 12 }}>
                <p style={{ fontSize: 20, margin: "0 0 6px" }}>❌</p>
                <p style={{ color: RED, fontWeight: 700, fontSize: 12, margin: "0 0 4px" }}>Too Stingy</p>
                <p style={{ color: DIM, fontSize: 10, margin: 0 }}>500MB free → No one bothers → Low signups → No funnel</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── IMPLEMENT ── */}
      {active === "implement" && (
        <div>
          <Card title="🛠️ Exactly What to Build for CloudVault" color={TEAL}>
            <p style={{ color: DIM, fontSize: 12, margin: "0 0 14px" }}>These are the specific features that make freemium work. Build them in this order.</p>
            {[
              {
                priority: "🔴 Must Have (Week 1–6)",
                items: [
                  { feature: "Hard storage limit enforcement", why: "5GB cap must be real, not just UI. Backend must reject uploads over limit.", tech: "S3 bucket policy + backend check before upload" },
                  { feature: "Storage usage indicator", why: "Show users how full they are (like Gmail's bottom bar). Creates anxiety that converts.", tech: "DB query: SUM(file_sizes) per user" },
                  { feature: "Upgrade prompt at 80% full", why: "Trigger the upgrade modal when user hits 80%, not 100%. Don't wait till they're angry.", tech: "Middleware check on each upload" },
                  { feature: "Tier-based feature gating", why: "Free users get 2 devices. Paid get unlimited. Gate is enforced server-side, not just UI.", tech: "User.tier check in JWT middleware" },
                ]
              },
              {
                priority: "🟡 Should Have (Month 2–3)",
                items: [
                  { feature: "Smart upgrade nudges", why: "In-app banner: 'You've uploaded 47 files this month — power user! Unlock 20× more space.'", tech: "Analytics event triggers → push notification" },
                  { feature: "Referral system", why: "Free user refers a friend → both get +2GB. Dropbox grew 60% with this alone.", tech: "Unique referral code per user, tracked in DB" },
                  { feature: "Payment integration", why: "Razorpay for Indian users. Simple ₹149/₹349 plans. Auto-renewal.", tech: "Razorpay API + webhook for subscription status" },
                  { feature: "Downgrade gracefully", why: "If paid user cancels → don't delete files. Lock them, show 'reactivate to access'. Creates FOMO.", tech: "User status: active/locked/deleted" },
                ]
              },
              {
                priority: "🟢 Nice to Have (Month 4+)",
                items: [
                  { feature: "Annual plan discount", why: "₹149/mo × 12 = ₹1788. Offer annual at ₹1199 — user saves, you get cash upfront.", tech: "Razorpay subscription: monthly vs annual plan" },
                  { feature: "Usage analytics dashboard", why: "Show users their own data: '23 files uploaded, 1.2GB used'. Makes them feel invested.", tech: "Aggregate logs table in PostgreSQL" },
                  { feature: "Team plan onboarding", why: "If 3+ accounts share the same org email — suggest team plan. Enterprise starts here.", tech: "Email domain grouping logic" },
                ]
              }
            ].map((section, si) => (
              <div key={si} style={{ marginBottom: 16 }}>
                <p style={{ color: si === 0 ? RED : si === 1 ? ORANGE : GREEN, fontWeight: 700, fontSize: 12, margin: "0 0 8px" }}>{section.priority}</p>
                {section.items.map((item, ii) => (
                  <div key={ii} style={{ background: DARK, borderRadius: 8, padding: 10, marginBottom: 6 }}>
                    <p style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 12, margin: "0 0 3px" }}>⚙️ {item.feature}</p>
                    <p style={{ color: DIM, fontSize: 11, margin: "0 0 4px" }}>{item.why}</p>
                    <p style={{ color: BLUE, fontSize: 10, margin: 0, fontFamily: "monospace" }}>→ {item.tech}</p>
                  </div>
                ))}
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* ── MISTAKES ── */}
      {active === "mistakes" && (
        <div>
          <Card title="❌ Mistakes That Kill Freemium Products" color={RED}>
            {[
              { no: "Charging too early", yes: "Get 1000 active users first. Then introduce paid. Charging at 50 users = no data, no trust.", icon: "⏰" },
              { no: "Gating core value behind paywall", yes: "Core value (encryption + sync) must be free. Only EXTRA value is paid. If free is useless, nobody signs up.", icon: "🔐" },
              { no: "Showing upgrade popup every session", yes: "Show upgrade prompt only at the natural trigger (80% storage). Constant popups = users uninstall.", icon: "😤" },
              { no: "One tier jump (free → ₹999)", yes: "Have a ₹149 stepping stone. Big price jump = huge friction. Small jump = easier yes.", icon: "💸" },
              { no: "Deleting files when user doesn't upgrade", yes: "Lock files, don't delete. Deletion = angry user. Locked files = FOMO + they come back.", icon: "🗑️" },
              { no: "No referral/sharing loop", yes: "Add 'Share CloudVault' button prominently. Free growth > paid ads for a student-built product.", icon: "📣" },
              { no: "Ignoring free user feedback", yes: "Free users are your best product testers. Survey them — they'll tell you exactly what would make them pay.", icon: "👂" },
              { no: "Building team features before individual is solid", yes: "Individual product-market fit first. Then teams. Dropbox took 3 years before Dropbox Business.", icon: "🏗️" },
            ].map((m, i) => (
              <div key={i} style={{ padding: "10px 0", borderBottom: i < 7 ? "1px solid #334155" : "none" }}>
                <p style={{ color: RED, fontSize: 12, margin: "0 0 4px" }}>❌ Don't: {m.icon} {m.no}</p>
                <p style={{ color: TEAL, fontSize: 12, margin: 0 }}>✅ Do: {m.yes}</p>
              </div>
            ))}
          </Card>

          <Card title="The One Rule That Summarises Freemium" color={TEAL} style={{ marginTop: 14 }}>
            <div style={{ background: "#0a2520", borderRadius: 12, padding: 16, textAlign: "center" }}>
              <p style={{ color: "#f1f5f9", fontSize: 14, fontWeight: 700, lineHeight: 1.8, margin: 0 }}>
                "Free must be good enough that users <span style={{ color: TEAL }}>stay</span>.<br />
                Free must be limited enough that users <span style={{ color: ORANGE }}>upgrade</span>.<br />
                Paid must be valuable enough that users <span style={{ color: GREEN }}>never leave</span>."
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

function Tag({ color, text }) {
  return (
    <span style={{ background: color, color: DIM, fontSize: 9, padding: "2px 6px", borderRadius: 6, whiteSpace: "nowrap", flexShrink: 0 }}>{text}</span>
  );
}

function MathBox({ label, formula, example, color }) {
  return (
    <div style={{ background: DARK, borderRadius: 10, padding: 12, borderLeft: `3px solid ${color}` }}>
      <p style={{ color: color, fontWeight: 700, fontSize: 11, margin: "0 0 4px" }}>{label}</p>
      <p style={{ color: DIM, fontSize: 10, margin: "0 0 4px", fontFamily: "monospace" }}>{formula}</p>
      <p style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 11, margin: 0 }}>{example}</p>
    </div>
  );
}

function Legend2({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block" }} />
      <span style={{ color: DIM, fontSize: 11 }}>{label}</span>
    </div>
  );
}
