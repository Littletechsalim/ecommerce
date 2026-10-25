# Front-End Architecture & Server-First Engineering Guidelines
### E-Commerce Platform Core Standards

---

## 1. Design System & UI Enhancement Principles
Every visual refinement must balance aesthetic precision with Conversion Rate Optimization (ROI). Leverage **Tailwind CSS** to create a premium, fluid, and responsive e-commerce interface.

### A. Advanced Typography & Visual Hierarchy
* **Scale & Contrast:** Implement clean semantic text sizing (`text-sm` for secondary metadata, `text-base` for standard descriptions, and `text-2xl` to `text-4xl` for tracking product titles). 
* **Font Weights:** Use strict weight pairing (`font-bold` or `font-semibold` for headers; `font-normal` or `font-light` for body copy).
* **Spacing Rules:** Maintain spatial breathing room using explicit, consistent layout scales (`space-y-*`, `gap-*`, and generous container padding `px-6 py-8`).

### B. Micro-Interactions & State Design
* **Interactive Elements:** All clickable components (Add to Cart buttons, navigation tabs, product cards) must feature smooth transitions (`transition-all duration-300 ease-in-out`).
* **State Styling:** Explicitly design for `:hover`, `:focus-visible`, and `:disabled` states. Use subtle scales (`hover:scale-[1.02]`), opacity shifts, or overlay transitions.
* **Interactive Dropdowns & Modals:** Leverage clean absolute positioning and desaturated border accents (`border-neutral-200/60`) for clean overlays.

### C. Component Presentation (The Premium E-Commerce Look)
* **Product Cards:** Use explicit `aspect-square` or custom ratios for images to avoid layout shifts. Apply a subtle outer border or a soft desaturated shadow (`shadow-sm hover:shadow-md`) rather than heavy color fills.
* **Color Palette:** Stick to a cohesive, high-end desaturated theme. Utilize deep slates or charcoal neutrals (`text-neutral-900`, `bg-neutral-50`) paired with a single, clear accent color (e.g., deep emerald, rich indigo) to draw the eye directly to Primary Call-to-Actions (CTAs).

---

## 2. Server-First Architecture (Zero Client-Side Rendering)
To maximize Core Web Vitals (LCP, INP, CLS) and optimize SEO indexing, the platform operates on a **100% Server-First Architecture** utilizing Next.js 16 (App Router) and Supabase.

### A. Core Architectural Framework
* **Server Components by Default:** Every file within the App Router (`app/`) must run entirely on the server. Do not inject `'use client'` into layout or page components.
* **Zero-Hydration Client Footprint:** Build UI blocks directly using native HTML elements, semantic structures, and static CSS layouts.
* **Dynamic Server Rendering:** Fetch live pricing, warehouse inventory tracking, and specialized product options seamlessly during server compilation using dynamic processing.

### B. Data Fetching & Direct Supabase Operations
* **Secure Server-Side Fetching:** Execute all database queries directly inside Next.js Server Components. Avoid using browser-facing API fetches for core rendering.
* **Supabase Server Client:** Initialize the Supabase client using the dedicated Server Context pattern to pull real-time catalogs, product tables, and user metadata safely behind the firewall.
* **Zero Client Leakage:** Keep sensitive API keys, pricing structures, and inventory logic restricted entirely to the server-side environment.

### C. Processing Actions & Safe Mutations
* **Next.js Server Actions:** Handle all interactive operations (e.g., updating a shopping cart, modifying line items, submitting user reviews) inside `'use server'` files.
* **Instant Page Revalidation:** Utilize Next.js `revalidatePath` or `revalidateTag` directly inside your Server Actions. This instantly forces the server to re-compile changed layout blocks and serve fresh HTML without relying on client-side state managers or local tracking hooks.

---

## 3. Code Generation & Component Architecture
To maintain a clean, maintainable, and highly optimized codebase, all generated code must strictly adhere to modular separation principles rather than stacking logic into a single file.

### A. Modular Separation Rules
* **Single-Responsibility Principle:** Break down complex pages (e.g., product details, checkout, cart) into specialized, isolated components. No single page file should contain massive walls of dense UI markup.
* **Component Directory Isolation:** Extract distinct visual blocks into a dedicated `components/` structure (e.g., `components/product/product-gallery.tsx`, `components/product/product-info.tsx`) instead of nesting structural sub-components inside a root page file.
* **Clean Code Standards:** Avoid deeply nested layout structures within a single block. Abstract repetitive styling patterns or complex UI logic into readable, self-contained server sub-components.

### B. Directory Organization Blueprint
When generating structural code layouts, maintain a strict modular file hierarchy:
```
app/
└── product/
    └── [id]/
        ├── page.tsx                 # Lean entry point orchestrating data fetch
        └── components/              # Isolated UI blocks specific to this route
            ├── product-gallery.tsx  # Server-side media presentation
            ├── product-details.tsx  # Product specs and text layout
            └── product-actions.tsx  # Server Action interaction elements
```

---

## 4. Technology Stack Breakdown & Engineering Skills
To deliver a secure, production-grade architecture, ensure these specialized developer workflows are tightly implemented:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS 16 SERVER ENVIRONMENT                   │
│                                                                        │
│   ┌─────────────────────┐    ┌───────────────────┐    ┌────────────┐   │
│   │ Server Component    │───>│ Next.js Server    │───>│ Supabase   │   │
│   │ (HTML Generation)   │    │ Action ('use server')  │ Server Client│ │
│   └─────────────────────┘    └───────────────────┘    └────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

* **Next.js 16 (App Router):** Advanced handling of Server Components, Route Handlers, deep nested layouts, and structural optimization for instantaneous page loads.
* **Tailwind CSS:** Expert execution of utility classes, responsive grid architectures (`grid-cols-1 md:grid-cols-3`), arbitrary values for precise sizing tweaks, and clean, cohesive design tokens.
* **Supabase (PostgreSQL):** Fluent relational data mapping, secure Server Client configurations, optimized indexing for rapid product queries, and robust Row Level Security (RLS) protections.
