import Link from "next/link"

const heroData = {
  headline: "Shop the Best Deals",
  subheadline: "Discover top-rated products at unbeatable prices, curated for quality and style.",
  cta: { label: "Shop Now", href: "/featured_products" },
  badge: "Free shipping on orders over $50",
  stats: [
    { value: "10k+", label: "Products" },
    { value: "4.8★", label: "Avg. Rating" },
    { value: "30-day", label: "Returns" },
  ],
}

export default function Hero() {
  return (
    <section className="relative bg-[#FAFAF9] overflow-hidden">
      {/* Asymmetric warm background accent */}
      <div
        className="absolute top-0 right-0 w-1/2 h-full opacity-[0.04] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 80% 30%, #C2410C 0%, transparent 70%)" }}
        aria-hidden="true"
      />
      {/* Terracotta vertical accent line — differentiation anchor */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C2410C]" aria-hidden="true" />

      <div className="max-w-[1200px] mx-auto px-8 py-20 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          {/* Left: main content — takes 7 cols */}
          <div className="md:col-span-7 flex flex-col gap-6">
            {/* Badge */}
            <span className="self-start inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FEF3C7] text-[#D97706] text-sm font-semibold">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
              {heroData.badge}
            </span>

            {/* Headline — large Playfair */}
            <h1
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-[#1C1917] leading-[1.05]"
              style={{ fontFamily: "var(--font-playfair, serif)", letterSpacing: "-0.02em" }}
            >
              {heroData.headline}
            </h1>

            <p className="text-lg text-[#57534E] leading-relaxed max-w-lg">
              {heroData.subheadline}
            </p>

            {/* CTA row */}
            <div className="flex items-center gap-4 mt-2">
              <Link
                href={heroData.cta.href}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#C2410C] hover:bg-[#9A3412] text-white font-semibold rounded-xl transition-all duration-150 hover:shadow-[0_6px_20px_rgba(194,65,12,0.3)] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C2410C] focus:ring-offset-2"
              >
                {heroData.cta.label}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <a
                href="#contact"
                className="text-sm font-semibold text-[#57534E] hover:text-[#C2410C] transition-colors duration-150 cursor-pointer"
              >
                Contact us →
              </a>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-8 pt-4 border-t border-[#D6D3D1] mt-2">
              {heroData.stats.map((stat) => (
                <div key={stat.label}>
                  <p
                    className="text-2xl font-bold text-[#1C1917]"
                    style={{ fontFamily: "var(--font-playfair, serif)" }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-xs text-[#78716C] font-semibold uppercase tracking-widest mt-0.5">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: decorative visual block — 5 cols, asymmetric */}
          <div className="hidden md:flex md:col-span-5 items-center justify-center">
            <div className="relative w-full max-w-sm">
              {/* Main card */}
              <div className="bg-[#F5F5F4] border border-[#D6D3D1] rounded-2xl p-8 shadow-[0_24px_48px_rgba(28,25,23,0.06)]">
                <div className="aspect-square bg-gradient-to-br from-[#E7E5E4] to-[#D6D3D1] rounded-xl mb-6 flex items-center justify-center">
                  <span
                    className="text-6xl font-bold text-[#C2410C]/20 select-none"
                    style={{ fontFamily: "var(--font-playfair, serif)" }}
                    aria-hidden="true"
                  >
                    S
                  </span>
                </div>
                <div className="h-3 bg-[#E7E5E4] rounded-full w-3/4 mb-2" aria-hidden="true" />
                <div className="h-2.5 bg-[#E7E5E4] rounded-full w-1/2 mb-6" aria-hidden="true" />
                <div className="flex items-center justify-between">
                  <div className="h-8 bg-[#C2410C] rounded-lg w-28" aria-hidden="true" />
                  <div className="h-8 bg-[#E7E5E4] rounded-lg w-16" aria-hidden="true" />
                </div>
              </div>
              {/* Floating badge */}
              <div
                className="absolute -top-4 -right-4 bg-[#C2410C] text-white text-xs font-bold px-3 py-2 rounded-xl shadow-[0_4px_12px_rgba(194,65,12,0.35)]"
                aria-hidden="true"
              >
                New Arrivals
              </div>
              {/* Floating rating pill */}
              <div
                className="absolute -bottom-4 -left-4 bg-[#FAFAF9] border border-[#D6D3D1] text-[#1C1917] text-xs font-semibold px-4 py-2.5 rounded-xl shadow-[0_4px_12px_rgba(28,25,23,0.08)] flex items-center gap-2"
                aria-hidden="true"
              >
                <span className="text-[#F59E0B]">★</span> 4.8 · 2,400+ reviews
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
