import { getFeaturedProducts } from "@/lib/products"
import ProductCard from "./ProductCard"

export default async function FeaturedProducts() {
  const featuredProducts = await getFeaturedProducts()

  return (
    <section className="bg-[#FAFAF9] px-6 py-16 md:py-24">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-10">
          <h2
            className="text-3xl md:text-4xl font-bold text-[#1C1917] tracking-tight"
            style={{ fontFamily: "var(--font-playfair, serif)", letterSpacing: "-0.02em" }}
          >
            Featured Products
          </h2>
          <p className="mt-2 text-[#57534E]">Hand-picked for quality and value.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
