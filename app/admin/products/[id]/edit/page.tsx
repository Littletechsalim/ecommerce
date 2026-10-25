import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createServiceClient } from "@/lib/supabase/service"
import { Product } from "@/types/database"
import { requireAdmin } from "@/lib/dal"
import ProductForm from "../../components/ProductForm"

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

async function getProductForEdit(id: string): Promise<Product | null> {
  await requireAdmin(`/admin/products/${id}/edit`)
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle<Product>()

  if (error || !data) {
    return null
  }

  return data
}

async function EditProductContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProductForEdit(id)

  if (!product) {
    notFound()
  }

  return (
    <>
      {/* Breadcrumb */}
      <nav className="flex items-center justify-between text-xs text-[#78716C]">
        <div className="flex items-center gap-2">
          <Link href="/admin/products" className="hover:text-[#C2410C] transition-colors">
            Products
          </Link>
          <span>/</span>
          <span className="text-[#1C1917] font-semibold truncate max-w-xs">{product.name}</span>
          <span>/</span>
          <span className="text-[#78716C]">Edit</span>
        </div>

        <Link
          href={`/product/${product.id}`}
          target="_blank"
          className="inline-flex items-center gap-1 text-[#57534E] hover:text-[#C2410C] transition-colors font-medium"
        >
          <span>Preview on Store</span>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </Link>
      </nav>

      {/* Header */}
      <div className="border-b border-[#D6D3D1] pb-4">
        <h1
          className="text-3xl md:text-4xl font-bold text-[#1C1917] tracking-tight"
          style={{ fontFamily: "var(--font-playfair, serif)", letterSpacing: "-0.02em" }}
        >
          Edit Product
        </h1>
        <p className="mt-1.5 text-sm text-[#57534E]">
          Update catalog details, adjust inventory levels, or modify pricing.
        </p>
      </div>

      {/* Form */}
      <ProductForm initialData={product} isEditing={true} />
    </>
  )
}

export default function EditProductPage(props: EditProductPageProps) {
  return (
    <main className="max-w-[1200px] mx-auto px-6 py-8 md:py-12 space-y-8">
      <Suspense fallback={<div className="h-96 rounded-2xl bg-[#E7E5E4] animate-pulse" />}>
        <EditProductContent params={props.params} />
      </Suspense>
    </main>
  )
}
