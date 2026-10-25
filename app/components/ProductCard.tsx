import Link from "next/link"
import ProductImage from "@/app/components/ProductImage"
import type { Product } from "@/types/database"

export function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= Math.round(rating) ? "text-[#F59E0B]" : "text-[#D6D3D1]"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-sm text-[#78716C] ml-1">{rating}</span>
    </div>
  )
}

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/product/${product.id}`}
      className="group relative flex flex-col bg-[#F5F5F4] border border-[#D6D3D1] rounded-xl p-5 pl-6 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(28,25,23,0.06)] focus:outline-none focus:ring-2 focus:ring-[#C2410C] focus:ring-offset-2 cursor-pointer"
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-[#C2410C]" />

      <ProductImage
        name={product.name}
        imageUrl={product.image_url}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="mb-4 h-40 rounded-lg"
      />

      {product.category && (
        <span className="self-start px-2.5 py-0.5 rounded-full bg-[#E7E5E4] text-[#78716C] text-xs font-semibold mb-3">
          {product.category}
        </span>
      )}

      <h3 className="font-semibold text-[#1C1917] text-base leading-snug mb-2 group-hover:text-[#C2410C] transition-colors duration-150">
        {product.name}
      </h3>

      <StarRating rating={product.rating ?? 0} />

      <div className="mt-auto pt-4 flex items-center justify-between">
        <span className="text-lg font-semibold text-[#C2410C]">${product.price.toFixed(2)}</span>
        <span className="text-sm text-[#78716C] group-hover:text-[#C2410C] transition-colors duration-150">
          View →
        </span>
      </div>
    </Link>
  )
}
