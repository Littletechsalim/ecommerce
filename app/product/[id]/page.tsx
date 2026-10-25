import { Suspense } from "react"
import Link from "next/link"
import { getProduct, getRelatedProducts } from "@/lib/products"
import { addToCart } from "@/app/actions/cart"
import { StarRating } from "@/app/components/ProductCard"
import ProductImage from "@/app/components/ProductImage"
import { ProductDetailSkeleton } from "@/app/components/Skeletons"

// No generateStaticParams, so validation needs a sample id to render with.
export const unstable_instant = {
  prefetch: "runtime",
  samples: [{ params: { id: "00000000-0000-0000-0000-000000000000" } }],
}

function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-[#F5F5F4] border border-[#D6D3D1] flex items-center justify-center mx-auto mb-6">
          <svg className="w-7 h-7 text-[#78716C]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1
          className="text-3xl font-bold text-[#1C1917] mb-3"
          style={{ fontFamily: "var(--font-playfair, serif)", letterSpacing: "-0.02em" }}
        >
          Product not found
        </h1>
        <p className="text-[#57534E] mb-8 leading-relaxed">
          This product doesn&apos;t exist or has been removed from our catalog.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#C2410C] hover:bg-[#9A3412] text-white font-semibold rounded-lg transition-all duration-150 hover:shadow-[0_4px_12px_rgba(194,65,12,0.25)] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C2410C] focus:ring-offset-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to home
        </Link>
      </div>
    </div>
  )
}

// `params` is runtime data (no generateStaticParams), so it's read behind
// <Suspense>; the product data itself comes from cached functions.
export default function ProductPage(props: PageProps<"/product/[id]">) {
  return (
    <main className="min-h-screen bg-[#FAFAF9]">
      <Suspense fallback={<ProductDetailSkeleton />}>
        {props.params.then(({ id }) => (
          <ProductDetail id={id} />
        ))}
      </Suspense>
    </main>
  )
}

async function ProductDetail({ id }: { id: string }) {
  const [product, related] = await Promise.all([getProduct(id), getRelatedProducts(id)])

  if (!product) return <NotFound />

  return (
    <>
      {/* Breadcrumb */}
      <div className="border-b border-[#D6D3D1] bg-[#FAFAF9]">
        <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center gap-2 text-sm text-[#78716C]">
          <Link href="/" className="hover:text-[#C2410C] transition-colors duration-150 cursor-pointer">Home</Link>
          <svg className="w-3.5 h-3.5 text-[#D6D3D1]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link href="/featured_products" className="hover:text-[#C2410C] transition-colors duration-150 cursor-pointer">
            {product.category ?? "Products"}
          </Link>
          <svg className="w-3.5 h-3.5 text-[#D6D3D1]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-[#1C1917] font-semibold truncate max-w-[200px]">{product.name}</span>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">

          {/* LEFT — Product Visual */}
          <div className="relative">
            <div className="absolute -left-3 top-8 bottom-8 w-0.5 bg-[#C2410C] opacity-60 hidden lg:block" aria-hidden="true" />

            <ProductImage
              name={product.name}
              imageUrl={product.image_url}
              sizes="(max-width: 1024px) 100vw, 600px"
              priority
              className="aspect-square rounded-2xl border border-[#D6D3D1]"
            />
          </div>

          {/* RIGHT — Product Info */}
          <div className="flex flex-col gap-6 lg:pt-2">
            <div className="flex items-center justify-between">
              {product.category && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#E7E5E4] text-[#78716C] text-xs font-semibold uppercase tracking-wide">
                  {product.category}
                </span>
              )}
              {product.stock > 0 ? (
                <div className="flex items-center gap-1.5 text-sm text-[#16A34A] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#16A34A] inline-block" aria-hidden="true" />
                  {product.stock} in stock
                </div>
              ) : (
                <span className="text-sm text-[#DC2626] font-semibold">Out of stock</span>
              )}
            </div>

            <h1
              className="text-4xl md:text-5xl font-bold text-[#1C1917] leading-[1.1]"
              style={{ fontFamily: "var(--font-playfair, serif)", letterSpacing: "-0.02em" }}
            >
              {product.name}
            </h1>

            <StarRating rating={product.rating ?? 0} />

            <div className="h-px bg-[#D6D3D1]" aria-hidden="true" />

            <span className="text-4xl font-bold text-[#C2410C]" style={{ fontFamily: "var(--font-playfair, serif)" }}>
              ${product.price.toFixed(2)}
            </span>

            {product.description && (
              <p className="text-[#57534E] leading-relaxed text-[15px]">{product.description}</p>
            )}

            <div className="h-px bg-[#D6D3D1]" aria-hidden="true" />

            <div className="flex flex-col gap-3">
              <form action={addToCart.bind(null, product.id)}>
                <button
                  type="submit"
                  disabled={product.stock <= 0}
                  className="w-full py-4 bg-[#C2410C] hover:bg-[#9A3412] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-150 hover:shadow-[0_6px_20px_rgba(194,65,12,0.3)] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C2410C] focus:ring-offset-2 text-base"
                  aria-label={`Add ${product.name} to cart`}
                >
                  Add to Cart — ${product.price.toFixed(2)}
                </button>
              </form>
            </div>

            <div className="flex items-center gap-6 text-xs text-[#78716C]">
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-[#16A34A]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Free shipping over $50
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-[#16A34A]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                30-day returns
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-[#16A34A]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Secure checkout
              </div>
            </div>
          </div>
        </div>

        {/* Bottom — also in this category */}
        {related.length > 0 && (
          <div className="mt-20 pt-12 border-t border-[#D6D3D1]">
            <h2
              className="text-2xl font-bold text-[#1C1917] mb-8"
              style={{ fontFamily: "var(--font-playfair, serif)", letterSpacing: "-0.02em" }}
            >
              More products
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map((p) => (
                <Link
                  key={p.id}
                  href={`/product/${p.id}`}
                  className="group block bg-[#F5F5F4] border border-[#D6D3D1] rounded-xl p-4 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(28,25,23,0.06)] transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C2410C] focus:ring-offset-2"
                >
                  <div className="aspect-square bg-[#E7E5E4] rounded-lg mb-3 flex items-center justify-center">
                    <span className="text-2xl font-bold text-[#D6D3D1]"
                      style={{ fontFamily: "var(--font-playfair, serif)" }}>
                      {p.name[0]}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#57534E] truncate mb-1 group-hover:text-[#C2410C] transition-colors duration-150">
                    {p.name}
                  </p>
                  <p className="text-sm font-bold text-[#C2410C]">${p.price.toFixed(2)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
