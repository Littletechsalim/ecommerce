import { Suspense } from "react"
import Link from "next/link"
import { requireAdmin } from "@/lib/dal"

// The whole banner sits behind requireAdmin(), not just the email badge.
// Anything rendered outside this boundary ends up in the build-time static
// shell for /admin/*, which is prerendered with no request and no session —
// so a cached copy of that shell would paint the admin chrome for anyone
// before the redirect lands.
async function AdminBanner() {
  const admin = await requireAdmin()

  return (
    <div className="bg-[#F5F5F4] border-b border-[#D6D3D1] px-6 py-2.5">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#C2410C]/10 text-[#C2410C] font-semibold uppercase tracking-wider text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C2410C]" />
            Admin Portal
          </span>
          <span className="text-[#78716C] hidden sm:inline">Product &amp; Catalog Management</span>
        </div>

        <div className="flex items-center gap-4 text-[#57534E]">
          {admin.email && (
            <span className="text-xs text-[#78716C] hidden md:inline">
              Signed in as <strong className="text-[#1C1917] font-semibold">{admin.email}</strong>
            </span>
          )}

          <Link
            href="/"
            className="inline-flex items-center gap-1 hover:text-[#C2410C] transition-colors duration-150 font-medium"
          >
            <span>View Storefront</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}

function AdminBannerSkeleton() {
  return (
    <div className="bg-[#F5F5F4] border-b border-[#D6D3D1] px-6 py-2.5">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between">
        <div className="h-4 w-40 rounded-full bg-[#E7E5E4] animate-pulse" />
        <div className="h-4 w-28 rounded-full bg-[#E7E5E4] animate-pulse" />
      </div>
    </div>
  )
}

// This layout is not the authorization gate: a layout does not control whether
// nested segments render, so every page under /admin calls requireAdmin() too.
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#1C1917] flex flex-col">
      <Suspense fallback={<AdminBannerSkeleton />}>
        <AdminBanner />
      </Suspense>

      {/* Admin Content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}
