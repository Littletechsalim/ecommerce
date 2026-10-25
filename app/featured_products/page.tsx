import { Suspense } from "react"
import ProductFilter from "@/app/components/ProductFilter"
import { ProductGridSkeleton } from "@/app/components/Skeletons"
import { getProducts } from "@/lib/products"

// The client filter reads ?category=&q=&sort=, so validation needs a sample of
// what those look like (all absent = the plain /featured_products URL).
export const unstable_instant = {
  prefetch: "runtime",
  samples: [{ searchParams: { category: null, q: null, sort: null } }],
}

// Product data is cached, so it lands in the static shell. The filter reads
// the query string on the client (useSearchParams), which is why it needs its
// own <Suspense> — the page itself touches no runtime data.
async function Catalog() {
  const items = await getProducts()

  if (items.length === 0) {
    return <p className="text-[#78716C]">No products yet — check back soon.</p>
  }

  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <ProductFilter products={items} />
    </Suspense>
  )
}

export default function AllProductsPage() {
  return (
    <main className="min-h-screen bg-[#FAFAF9] px-6 py-12 md:py-16">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-10">
          <h1
            className="text-3xl md:text-4xl font-bold text-[#1C1917] tracking-tight"
            style={{ fontFamily: "var(--font-playfair, serif)", letterSpacing: "-0.02em" }}
          >
            All Products
          </h1>
          <p className="mt-2 text-[#57534E]">Browse the full catalog.</p>
        </div>

        <Catalog />
      </div>
    </main>
  )
}
