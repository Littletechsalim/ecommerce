import { Suspense } from "react"
import Link from "next/link"
import { createServiceClient } from "@/lib/supabase/service"
import { Product } from "@/types/database"
import { requireAdmin } from "@/lib/dal"
import AdminMetrics from "./components/AdminMetrics"
import ProductAdminTable from "./components/ProductAdminTable"

interface AdminProductsPageProps {
  searchParams: Promise<{ created?: string; updated?: string }>
}

async function getAdminProducts(): Promise<Product[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })
    .overrideTypes<Product[], { merge: false }>()

  if (error) {
    throw new Error(`Failed to fetch catalog: ${error.message}`)
  }

  return data ?? []
}

function AdminDashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="h-10 w-64 bg-[#E7E5E4] rounded-lg animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-24 bg-[#E7E5E4] rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="h-64 bg-[#E7E5E4] rounded-2xl animate-pulse" />
    </div>
  )
}

async function AdminProductsContent({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; updated?: string }>
}) {
  await requireAdmin("/admin/products")
  const params = await searchParams
  const products = await getAdminProducts()

  return (
    <>
      {/* Toast / Notification Banners */}
      {params.created && (
        <div className="p-4 bg-[#16A34A]/10 border border-[#16A34A]/30 rounded-xl text-sm text-[#16A34A] flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-semibold">Product successfully added to the catalog!</span>
          </div>
          <Link href="/admin/products" className="text-xs underline hover:opacity-80">
            Dismiss
          </Link>
        </div>
      )}

      {params.updated && (
        <div className="p-4 bg-[#C2410C]/10 border border-[#C2410C]/30 rounded-xl text-sm text-[#C2410C] flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-semibold">Product updated successfully!</span>
          </div>
          <Link href="/admin/products" className="text-xs underline hover:opacity-80">
            Dismiss
          </Link>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-2 border-b border-[#D6D3D1]">
        <div>
          <h1
            className="text-3xl md:text-4xl font-bold text-[#1C1917] tracking-tight"
            style={{ fontFamily: "var(--font-playfair, serif)", letterSpacing: "-0.02em" }}
          >
            Product Catalog
          </h1>
          <p className="mt-1.5 text-sm text-[#57534E]">
            Monitor inventory, adjust unit counts, and manage catalog items.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C2410C] hover:bg-[#9A3412] text-white text-sm font-semibold rounded-lg transition-all duration-150 hover:shadow-[0_4px_12px_rgba(194,65,12,0.25)] cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <AdminMetrics products={products} />

      {/* Products Table with search, filters & inline adjustments */}
      <ProductAdminTable initialProducts={products} />
    </>
  )
}

export default function AdminProductsPage(props: AdminProductsPageProps) {
  return (
    <main className="max-w-[1200px] mx-auto px-6 py-8 md:py-12 space-y-8">
      <Suspense fallback={<AdminDashboardSkeleton />}>
        <AdminProductsContent searchParams={props.searchParams} />
      </Suspense>
    </main>
  )
}
