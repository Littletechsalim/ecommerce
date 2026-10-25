import { Suspense } from "react"
import Link from "next/link"
import { requireAdmin } from "@/lib/dal"
import ProductForm from "../components/ProductForm"

async function NewProductContent() {
  await requireAdmin("/admin/products/new")

  return (
    <>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[#78716C]">
        <Link href="/admin/products" className="hover:text-[#C2410C] transition-colors">
          Products
        </Link>
        <span>/</span>
        <span className="text-[#1C1917] font-semibold">New Product</span>
      </nav>

      {/* Header */}
      <div className="border-b border-[#D6D3D1] pb-4">
        <h1
          className="text-3xl md:text-4xl font-bold text-[#1C1917] tracking-tight"
          style={{ fontFamily: "var(--font-playfair, serif)", letterSpacing: "-0.02em" }}
        >
          Add New Product
        </h1>
        <p className="mt-1.5 text-sm text-[#57534E]">
          Provide product details, pricing, and initial inventory units.
        </p>
      </div>

      {/* Form */}
      <ProductForm isEditing={false} />
    </>
  )
}

export default function NewProductPage() {
  return (
    <main className="max-w-[1200px] mx-auto px-6 py-8 md:py-12 space-y-8">
      <Suspense fallback={<div className="h-96 rounded-2xl bg-[#E7E5E4] animate-pulse" />}>
        <NewProductContent />
      </Suspense>
    </main>
  )
}
