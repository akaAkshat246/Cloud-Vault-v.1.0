# CloudVault Design, Privacy & Compliance Guidelines (Dos & Don'ts)

These mandatory guidelines govern all development across web, mobile, and backend for CloudVault.

---

## 1. Compliance, Legal & Privacy (DO)
1. **Policies & Legal Disclosures:**
   - Dedicated Terms of Service (TOS) page and route (`/terms`).
   - Dedicated Privacy Policy page and route (`/privacy`) detailing zero-knowledge data practices, encryption mechanisms, and third-party infrastructure (e.g., self-hosted MinIO, PostgreSQL).
   - Explicit Cookie and Storage consent banner with granular preferences.
   - Clear refund / cancellation terms where applicable.
2. **Data Practices & User Rights (GDPR / CCPA):**
   - Data minimization: Zero telemetry, zero analytics tracking of file contents or metadata.
   - User Data Deletion: Complete self-serve account deletion and cryptographic shredding (`POST /api/v1/auth/account/delete` with orphaned chunk purging).
   - Data export: Ability to export vault metadata and download all files.
3. **UX Ethics:**
   - Zero dark patterns.
   - Zero fake testimonials or unsupported marketing claims.
   - Transparent quota and billing information with zero hidden fees.
4. **Accessibility (WCAG 2.1 AA) & Navigation:**
   - Full keyboard navigation (focus rings, accessible ARIA attributes).
   - High contrast ratios (minimum 4.5:1 for normal text).
   - Explicit `alt` attributes on all images and graphical elements.
   - Visible business details and direct contact / support channels.
5. **Security & Production Hardening:**
   - Zero exposed secrets or API keys.
   - Strict HTTP security headers (Helmet, CSP, HSTS, Referrer-Policy).
   - Comprehensive rate limiting and input sanitization against XSS/SQLi.
   - Proper zero-knowledge key derivation (Argon2id + AES-256-GCM / XChaCha20-Poly1305 + bcrypt server auth key hashing).
   - Production debug flags turned off.

---

## 2. Visual & Content Constraints (DON'T)

| Category | Forbidden Element (STRICTLY PROHIBITED) | Compliant Replacement |
| :--- | :--- | :--- |
| **Icons** | ❌ `lucide-react` / Lucide icons | ✅ Custom semantic SVGs, Heroicons-style native accessible SVGs |
| **Color Scheme** | ❌ Purple and black (`#0D0B18`, `#8F6BFF`, purple glows) | ✅ Slate, Zinc, Deep Navy, Steel Blue, Obsidian / Carbon neutral dark (`#0B0F17`, `#111827`, `#1E293B`, `#3B82F6` or `#0284C7`) or clean off-white |
| **Gradients & Glows** | ❌ Harsh gradients, neon glows, radial orbs, liquid glass, drop shadows | ✅ Crisp flat borders (1px solid `#263238` / `#334155`), subtle surface elevation, clean solid backgrounds |
| **Backgrounds** | ❌ Pure white (`#ffffff`), dot grids | ✅ Balanced off-white (`#F8FAFC`) for light or deep carbon/slate (`#0F172A`) for dark |
| **Typography & Copy** | ❌ Inter / Geist / Space Grotesk fonts, em dashes (`—`), emojis (`👋`, `🔐`), "it's not x, it's y" | ✅ System font stack (`system-ui, -apple-system, sans-serif`), standard hyphens or colons, crisp factual copy |
| **Layout & Structure** | ❌ 3 feature cards in a row, bento grids, 3 pricing tiers, terminal mockups, colored left stripes | ✅ 2-column or 4-column structured layouts, linear security architecture diagrams, transparent single/clear pricing |
| **Components** | ❌ Checkmark bullet icons, sparkle / AI icons, animated arrows, hover bounce/float animations, soft pill radius | ✅ Structured list items, clean geometric indicators, crisp structured corners (`rounded-lg` / `rounded-md`), instant transitions |
| **Product Previews** | ❌ Missing real product demos | ✅ Real interactive application views, real file transfer telemetry, real cryptographic pipeline explorer |
| **Loading States** | ❌ Missing skeleton loaders | ✅ Complete accessible skeleton loading screens for all data states |

