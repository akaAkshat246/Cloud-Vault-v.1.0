import { useState } from "react";

const TEAL = "#0f766e";
const BLUE = "#0891b2";
const PURPLE = "#7c3aed";
const ORANGE = "#d97706";
const RED = "#dc2626";
const DIM = "#94a3b8";

const lessons = [
  {
    id: "market",
    emoji: "📈",
    title: "What is a Market?",
    color: TEAL,
    sections: [
      {
        heading: "Simple Definition",
        content: "A market is just: all the people who might buy your product + all the money they could spend on it.\n\nExample: The cloud storage market = every person/company on Earth that pays for Google Drive, Dropbox, etc. Combined, they spend $179 Billion per year."
      },
      {
        heading: "The Line Chart (Market Growth)",
        visual: "line",
        content: "The line chart shows one simple thing:\n\n📅 X-axis (horizontal) = Years (2022 → 2031)\n💰 Y-axis (vertical) = Market size in Billion $\n📈 The line goes up = More money being spent every year\n\nFor CloudVault: The market goes from $179B (2026) → $514B (2031). That means if you build something good NOW, you're entering a market that's growing very fast — like getting on a train before it speeds up."
      },
      {
        heading: "CAGR — What Does 23.45% Mean?",
        content: "CAGR = Compound Annual Growth Rate. It just means: 'how fast does this market grow every year on average?'\n\n23.45% CAGR means: every year, the market gets 23% bigger than last year.\n\nAnalogy: If your savings account gave 23% interest every year — it would double every ~3 years. That's how fast cloud storage is growing. Very fast. Good time to enter."
      }
    ]
  },
  {
    id: "position",
    emoji: "📍",
    title: "Market Position (Scatter Plot)",
    color: BLUE,
    sections: [
      {
        heading: "What is a Scatter Plot?",
        content: "A scatter plot places every product as a DOT on a grid with two questions:\n\n→ X-axis: How expensive is it? (left = cheap, right = costly)\n→ Y-axis: How private/secure is it? (up = very private, down = not private)\n\nEach dot = one product. Where the dot sits = what that product is known for."
      },
      {
        heading: "Reading CloudVault's Position",
        visual: "scatter",
        content: "Google Drive dot → bottom-left = cheap BUT zero privacy (they read your files for ads)\nTresorit dot → top-right = very private BUT very expensive ($14/mo)\nCloudVault dot → TOP-LEFT = very private AND cheap\n\n🏆 The top-left corner is EMPTY. No competitor lives there. That's your opportunity — you're not fighting anyone for that spot."
      },
      {
        heading: "Why Does This Matter?",
        content: "When you launch, people will ask: 'Why should I use CloudVault instead of Google Drive?'\n\nYour answer: 'Google Drive reads your files. We don't. And we're cheaper than the ones who also don't.'\n\nThat's called a positioning statement — it explains exactly where you fit in the market."
      }
    ]
  },
  {
    id: "tam",
    emoji: "🎯",
    title: "TAM, SAM, SOM",
    color: PURPLE,
    sections: [
      {
        heading: "The 3 Circles Explained",
        visual: "circles",
        content: "Imagine 3 circles inside each other, biggest to smallest:\n\n🔵 TAM (Total Addressable Market) = $179B\n'If every cloud storage user in the world used CloudVault, how much money is that?'\n→ This is the DREAM number. Not realistic, but shows the ceiling.\n\n🟦 SAM (Serviceable Addressable Market) = $22B\n'Of all those users, how many actually care about privacy?' \n→ These are the people who'd CONSIDER you. About 12% of TAM.\n\n🟩 SOM (Serviceable Obtainable Market) = $2.2B\n'How much can you REALISTICALLY capture in 3 years?'\n→ This is your actual target. Even 0.1% of TAM = $179M. Massive."
      },
      {
        heading: "Why Investors Ask This",
        content: "When you pitch CloudVault to anyone (investors, teammates, college judges), they ask: 'How big can this get?'\n\nYou say: 'The privacy-first storage market is $22B. We're targeting $2.2B in 3 years — that's just 10% of our SAM.'\n\nSounds achievable AND ambitious. That's the magic of TAM/SAM/SOM."
      }
    ]
  },
  {
    id: "radar",
    emoji: "🕸️",
    title: "Feature Radar Chart",
    color: ORANGE,
    sections: [
      {
        heading: "What is a Radar Chart?",
        visual: "radar",
        content: "A radar chart (also called spider chart) is a shape made of multiple axes coming out of a center point. Each axis = one feature or quality.\n\nThe BIGGER the shape = the better overall score\nEach corner = one specific area (Privacy, Price, UX, etc.)\n\nExample: If CloudVault's 'Privacy' axis goes all the way to the edge → 100/100 privacy score."
      },
      {
        heading: "What CloudVault's Radar Tells You",
        content: "✅ STRONG corners (your shape is big here):\n→ Privacy/E2E — 98/100 (nobody beats you)\n→ Pricing Value — 90/100 (you're much cheaper than rivals)\n→ Open Architecture — 85/100 (users can trust your code)\n\n⚠️ WEAK corners (your shape is small here):\n→ Collaboration — 45/100 (no Google Docs-style editing yet)\n\nThis tells you: DON'T try to beat Google at collaboration right now. WIN on privacy first. Fix collaboration in v2."
      },
      {
        heading: "Strategy from a Radar Chart",
        content: "A radar chart helps you decide WHERE to focus your limited time as a 1st-year student building this:\n\n1st → Nail your strong sides (privacy, price)\n2nd → Don't waste time on weak sides where giants have years of head start\n3rd → Add weak features slowly after you have users"
      }
    ]
  },
  {
    id: "edges",
    emoji: "⚔️",
    title: "Competitive Edges & Moats",
    color: RED,
    sections: [
      {
        heading: "What is a Competitive Edge?",
        content: "A competitive edge = something you do BETTER than competitors that makes customers choose you.\n\nExample:\n→ McDonald's edge = speed + consistency + price\n→ Apple's edge = design + ecosystem\n→ CloudVault's edge = privacy + price"
      },
      {
        heading: "The Bar Chart (Edge Gap)",
        visual: "bars",
        content: "The bar chart compares CloudVault (teal bars) vs Market Average (grey bars) on each quality.\n\nThe GAP between the two bars = your advantage.\n\nBiggest gaps for CloudVault:\n+77 → No Data Harvesting (Google reads files, you don't)\n+73 → E2E Encryption by default (most don't have it)\n+58 → Open Architecture (users can verify your claims)\n+55 → Student/Young Users (no one targets this segment)\n\nBigger gap = harder for competitors to catch up"
      },
      {
        heading: "What is a Moat?",
        content: "A moat is a LONG-TERM advantage that's hard to copy. Named after castle moats — the water that keeps enemies out.\n\nCloudVault's 3 moats:\n\n🔐 Moat 1: E2E Encryption\nGoogle CAN'T offer this — they need to read files for their ad business. This is structurally impossible for them to copy without destroying their own revenue.\n\n💸 Moat 2: Privacy at Low Price\nTresorit charges $14/mo. You target $1.8/mo. You can undercut them because you're not a big company with huge costs yet.\n\n📱 Moat 3: Android-Native First\nMost privacy tools are made for computers. A proper Android app (Kotlin + Jetpack Compose) is rare in this space — especially in India."
      }
    ]
  },
  {
    id: "pricing",
    emoji: "💰",
    title: "Pricing Strategy",
    color: "#16a34a",
    sections: [
      {
        heading: "Why Pricing is a Strategy, Not Just a Number",
        content: "Price isn't just 'how much you charge.' It sends a signal:\n\n→ Too cheap = 'Is this even good?'\n→ Too expensive = 'Why not just use Dropbox?'\n→ Just right = 'This is better AND more affordable'\n\nCloudVault's recommended pricing:\n🆓 Free: 5–10 GB (to get users in)\n💙 Personal: ₹149/mo (~$1.8) — beats Google One on privacy\n💜 Pro: ₹349/mo (~$4.2) — beats ProtonDrive on UX\n🏢 Team: ₹249/user/mo — way cheaper than Dropbox Business"
      },
      {
        heading: "The Freemium Model",
        content: "Freemium = Give something free, charge for more.\n\nHow it works for CloudVault:\n1. User signs up for free (5GB)\n2. They fill up storage → upgrade to ₹149/mo\n3. They love it → tell friends → friends sign up free\n4. Repeat\n\nThis is how Dropbox grew from 0 to 500M users. Spotify uses this too. Free gets you users. Paid gets you revenue."
      },
      {
        heading: "Price vs Privacy Scatter — What It Tells You",
        content: "Remember the scatter plot? The key insight is:\n\nTresorit = 98/100 privacy, $14/mo → Very few people pay this\nGoogle Drive = 20/100 privacy, $1.99/mo → Billions use this\n\nIf you offer 98/100 privacy at $1.8/mo — you combine the best of both. Users who hate Google's privacy but can't afford Tresorit now have YOU as an option.\n\nThat's a $22B segment currently underserved."
      }
    ]
  },
  {
    id: "roadmap",
    emoji: "🚀",
    title: "Growth Roadmap",
    color: TEAL,
    sections: [
      {
        heading: "What is a Roadmap?",
        content: "A roadmap is a timeline showing: what you build → when → what result you expect.\n\nIt answers the question: 'You have a big goal (150K users). How do you get there step by step?'"
      },
      {
        heading: "The Line Chart (User Growth)",
        content: "The growth chart shows users on Y-axis, time on X-axis.\n\nWhy does it curve upward steeply at the end?\nThat's called exponential growth — when users tell other users, growth compounds.\n\nWeek 1–6: 0 → 200 users (you + friends + beta)\nMonth 3: 1,000 users (Play Store launch)\nMonth 12: 20,000 users (word of mouth)\nMonth 24: 150,000 users (viral + paid tiers)\n\nNote: These are targets, not guarantees. But having a plan makes it more likely."
      },
      {
        heading: "The 4 Phases — Why This Structure?",
        content: "Phase 1 — SHIP (Weeks 1–6)\nGoal: Get something real out. Don't aim for perfect.\n'A shipped product beats a perfect idea every time.'\n\nPhase 2 — GROW (Month 2–6)\nGoal: Find your first real users who aren't your friends.\nReddit privacy communities, Product Hunt, tech Twitter.\n\nPhase 3 — MONETIZE (Month 6–18)\nGoal: Make money. Only after you have loyal users.\nNever charge too early — you'll lose them.\n\nPhase 4 — SCALE (Month 18–24)\nGoal: Grow big enough that someone big (Google, Box, Salesforce) considers buying you. That's called an acquisition exit."
      }
    ]
  },
  {
    id: "icp",
    emoji: "👤",
    title: "ICP — Ideal Customer Profile",
    color: BLUE,
    sections: [
      {
        heading: "What is ICP?",
        content: "ICP = Ideal Customer Profile. It's a description of the EXACT person most likely to use and pay for your product.\n\nWhy it matters: You can't market to everyone. If you try, you reach nobody. If you focus on 1 type of person, you build exactly what they need and they tell their similar friends."
      },
      {
        heading: "CloudVault's ICP",
        content: "Primary ICP (95% fit):\n🎓 Student, 18–24 years old\n📍 India (Android-first country)\n😤 Frustrated that Google reads their files\n💸 Can't afford $14/mo Tresorit\n📱 Uses Android, not iPhone\n🧠 Tech-aware enough to care about privacy\n\nSecondary ICP (85% fit):\n🧑‍💻 Developer or CS student\n🔓 Wants open-source or auditable tools\n😒 Hates vendor lock-in\n\nWhen you build a feature, ask: 'Would my ICP care about this?' If not — skip it for now."
      },
      {
        heading: "How ICP Affects Everything",
        content: "Once you know your ICP:\n\n→ Marketing: Post in r/privacy, r/degoogle, Indian tech Twitter\n→ Pricing: ₹149 (₹ not $ — India-first)\n→ Features: Android-first, Hindi language option later\n→ Messaging: 'Your files, your eyes only' (not 'enterprise-grade storage')\n→ Onboarding: Simple, fast, no jargon"
      }
    ]
  }
];

const VisualRadar = () => (
  <div style={{ display: "flex", justifyContent: "center", margin: "14px 0" }}>
    <div style={{ position: "relative", width: 160, height: 160 }}>
      {["Privacy", "Price", "UX", "Mobile", "Open"].map((label, i) => {
        const angle = (i * 72 - 90) * Math.PI / 180;
        const r = 65;
        return (
          <div key={i} style={{ position: "absolute", left: 80 + r * Math.cos(angle) - 20, top: 80 + r * Math.sin(angle) - 8, color: DIM, fontSize: 9, textAlign: "center", width: 40 }}>{label}</div>
        );
      })}
      <svg width="160" height="160" style={{ position: "absolute", top: 0, left: 0 }}>
        {[0.2,0.4,0.6,0.8,1].map(scale => (
          <polygon key={scale} points={[0,1,2,3,4].map(i => {
            const a = (i * 72 - 90) * Math.PI / 180;
            return `${80 + 55*scale*Math.cos(a)},${80 + 55*scale*Math.sin(a)}`;
          }).join(" ")} fill="none" stroke="#1e293b" strokeWidth="1" />
        ))}
        <polygon points={[0.98,0.90,0.82,0.88,0.80].map((v,i) => {
          const a = (i * 72 - 90) * Math.PI / 180;
          return `${80 + 55*v*Math.cos(a)},${80 + 55*v*Math.sin(a)}`;
        }).join(" ")} fill={TEAL} fillOpacity="0.3" stroke={TEAL} strokeWidth="2" />
        <polygon points={[0.20,0.70,0.88,0.92,0.10].map((v,i) => {
          const a = (i * 72 - 90) * Math.PI / 180;
          return `${80 + 55*v*Math.cos(a)},${80 + 55*v*Math.sin(a)}`;
        }).join(" ")} fill={RED} fillOpacity="0.1" stroke={RED} strokeWidth="1.5" />
      </svg>
      <div style={{ position: "absolute", bottom: -18, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 12 }}>
        <span style={{ fontSize: 9, color: TEAL }}>● CloudVault</span>
        <span style={{ fontSize: 9, color: RED }}>● Google</span>
      </div>
    </div>
  </div>
);

const VisualCircles = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 0, margin: "14px 0", position: "relative", height: 120 }}>
    {[
      { label: "TAM", sub: "$179B", size: 110, color: "#1e3a5f" },
      { label: "SAM", sub: "$22B", size: 80, color: "#0c2a3a" },
      { label: "SOM", sub: "$2.2B", size: 50, color: TEAL },
    ].map((c, i) => (
      <div key={i} style={{ position: "absolute", width: c.size, height: c.size, borderRadius: "50%", background: c.color, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", border: `2px solid ${c.color === TEAL ? TEAL : "#334155"}` }}>
        <span style={{ color: "#f1f5f9", fontSize: 10, fontWeight: 700 }}>{c.label}</span>
        <span style={{ color: DIM, fontSize: 9 }}>{c.sub}</span>
      </div>
    ))}
  </div>
);

const VisualScatter = () => {
  const dots = [
    { name: "Google", x: 30, y: 25, color: RED },
    { name: "OneDrive", x: 55, y: 30, color: "#64748b" },
    { name: "Dropbox", x: 75, y: 45, color: "#64748b" },
    { name: "ProtonDrive", x: 50, y: 88, color: "#7c3aed" },
    { name: "Tresorit", x: 90, y: 95, color: "#64748b" },
    { name: "CloudVault ✦", x: 22, y: 95, color: TEAL },
  ];
  return (
    <div style={{ margin: "14px 0", background: "#0f172a", borderRadius: 10, padding: 12, position: "relative", height: 160 }}>
      <div style={{ position: "absolute", left: 8, top: 8, color: DIM, fontSize: 9 }}>↑ Privacy</div>
      <div style={{ position: "absolute", right: 8, bottom: 8, color: DIM, fontSize: 9 }}>Price →</div>
      <div style={{ position: "absolute", left: "50%", top: 8, bottom: 8, borderLeft: "1px dashed #1e293b" }} />
      <div style={{ position: "absolute", top: "50%", left: 8, right: 8, borderTop: "1px dashed #1e293b" }} />
      <div style={{ position: "absolute", top: 8, left: 14, color: "#334155", fontSize: 9 }}>High privacy, Low price<br/><span style={{ color: TEAL }}>← YOUR ZONE ✦</span></div>
      {dots.map((d, i) => (
        <div key={i} style={{ position: "absolute", left: `${d.x}%`, top: `${100 - d.y}%`, transform: "translate(-50%,-50%)" }}>
          <div style={{ width: d.name.includes("CloudVault") ? 12 : 8, height: d.name.includes("CloudVault") ? 12 : 8, borderRadius: "50%", background: d.color }} />
          <div style={{ color: d.color, fontSize: 8, whiteSpace: "nowrap", marginTop: 2 }}>{d.name}</div>
        </div>
      ))}
    </div>
  );
};

const VisualBars = () => {
  const data = [
    { label: "No Data Harvesting", cv: 95, avg: 18 },
    { label: "E2E Encryption", cv: 98, avg: 25 },
    { label: "Open Architecture", cv: 80, avg: 22 },
    { label: "Student Targeting", cv: 85, avg: 30 },
  ];
  return (
    <div style={{ margin: "14px 0" }}>
      {data.map((d, i) => (
        <div key={i} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ color: DIM, fontSize: 10 }}>{d.label}</span>
            <span style={{ color: TEAL, fontSize: 10, fontWeight: 700 }}>+{d.cv - d.avg} gap</span>
          </div>
          <div style={{ position: "relative", height: 18, background: "#0f172a", borderRadius: 4 }}>
            <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${d.avg}%`, background: "#475569", borderRadius: 4 }} />
            <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${d.cv}%`, background: TEAL, opacity: 0.5, borderRadius: 4 }} />
            <span style={{ position: "absolute", right: 4, top: 2, color: "#94a3b8", fontSize: 9 }}>CV: {d.cv} | Avg: {d.avg}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

const VisualLine = () => {
  const pts = [0,50,200,1000,5000,20000,60000,150000];
  const max = 150000;
  const w = 260, h = 100;
  const points = pts.map((v,i) => `${(i/(pts.length-1))*w},${h - (v/max)*h}`).join(" ");
  return (
    <div style={{ margin: "14px 0", background: "#0f172a", borderRadius: 10, padding: 10 }}>
      <svg width="100%" viewBox={`0 0 ${w} ${h+20}`}>
        <polyline points={points} fill="none" stroke={TEAL} strokeWidth="2.5" strokeLinejoin="round" />
        {pts.map((v,i) => (
          <circle key={i} cx={(i/(pts.length-1))*w} cy={h-(v/max)*h} r="4" fill={TEAL} />
        ))}
        <text x="0" y={h+16} fontSize="8" fill={DIM}>Launch</text>
        <text x={w-28} y={h+16} fontSize="8" fill={DIM}>Month 24</text>
        <text x="2" y="10" fontSize="8" fill={DIM}>150K users</text>
      </svg>
    </div>
  );
};

export default function App() {
  const [active, setActive] = useState("market");
  const lesson = lessons.find(l => l.id === active);

  return (
    <div style={{ background: "#0f172a", minHeight: "100vh", fontFamily: "'Inter',sans-serif", color: "#e2e8f0", padding: "20px 16px" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ display: "inline-block", background: "#1e293b", borderRadius: 14, padding: "10px 20px" }}>
          <p style={{ color: TEAL, fontWeight: 800, fontSize: 16, margin: 0 }}>☁️ CloudVault — Market Concepts Explained</p>
          <p style={{ color: DIM, fontSize: 11, margin: "4px 0 0" }}>Tap any topic to learn what it means & how it applies to your product</p>
        </div>
      </div>

      {/* Topic Pills */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 24 }}>
        {lessons.map(l => (
          <button key={l.id} onClick={() => setActive(l.id)}
            style={{ padding: "7px 13px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600,
              background: active === l.id ? l.color : "#1e293b",
              color: active === l.id ? "#fff" : DIM, transition: "all 0.2s" }}>
            {l.emoji} {l.title.split("—")[0].trim()}
          </button>
        ))}
      </div>

      {/* Lesson Content */}
      {lesson && (
        <div>
          <div style={{ background: "#1e293b", borderRadius: 14, padding: "16px", marginBottom: 16, borderTop: `3px solid ${lesson.color}` }}>
            <h2 style={{ color: lesson.color, fontSize: 16, fontWeight: 800, margin: "0 0 4px" }}>{lesson.emoji} {lesson.title}</h2>
          </div>

          {lesson.sections.map((sec, i) => (
            <div key={i} style={{ background: "#1e293b", borderRadius: 14, padding: 16, marginBottom: 12 }}>
              <h3 style={{ color: "#f1f5f9", fontSize: 13, fontWeight: 700, margin: "0 0 10px", borderBottom: "1px solid #334155", paddingBottom: 8 }}>
                {i + 1}. {sec.heading}
              </h3>
              {sec.visual === "radar" && <VisualRadar />}
              {sec.visual === "scatter" && <VisualScatter />}
              {sec.visual === "circles" && <VisualCircles />}
              {sec.visual === "bars" && <VisualBars />}
              {sec.visual === "line" && <VisualLine />}
              <div>
                {sec.content.split("\n").map((line, j) => (
                  line.trim() === "" ? <div key={j} style={{ height: 8 }} /> :
                  <p key={j} style={{
                    color: line.startsWith("✅") || line.startsWith("🏆") || line.startsWith("💡") ? TEAL :
                           line.startsWith("⚠️") || line.startsWith("❌") ? "#d97706" :
                           line.startsWith("→") || line.startsWith("🔐") || line.startsWith("💸") || line.startsWith("📱") ? "#cbd5e1" : DIM,
                    fontSize: 12, margin: "4px 0", lineHeight: 1.7,
                    fontWeight: line.startsWith("✅") || line.startsWith("🏆") || line.includes("TAM") || line.includes("SAM") || line.includes("SOM") ? 600 : 400
                  }}>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ))}

          {/* Key Takeaway */}
          <div style={{ background: "#0a2520", border: `1px solid ${lesson.color}`, borderRadius: 12, padding: "12px 16px" }}>
            <p style={{ color: lesson.color, fontWeight: 700, fontSize: 12, margin: "0 0 4px" }}>💡 Key Takeaway for CloudVault</p>
            <p style={{ color: DIM, fontSize: 12, margin: 0 }}>
              {lesson.id === "market" && "You're entering a $179B market growing at 23%/year. Even capturing 0.001% = $1.79M revenue. Timing is perfect."}
              {lesson.id === "position" && "Nobody else occupies your position: high privacy + low price. You're not competing — you're creating a new category."}
              {lesson.id === "tam" && "Your realistic 3-year target is $2.2B (SOM). Even 0.1% of that = $2.2M. That's a viable business from a student project."}
              {lesson.id === "radar" && "Win on privacy + price first. Don't waste 6 weeks trying to build Google Docs. Add collaboration in v3, not v1."}
              {lesson.id === "edges" && "Your #1 moat: Google structurally CAN'T offer E2E encryption without killing their ad revenue. That's your permanent advantage."}
              {lesson.id === "pricing" && "₹149/mo = less than a Swiggy order. For people who care about privacy, that's a no-brainer. Start free, convert slowly."}
              {lesson.id === "roadmap" && "6 weeks to launch. Don't wait for perfection. Ship, get feedback, improve. The roadmap gives you a plan so you don't get lost."}
              {lesson.id === "icp" && "Build for 1 person first: a privacy-aware Indian CS student on Android. Once they love it, they'll tell 10 friends just like them."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
