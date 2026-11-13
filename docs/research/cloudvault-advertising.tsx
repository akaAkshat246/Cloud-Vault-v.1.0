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
  { id: "overview", emoji: "🗺️", label: "Overview" },
  { id: "organic", emoji: "🌱", label: "Organic (Free)" },
  { id: "community", emoji: "👥", label: "Community" },
  { id: "content", emoji: "✍️", label: "Content" },
  { id: "paid", emoji: "💰", label: "Paid Ads" },
  { id: "timeline", emoji: "📅", label: "Timeline" },
  { id: "metrics", emoji: "📊", label: "Metrics" },
];

const adTypeData = [
  { type: "Community/Reddit", cost: 0, reach: 70, trust: 95, effort: 60 },
  { type: "Content/SEO", cost: 0, reach: 85, trust: 90, effort: 80 },
  { type: "Referral Program", cost: 10, reach: 60, trust: 85, effort: 30 },
  { type: "Product Hunt", cost: 0, reach: 75, trust: 80, effort: 50 },
  { type: "Google Ads", cost: 90, reach: 95, trust: 40, effort: 40 },
  { type: "Instagram Ads", cost: 80, reach: 88, trust: 35, effort: 50 },
  { type: "Influencer", cost: 50, reach: 70, trust: 70, effort: 60 },
];

const phaseData = [
  { month: "M1", organic: 200, paid: 0, referral: 0 },
  { month: "M2", organic: 400, paid: 0, referral: 50 },
  { month: "M3", organic: 600, paid: 0, referral: 150 },
  { month: "M4", organic: 800, paid: 200, referral: 300 },
  { month: "M6", organic: 1200, paid: 800, referral: 800 },
  { month: "M9", organic: 2000, paid: 2000, referral: 2000 },
  { month: "M12", organic: 3000, paid: 5000, referral: 5000 },
];

const budgetData = [
  { name: "Phase 1\n(₹0)", organic: 100, paid: 0 },
  { name: "Phase 2\n(₹5K/mo)", organic: 60, paid: 40 },
  { name: "Phase 3\n(₹20K/mo)", organic: 40, paid: 60 },
  { name: "Phase 4\n(₹1L/mo)", organic: 25, paid: 75 },
];

const channelROI = [
  { channel: "Reddit Posts", cost: "₹0", users: "500–2000", roi: "∞", color: ORANGE },
  { channel: "Product Hunt", cost: "₹0", users: "200–5000", roi: "∞", color: TEAL },
  { channel: "YouTube SEO", cost: "₹0", users: "100–1000/mo", roi: "∞", color: RED },
  { channel: "Referral Program", cost: "~₹20/user", users: "Scales with base", roi: "10x", color: BLUE },
  { channel: "Google Ads", cost: "₹80–150/click", users: "Paid only", roi: "2–3x", color: PURPLE },
  { channel: "Instagram Ads", cost: "₹50–100/click", users: "Low intent", roi: "1–2x", color: GREEN },
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
  const [active, setActive] = useState("overview");

  return (
    <div style={{ background: DARK, minHeight: "100vh", fontFamily: "'Inter',sans-serif", color: "#e2e8f0", padding: "20px 16px" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ display: "inline-block", background: CARD, borderRadius: 14, padding: "12px 20px" }}>
          <p style={{ color: TEAL, fontWeight: 800, fontSize: 17, margin: 0 }}>📢 CloudVault Advertising Strategy</p>
          <p style={{ color: DIM, fontSize: 11, margin: "4px 0 0" }}>What to use, when to use it, and how much to spend</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", justifyContent: "center", marginBottom: 24 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)}
            style={{ padding: "7px 12px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600,
              background: active === t.id ? TEAL : CARD, color: active === t.id ? "#fff" : DIM, transition: "all 0.2s" }}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {active === "overview" && (
        <div>
          <Card title="The #1 Rule for CloudVault Advertising" color={TEAL}>
            <div style={{ background: "#0a2520", borderRadius: 12, padding: 16, textAlign: "center", margin: "4px 0 16px" }}>
              <p style={{ color: "#f1f5f9", fontSize: 14, fontWeight: 700, lineHeight: 1.8, margin: 0 }}>
                "A privacy product that runs Instagram ads<br />
                <span style={{ color: RED }}>looks hypocritical.</span><br />
                Build trust first. <span style={{ color: TEAL }}>Ads come later.</span>"
              </p>
            </div>
            <p style={{ color: DIM, fontSize: 12, lineHeight: 1.8 }}>CloudVault's core value is privacy. Your early users are privacy-conscious — they distrust ads. So your advertising strategy must match your values: <b style={{ color: "#f1f5f9" }}>organic first, community-driven, honest.</b></p>
          </Card>

          <Card title="Ad Channel Comparison — Cost vs Trust vs Reach" color={BLUE} style={{ marginTop: 14 }}>
            <p style={{ color: DIM, fontSize: 11, margin: "0 0 10px" }}>For a privacy product, trust score matters more than reach.</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={adTypeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="type" stroke="#475569" tick={{ fill: DIM, fontSize: 8 }} angle={-15} textAnchor="end" height={50} />
                <YAxis stroke="#475569" tick={{ fill: DIM, fontSize: 10 }} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: DIM, fontSize: 10 }} />
                <Bar dataKey="trust" name="Trust Score" fill={TEAL} radius={[4,4,0,0]} />
                <Bar dataKey="reach" name="Reach Score" fill={BLUE} radius={[4,4,0,0]} />
                <Bar dataKey="cost" name="Cost Score" fill={RED} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
            <p style={{ color: DIM, fontSize: 11, margin: "8px 0 0", textAlign: "center" }}>🟢 Teal = Trust · 🔵 Blue = Reach · 🔴 Red = Cost (lower is better for cost)</p>
          </Card>

          <Card title="Two Types of Advertising" color={PURPLE} style={{ marginTop: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ background: "#0a2520", borderRadius: 10, padding: 12, border: `1px solid ${TEAL}` }}>
                <p style={{ color: TEAL, fontWeight: 800, fontSize: 13, margin: "0 0 6px" }}>🌱 Organic</p>
                <p style={{ color: DIM, fontSize: 11, margin: "0 0 8px" }}>Free. Slow to start. Compounds over time. Builds real trust.</p>
                {["Reddit posts", "YouTube videos", "SEO blogs", "Product Hunt", "Word of mouth", "GitHub presence"].map((i, j) => (
                  <p key={j} style={{ color: "#cbd5e1", fontSize: 11, margin: "3px 0" }}>✓ {i}</p>
                ))}
              </div>
              <div style={{ background: "#0c1a2d", borderRadius: 10, padding: 12, border: `1px solid ${BLUE}` }}>
                <p style={{ color: BLUE, fontWeight: 800, fontSize: 13, margin: "0 0 6px" }}>💰 Paid</p>
                <p style={{ color: DIM, fontSize: 11, margin: "0 0 8px" }}>Costs money. Fast results. Stops when budget stops.</p>
                {["Google Ads", "Instagram Ads", "Twitter/X Ads", "YouTube Ads", "Influencer deals", "Sponsored posts"].map((i, j) => (
                  <p key={j} style={{ color: "#cbd5e1", fontSize: 11, margin: "3px 0" }}>✓ {i}</p>
                ))}
              </div>
            </div>
            <div style={{ background: "#0a2520", borderRadius: 10, padding: 12, marginTop: 10, borderLeft: `3px solid ${TEAL}` }}>
              <p style={{ color: TEAL, fontWeight: 700, fontSize: 12, margin: "0 0 4px" }}>💡 CloudVault Strategy</p>
              <p style={{ color: DIM, fontSize: 12, margin: 0 }}>Month 1–6: 100% organic. Month 6–12: mostly organic + small paid. Month 12+: scale paid after PMF is proven.</p>
            </div>
          </Card>
        </div>
      )}

      {/* ORGANIC */}
      {active === "organic" && (
        <div>
          <Card title="🌱 Organic Advertising — Your Most Powerful Tool" color={TEAL}>
            <p style={{ color: DIM, fontSize: 12, margin: "0 0 14px" }}>Organic = free marketing that earns attention instead of buying it. For CloudVault, this is 10x more effective than paid ads because your users distrust advertising.</p>
            {[
              {
                platform: "Reddit",
                icon: "🟠",
                color: ORANGE,
                where: "r/privacy, r/degoogle, r/selfhosted, r/india, r/androidapps",
                how: "Don't post 'Download my app'. Instead: post a genuine story — 'I built an encrypted Google Drive alternative as a 1st-year student. Here's what I learned.' People LOVE this narrative.",
                reach: "500–5000 users per post",
                example: "Title: 'I was tired of Google reading my files, so I built my own cloud storage (with E2E encryption) — feedback welcome'"
              },
              {
                platform: "Product Hunt",
                icon: "🐱",
                color: RED,
                where: "producthunt.com — launch your app here",
                how: "One big launch day. Get friends/family to upvote early (first 2 hours matter most). Write a compelling tagline: 'CloudVault — Private cloud storage that Google can't read'.",
                reach: "200–5000 signups in 24 hours",
                example: "Tagline: 'Your files, your eyes only. E2E encrypted cloud storage for Android + Web — built by a student, priced for humans.'"
              },
              {
                platform: "GitHub",
                icon: "⚫",
                color: DIM,
                where: "Open source part of your codebase",
                how: "Privacy-conscious developers trust open source. Even open-sourcing your encryption layer (not the full product) builds massive credibility. Star count = social proof.",
                reach: "Developer community trust",
                example: "Repo: cloudvault-crypto — 'The open-source encryption core of CloudVault. Auditable by anyone.'"
              },
              {
                platform: "Twitter / X",
                icon: "🐦",
                color: BLUE,
                where: "Tech Twitter, Privacy Twitter, IndieHacker community",
                how: "Build in public. Tweet your progress weekly: '2 weeks in: AES-256 encryption working on Android. 3 weeks: first beta user uploaded their first file.' People root for builders.",
                reach: "Compounding followers over time",
                example: "Thread: 'I'm a 1st-year CSE student building a private Google Drive. Week 3 update 🧵'"
              },
              {
                platform: "LinkedIn",
                icon: "🔵",
                color: BLUE,
                where: "Tech professionals, startup ecosystem, investors",
                how: "Post your journey as a student founder. ABES Engineering student building privacy tech = compelling story. Tag professors, startup incubators, Shark Tank India accounts.",
                reach: "Professional network + potential investors",
                example: "Post: 'As a 1st-year BTech student, I'm building CloudVault — because I believe privacy shouldn't cost $14/month. Here's why I started...'"
              },
            ].map((p, i) => (
              <div key={i} style={{ background: DARK, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <p style={{ color: p.color, fontWeight: 800, fontSize: 14, margin: 0 }}>{p.icon} {p.platform}</p>
                  <Tag color="#0a2520" text={p.reach} bright={TEAL} />
                </div>
                <p style={{ color: DIM, fontSize: 11, margin: "0 0 4px" }}>📍 Where: {p.where}</p>
                <p style={{ color: "#cbd5e1", fontSize: 11, margin: "0 0 6px" }}>📌 How: {p.how}</p>
                <div style={{ background: CARD, borderRadius: 6, padding: 8 }}>
                  <p style={{ color: TEAL, fontSize: 10, margin: 0, fontStyle: "italic" }}>💬 Example: "{p.example}"</p>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* COMMUNITY */}
      {active === "community" && (
        <div>
          <Card title="👥 Community-Led Growth" color={PURPLE}>
            <p style={{ color: DIM, fontSize: 12, margin: "0 0 14px" }}>Community advertising = getting other people to talk about you. The most trusted form of marketing because it's not you saying you're good — it's others saying it.</p>

            <Card title="1. Referral Program" color={TEAL} style={{ marginBottom: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                <div style={{ background: DARK, borderRadius: 8, padding: 10 }}>
                  <p style={{ color: TEAL, fontWeight: 700, fontSize: 12, margin: "0 0 4px" }}>What to offer</p>
                  <p style={{ color: DIM, fontSize: 11, margin: 0 }}>Refer a friend → both get +2 GB free. Simple. Scales automatically.</p>
                </div>
                <div style={{ background: DARK, borderRadius: 8, padding: 10 }}>
                  <p style={{ color: TEAL, fontWeight: 700, fontSize: 12, margin: "0 0 4px" }}>Why it works</p>
                  <p style={{ color: DIM, fontSize: 11, margin: 0 }}>Dropbox grew 60% in one year with this exact model. Cost per user: ~₹20 (storage cost) vs ₹150 via ads.</p>
                </div>
              </div>
              <div style={{ background: "#0a2520", borderRadius: 8, padding: 10 }}>
                <p style={{ color: TEAL, fontSize: 11, fontWeight: 700, margin: "0 0 4px" }}>How to implement</p>
                <p style={{ color: DIM, fontSize: 11, margin: 0 }}>Every user gets a unique link: cloudvault.app/ref/akshat123. When someone signs up via that link, both accounts get +2GB. Track in DB. Show referral count in settings.</p>
              </div>
            </Card>

            <Card title="2. Student Ambassador Program" color={BLUE} style={{ marginBottom: 12 }}>
              <p style={{ color: DIM, fontSize: 12, margin: "0 0 10px" }}>Recruit 1 student per college to promote CloudVault in their campus. Give them free Pro account + recognition.</p>
              {[
                "Post in their college WhatsApp groups",
                "Demo at tech fests and hackathons",
                "Put CloudVault posters in CS labs",
                "Talk about it in coding clubs",
              ].map((item, i) => (
                <p key={i} style={{ color: "#cbd5e1", fontSize: 12, margin: "4px 0" }}>→ {item}</p>
              ))}
              <div style={{ background: "#0c1a2d", borderRadius: 8, padding: 10, marginTop: 8 }}>
                <p style={{ color: BLUE, fontSize: 11, margin: 0 }}>Start with ABES + 4–5 nearby colleges. 1 ambassador per college can bring 50–200 users.</p>
              </div>
            </Card>

            <Card title="3. WhatsApp & Telegram Groups" color={ORANGE} style={{ marginBottom: 12 }}>
              <p style={{ color: DIM, fontSize: 12, margin: "0 0 10px" }}>India's most powerful free marketing channel. Join existing groups, don't spam — contribute first, then share.</p>
              {[
                { group: "BTech/CSE college groups", action: "Share as 'a project by one of us'" },
                { group: "Coding communities (C++, Android dev)", action: "Share the GitHub + ask for code feedback" },
                { group: "Privacy/tech groups on Telegram", action: "Share as an alternative to Google Drive" },
                { group: "Startup India groups", action: "Share as a student-built startup story" },
              ].map((g, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <span style={{ color: ORANGE, fontSize: 11, flexShrink: 0 }}>📱</span>
                  <div>
                    <p style={{ color: "#f1f5f9", fontSize: 11, fontWeight: 600, margin: 0 }}>{g.group}</p>
                    <p style={{ color: DIM, fontSize: 10, margin: 0 }}>→ {g.action}</p>
                  </div>
                </div>
              ))}
            </Card>
          </Card>
        </div>
      )}

      {/* CONTENT */}
      {active === "content" && (
        <div>
          <Card title="✍️ Content Marketing — Build Once, Earn Forever" color={BLUE}>
            <p style={{ color: DIM, fontSize: 12, margin: "0 0 14px" }}>Content = articles, videos, posts that help people. When people search for 'best private cloud storage India' — your content should appear. This is called SEO (Search Engine Optimization).</p>

            {[
              {
                type: "YouTube Videos",
                icon: "▶️",
                color: RED,
                effort: "High",
                payoff: "Very High",
                ideas: [
                  "'I built my own Google Drive in 6 weeks — here's how'",
                  "'Why Google Drive is NOT private (and what to use instead)'",
                  "'CloudVault vs Google Drive — honest comparison'",
                  "'How AES-256 encryption works — explained simply'",
                ],
                tip: "YouTube videos rank on Google Search. 'Best private cloud storage India 2026' — you want to appear here."
              },
              {
                type: "Blog / Medium Articles",
                icon: "📝",
                color: GREEN,
                effort: "Medium",
                payoff: "High (SEO)",
                ideas: [
                  "'5 reasons to stop using Google Drive in 2026'",
                  "'How end-to-end encryption actually works'",
                  "'Best cloud storage for Indian students — honest review'",
                  "'I built a Dropbox alternative as a BTech student'",
                ],
                tip: "Target keywords: 'private cloud storage India', 'Google Drive alternative', 'encrypted file storage Android'."
              },
              {
                type: "Instagram / Reels",
                icon: "📸",
                color: PURPLE,
                effort: "Medium",
                payoff: "Medium",
                ideas: [
                  "30-sec reel: 'Did you know Google reads your Drive files?'",
                  "Before/after: 'Google Drive vs CloudVault privacy'",
                  "Behind the scenes: student coding at midnight",
                  "Infographic: 'What happens to your files on Google Drive'",
                ],
                tip: "Reels reach non-followers. Privacy + student story = emotional hook. Add 'link in bio' for signups."
              },
              {
                type: "Build-in-Public Threads",
                icon: "🧵",
                color: ORANGE,
                effort: "Low",
                payoff: "High (community)",
                ideas: [
                  "Weekly update: 'CloudVault Week 4: first 100 users 🎉'",
                  "Technical thread: 'How I implemented AES-256 on Android'",
                  "Honest thread: 'Things that broke this week building CloudVault'",
                  "Milestone thread: 'Play Store approved! Here's what's next'",
                ],
                tip: "Build-in-public creates an audience of people rooting for you. They become your first paying customers."
              },
            ].map((c, i) => (
              <div key={i} style={{ background: DARK, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <p style={{ color: c.color, fontWeight: 800, fontSize: 14, margin: 0 }}>{c.icon} {c.type}</p>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Tag color="#1a1a2e" text={`Effort: ${c.effort}`} bright={DIM} />
                    <Tag color="#0a2520" text={`Payoff: ${c.payoff}`} bright={TEAL} />
                  </div>
                </div>
                <div style={{ marginBottom: 8 }}>
                  {c.ideas.map((idea, j) => (
                    <p key={j} style={{ color: "#cbd5e1", fontSize: 11, margin: "4px 0" }}>• {idea}</p>
                  ))}
                </div>
                <div style={{ background: CARD, borderRadius: 6, padding: 8 }}>
                  <p style={{ color: c.color, fontSize: 11, margin: 0 }}>💡 {c.tip}</p>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* PAID ADS */}
      {active === "paid" && (
        <div>
          <Card title="💰 Paid Ads — When & How to Use Them" color={ORANGE}>
            <div style={{ background: "#2d1a0a", borderRadius: 10, padding: 12, marginBottom: 14, borderLeft: `3px solid ${ORANGE}` }}>
              <p style={{ color: ORANGE, fontWeight: 700, fontSize: 12, margin: "0 0 4px" }}>⚠️ Important Warning</p>
              <p style={{ color: DIM, fontSize: 12, margin: 0 }}>Don't run paid ads until Month 6. You need to first prove people actually want your product (product-market fit). Spending money to send people to a broken/unproven product = wasted money.</p>
            </div>

            {[
              {
                platform: "Google Ads (Search)",
                icon: "🔍",
                color: BLUE,
                when: "After Month 6, when you have ₹5,000+/mo budget",
                why: "People searching 'private cloud storage India' or 'Google Drive alternative' have HIGH INTENT — they're actively looking for you.",
                keywords: ["private cloud storage India", "encrypted file storage app", "Google Drive alternative Android", "secure cloud storage ₹"],
                budget: "₹3,000–10,000/mo to start",
                warning: "Only run Search ads, NOT Display ads. Display = banner ads on websites = low trust for privacy product."
              },
              {
                platform: "Instagram / Meta Ads",
                icon: "📱",
                color: PURPLE,
                when: "After Month 9, only for brand awareness",
                why: "Instagram reaches people who don't know they need you yet. Good for brand building, not direct conversion.",
                keywords: ["Interest: Privacy, Cybersecurity, Android apps", "Age: 18–28, India", "Behaviour: Google Drive users"],
                budget: "₹2,000–5,000/mo",
                warning: "Irony alert: advertising a privacy app on Meta (which collects massive data) can feel hypocritical. Use carefully, with honest messaging."
              },
              {
                platform: "Tech Influencers (YouTube/Instagram)",
                icon: "🎥",
                color: TEAL,
                when: "Month 4–6, when product is polished",
                why: "1 honest review from a trusted tech YouTuber = more signups than ₹50,000 in ads. Audience trusts them.",
                keywords: ["Tech reviewers: Gaurav Chaudhary (Technical Guruji)", "Privacy channels: The Hated One", "Android channels: MKBHD (later stage)", "Student tech creators on Instagram"],
                budget: "₹0–5,000 (many small creators do it free for good products)",
                warning: "Don't pay for fake positive reviews. Ask for honest reviews. Credibility > hype."
              },
            ].map((ad, i) => (
              <div key={i} style={{ background: DARK, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <p style={{ color: ad.color, fontWeight: 800, fontSize: 14, margin: 0 }}>{ad.icon} {ad.platform}</p>
                  <Tag color="#0a2520" text={ad.budget} bright={TEAL} />
                </div>
                <p style={{ color: ORANGE, fontSize: 11, margin: "0 0 4px" }}>⏰ When: {ad.when}</p>
                <p style={{ color: "#cbd5e1", fontSize: 11, margin: "0 0 6px" }}>✅ Why: {ad.why}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
                  {ad.keywords.map((k, j) => (
                    <span key={j} style={{ background: CARD, color: DIM, fontSize: 9, padding: "2px 7px", borderRadius: 6 }}>{k}</span>
                  ))}
                </div>
                <p style={{ color: RED, fontSize: 11, margin: 0 }}>⚠️ {ad.warning}</p>
              </div>
            ))}
          </Card>

          <Card title="Channel ROI Comparison" color={TEAL} style={{ marginTop: 14 }}>
            {channelROI.map((c, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: i < 5 ? "1px solid #334155" : "none" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                  <p style={{ color: "#f1f5f9", fontSize: 12, fontWeight: 600, margin: 0 }}>{c.channel}</p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Tag color="#1a1515" text={c.cost} bright={RED} />
                  <Tag color="#0a2520" text={`ROI: ${c.roi}`} bright={c.roi === "∞" ? TEAL : DIM} />
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* TIMELINE */}
      {active === "timeline" && (
        <div>
          <Card title="📅 When to Use What — Month by Month" color={PURPLE}>
            {[
              {
                phase: "Month 1–3: Launch Phase",
                color: TEAL,
                budget: "₹0",
                focus: "Get first 1,000 users. Zero paid ads.",
                actions: [
                  "Post on Reddit r/privacy, r/degoogle with honest story",
                  "Launch on Product Hunt — get friends to upvote",
                  "Share in ABES + nearby college WhatsApp groups",
                  "Start build-in-public on Twitter/LinkedIn",
                  "Submit to GitHub Awesome lists",
                  "Post in Telegram privacy groups",
                ]
              },
              {
                phase: "Month 3–6: Growth Phase",
                color: BLUE,
                budget: "₹2,000–5,000/mo",
                focus: "Grow to 5,000 users. First content pieces.",
                actions: [
                  "Launch referral program (+2GB per referral)",
                  "First YouTube video: 'I built a private Google Drive'",
                  "Write 2 Medium articles targeting SEO keywords",
                  "Reach out to 10 small tech YouTubers for reviews",
                  "Start student ambassador program (5 colleges)",
                  "Instagram Reels: privacy awareness content",
                ]
              },
              {
                phase: "Month 6–12: Scale Phase",
                color: ORANGE,
                budget: "₹10,000–25,000/mo",
                focus: "Reach 20,000 users. Start paid ads carefully.",
                actions: [
                  "Google Search Ads: 'private cloud storage India'",
                  "Bigger YouTuber collab (1 paid review)",
                  "Weekly blog posts for SEO",
                  "College tech fest sponsorships",
                  "Press release to tech blogs (YourStory, Inc42)",
                  "Email newsletter to existing users",
                ]
              },
              {
                phase: "Month 12+: Monetize Phase",
                color: PURPLE,
                budget: "₹50,000–1L/mo",
                focus: "150,000 users. Serious paid acquisition.",
                actions: [
                  "Google Ads + Instagram Ads at scale",
                  "Major YouTuber collaborations",
                  "B2B outreach to small companies",
                  "App Store optimization (ASO)",
                  "PR in mainstream tech media",
                  "Consider startup incubator / funding pitch",
                ]
              },
            ].map((phase, i) => (
              <div key={i} style={{ background: DARK, borderRadius: 10, padding: 12, marginBottom: 10, borderLeft: `3px solid ${phase.color}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <p style={{ color: phase.color, fontWeight: 800, fontSize: 13, margin: 0 }}>{phase.phase}</p>
                  <Tag color="#0a2520" text={`Budget: ${phase.budget}`} bright={TEAL} />
                </div>
                <p style={{ color: "#f1f5f9", fontSize: 12, fontWeight: 600, margin: "0 0 8px" }}>🎯 {phase.focus}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                  {phase.actions.map((a, j) => (
                    <p key={j} style={{ color: DIM, fontSize: 10, margin: "2px 0" }}>→ {a}</p>
                  ))}
                </div>
              </div>
            ))}
          </Card>

          <Card title="User Growth by Channel Over Time" color={TEAL} style={{ marginTop: 14 }}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={phaseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#475569" tick={{ fill: DIM, fontSize: 10 }} />
                <YAxis stroke="#475569" tick={{ fill: DIM, fontSize: 9 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: DIM, fontSize: 10 }} />
                <Line type="monotone" dataKey="organic" stroke={TEAL} strokeWidth={2.5} dot={{ r: 3 }} name="Organic" />
                <Line type="monotone" dataKey="referral" stroke={ORANGE} strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} name="Referral" />
                <Line type="monotone" dataKey="paid" stroke={BLUE} strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} name="Paid Ads" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* METRICS */}
      {active === "metrics" && (
        <div>
          <Card title="📊 How to Measure if Advertising is Working" color={GREEN}>
            <p style={{ color: DIM, fontSize: 12, margin: "0 0 14px" }}>You can't improve what you don't measure. Track these numbers every week.</p>
            {[
              { metric: "CAC", full: "Customer Acquisition Cost", formula: "Total ad spend ÷ new users", good: "< ₹50 for organic, < ₹300 for paid", emoji: "💰" },
              { metric: "Signup Rate", full: "% of visitors who sign up", formula: "Signups ÷ website visits × 100", good: "> 5% is good, > 15% is great", emoji: "📝" },
              { metric: "Activation Rate", full: "% who upload at least 1 file", formula: "Active users ÷ signups × 100", good: "> 40% means onboarding works", emoji: "⚡" },
              { metric: "Referral Rate", full: "% who refer a friend", formula: "Referrals ÷ total users × 100", good: "> 10% is viral growth territory", emoji: "📣" },
              { metric: "Channel Attribution", full: "Which channel sent each user", formula: "UTM parameters in every link", good: "Know exactly what's working", emoji: "🔍" },
              { metric: "Content Traffic", full: "Monthly visits from articles/videos", formula: "Google Analytics / Search Console", good: "Growing month-over-month = SEO working", emoji: "📈" },
            ].map((m, i) => (
              <div key={i} style={{ background: DARK, borderRadius: 10, padding: 12, marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ color: "#f1f5f9", fontWeight: 800, fontSize: 13, margin: "0 0 2px" }}>{m.emoji} {m.metric} <span style={{ color: DIM, fontWeight: 400, fontSize: 11 }}>({m.full})</span></p>
                    <p style={{ color: DIM, fontSize: 11, margin: "0 0 4px" }}>Formula: {m.formula}</p>
                  </div>
                </div>
                <div style={{ background: "#0a2520", borderRadius: 6, padding: "6px 10px" }}>
                  <p style={{ color: TEAL, fontSize: 11, margin: 0 }}>✅ Target: {m.good}</p>
                </div>
              </div>
            ))}
          </Card>

          <Card title="Free Tools to Track All This" color={BLUE} style={{ marginTop: 14 }}>
            {[
              { tool: "Google Analytics 4", use: "Track website visitors, signup rates, traffic sources. Free forever.", link: "analytics.google.com" },
              { tool: "Google Search Console", use: "See which Google searches bring people to your blog/site. Essential for SEO.", link: "search.google.com/search-console" },
              { tool: "UTM Builder", use: "Add ?utm_source=reddit to every link you share so you know which platform sent users.", link: "ga-dev-tools.google.com/campaign-url-builder" },
              { tool: "PostHog (free tier)", use: "Track in-app events: uploads, signups, upgrade button clicks. Open source.", link: "posthog.com" },
            ].map((t, i) => (
              <div key={i} style={{ padding: "10px 0", borderBottom: i < 3 ? "1px solid #334155" : "none" }}>
                <p style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 13, margin: "0 0 3px" }}>🛠️ {t.tool}</p>
                <p style={{ color: DIM, fontSize: 11, margin: "0 0 3px" }}>{t.use}</p>
                <p style={{ color: BLUE, fontSize: 10, margin: 0 }}>→ {t.link}</p>
              </div>
            ))}
          </Card>

          <Card title="The One Golden Rule of Advertising" color={TEAL} style={{ marginTop: 14 }}>
            <div style={{ background: "#0a2520", borderRadius: 12, padding: 16, textAlign: "center" }}>
              <p style={{ color: "#f1f5f9", fontSize: 13, fontWeight: 700, lineHeight: 1.9, margin: 0 }}>
                "Don't advertise a product people don't love yet.<br />
                <span style={{ color: TEAL }}>Build something people tell their friends about.</span><br />
                <span style={{ color: DIM, fontSize: 11, fontWeight: 400 }}>Advertising amplifies word of mouth — it doesn't replace it.</span>"
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

function Tag({ color, text, bright }) {
  return (
    <span style={{ background: color, color: bright || DIM, fontSize: 9, padding: "2px 7px", borderRadius: 6, whiteSpace: "nowrap", flexShrink: 0, fontWeight: 600 }}>{text}</span>
  );
}
