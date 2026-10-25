"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Product } from "@/types/database"
import { createProduct, updateProduct, AdminProductFormState } from "@/app/actions/admin-products"

interface ProductFormProps {
  initialData?: Product
  isEditing?: boolean
}

const PRESET_CATEGORIES = ["Electronics", "Footwear", "Accessories", "Home", "Beauty"]

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="mt-1.5 text-xs font-semibold text-[#DC2626]" aria-live="polite">
      {message}
    </p>
  )
}

export default function ProductForm({ initialData, isEditing = false }: ProductFormProps) {
  const [imageUrl, setImageUrl] = useState<string>(initialData?.image_url ?? "")
  const [imageError, setImageError] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    if (!initialData?.category) return "Electronics"
    return PRESET_CATEGORIES.includes(initialData.category) ? initialData.category : "Custom"
  })
  const [customCategory, setCustomCategory] = useState<string>(() => {
    if (!initialData?.category) return ""
    return PRESET_CATEGORIES.includes(initialData.category) ? "" : initialData.category
  })

  // Pick the corresponding server action
  const actionToRun = isEditing && initialData?.id
    ? updateProduct.bind(null, initialData.id)
    : createProduct

  const [state, formAction, isPending] = useActionState<AdminProductFormState, FormData>(
    actionToRun,
    undefined
  )

  const fieldErrors = state?.fieldErrors

  const handleImageUrlChange = (url: string) => {
    setImageUrl(url)
    setImageError(false)
  }

  return (
    <form action={formAction} className="space-y-8">
      {/* Error Notice */}
      {state?.error && (
        <div className="p-4 bg-[#DC2626]/10 border border-[#DC2626]/30 rounded-xl text-sm text-[#DC2626] flex items-center gap-2">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-semibold">{state.error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Main details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#F5F5F4] border border-[#D6D3D1] rounded-2xl p-6 shadow-[0_2px_8px_rgba(28,25,23,0.03)] space-y-5">
            <h3
              className="text-lg font-bold text-[#1C1917] border-b border-[#D6D3D1] pb-3"
              style={{ fontFamily: "var(--font-playfair, serif)" }}
            >
              General Information
            </h3>

            {/* Product Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-[#57534E] mb-1.5">
                Product Title <span className="text-[#DC2626]">*</span>
              </label>
              <input
                id="name"
                aria-invalid={Boolean(fieldErrors?.name)}
                name="name"
                type="text"
                required
                defaultValue={state?.fields?.name ?? initialData?.name ?? ""}
                placeholder="e.g. Handcrafted Ceramic Teapot"
                className="w-full px-4 py-2.5 bg-[#FAFAF9] border border-[#D6D3D1] rounded-lg text-sm text-[#1C1917] placeholder-[#78716C] focus:outline-none focus:border-[#C2410C] focus:ring-2 focus:ring-[#C2410C]/20 transition-all duration-150"
              />
              <FieldError message={fieldErrors?.name} />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-xs font-semibold uppercase tracking-wider text-[#57534E] mb-1.5">
                Description
              </label>
              <textarea
                id="description"
                aria-invalid={Boolean(fieldErrors?.description)}
                name="description"
                rows={4}
                defaultValue={state?.fields?.description ?? initialData?.description ?? ""}
                placeholder="Detailed craft specifications, materials, and highlights..."
                className="w-full px-4 py-2.5 bg-[#FAFAF9] border border-[#D6D3D1] rounded-lg text-sm text-[#1C1917] placeholder-[#78716C] focus:outline-none focus:border-[#C2410C] focus:ring-2 focus:ring-[#C2410C]/20 transition-all duration-150 resize-y"
              />
              <FieldError message={fieldErrors?.description} />
            </div>

            {/* Category selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category_select" className="block text-xs font-semibold uppercase tracking-wider text-[#57534E] mb-1.5">
                  Category
                </label>
                <select
                  id="category_select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAFAF9] border border-[#D6D3D1] rounded-lg text-sm text-[#1C1917] focus:outline-none focus:border-[#C2410C] focus:ring-2 focus:ring-[#C2410C]/20 transition-all duration-150"
                >
                  {PRESET_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="Custom">Custom Category...</option>
                </select>
              </div>

              {selectedCategory === "Custom" ? (
                <div>
                  <label htmlFor="custom_category" className="block text-xs font-semibold uppercase tracking-wider text-[#57534E] mb-1.5">
                    Custom Name
                  </label>
                  <input
                    id="custom_category"
                aria-invalid={Boolean(fieldErrors?.category)}
                    name="category"
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="e.g. Stationery, Art"
                    className="w-full px-4 py-2.5 bg-[#FAFAF9] border border-[#D6D3D1] rounded-lg text-sm text-[#1C1917] placeholder-[#78716C] focus:outline-none focus:border-[#C2410C] focus:ring-2 focus:ring-[#C2410C]/20 transition-all duration-150"
                  />
                  <FieldError message={fieldErrors?.category} />
                </div>
              ) : (
                <input type="hidden" name="category" value={selectedCategory} />
              )}
            </div>
          </div>

          {/* Pricing & Stock Card */}
          <div className="bg-[#F5F5F4] border border-[#D6D3D1] rounded-2xl p-6 shadow-[0_2px_8px_rgba(28,25,23,0.03)] space-y-5">
            <h3
              className="text-lg font-bold text-[#1C1917] border-b border-[#D6D3D1] pb-3"
              style={{ fontFamily: "var(--font-playfair, serif)" }}
            >
              Pricing & Inventory
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Price */}
              <div>
                <label htmlFor="price" className="block text-xs font-semibold uppercase tracking-wider text-[#57534E] mb-1.5">
                  Price ($ USD) <span className="text-[#DC2626]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#78716C] font-semibold">
                    $
                  </span>
                  <input
                    id="price"
                aria-invalid={Boolean(fieldErrors?.price)}
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    defaultValue={state?.fields?.price ?? initialData?.price ?? ""}
                    placeholder="29.99"
                    className="w-full pl-8 pr-4 py-2.5 bg-[#FAFAF9] border border-[#D6D3D1] rounded-lg text-sm text-[#1C1917] placeholder-[#78716C] focus:outline-none focus:border-[#C2410C] focus:ring-2 focus:ring-[#C2410C]/20 transition-all duration-150"
                  />
                  <FieldError message={fieldErrors?.price} />
                </div>
              </div>

              {/* Stock */}
              <div>
                <label htmlFor="stock" className="block text-xs font-semibold uppercase tracking-wider text-[#57534E] mb-1.5">
                  Stock Units <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  id="stock"
                aria-invalid={Boolean(fieldErrors?.stock)}
                  name="stock"
                  type="number"
                  step="1"
                  min="0"
                  required
                  defaultValue={state?.fields?.stock ?? initialData?.stock ?? "0"}
                  placeholder="50"
                  className="w-full px-4 py-2.5 bg-[#FAFAF9] border border-[#D6D3D1] rounded-lg text-sm text-[#1C1917] placeholder-[#78716C] focus:outline-none focus:border-[#C2410C] focus:ring-2 focus:ring-[#C2410C]/20 transition-all duration-150"
                />
                <FieldError message={fieldErrors?.stock} />
              </div>

              {/* Rating */}
              <div>
                <label htmlFor="rating" className="block text-xs font-semibold uppercase tracking-wider text-[#57534E] mb-1.5">
                  Initial Rating (0 - 5)
                </label>
                <input
                  id="rating"
                aria-invalid={Boolean(fieldErrors?.rating)}
                  name="rating"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  defaultValue={state?.fields?.rating ?? initialData?.rating ?? "4.5"}
                  placeholder="4.5"
                  className="w-full px-4 py-2.5 bg-[#FAFAF9] border border-[#D6D3D1] rounded-lg text-sm text-[#1C1917] placeholder-[#78716C] focus:outline-none focus:border-[#C2410C] focus:ring-2 focus:ring-[#C2410C]/20 transition-all duration-150"
                />
                <FieldError message={fieldErrors?.rating} />
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Media & Image Preview */}
        <div className="space-y-6">
          <div className="bg-[#F5F5F4] border border-[#D6D3D1] rounded-2xl p-6 shadow-[0_2px_8px_rgba(28,25,23,0.03)] space-y-4">
            <h3
              className="text-lg font-bold text-[#1C1917] border-b border-[#D6D3D1] pb-3"
              style={{ fontFamily: "var(--font-playfair, serif)" }}
            >
              Product Media
            </h3>

            <div>
              <label htmlFor="image_url" className="block text-xs font-semibold uppercase tracking-wider text-[#57534E] mb-1.5">
                Image URL
              </label>
              <input
                id="image_url"
                aria-invalid={Boolean(fieldErrors?.image_url)}
                name="image_url"
                type="url"
                value={imageUrl}
                onChange={(e) => handleImageUrlChange(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2.5 bg-[#FAFAF9] border border-[#D6D3D1] rounded-lg text-xs text-[#1C1917] placeholder-[#78716C] focus:outline-none focus:border-[#C2410C] focus:ring-2 focus:ring-[#C2410C]/20 transition-all duration-150"
              />
              <FieldError message={fieldErrors?.image_url} />
              <p className="mt-1 text-[11px] text-[#78716C]">
                Direct image link (Cloudinary, Unsplash, or CDN).
              </p>
            </div>

            {/* Live Preview Box */}
            <div className="pt-2">
              <span className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-2">
                Live Preview
              </span>
              <div className="aspect-square w-full rounded-xl bg-[#E7E5E4] border border-[#D6D3D1] overflow-hidden relative flex items-center justify-center">
                {imageUrl && !imageError ? (
                  // Use standard img or unoptimized Next Image for remote arbitrary preview URLs
                  <Image
                    src={imageUrl}
                    alt="Preview"
                    fill
                    unoptimized
                    className="object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="text-center p-4">
                    <svg className="w-10 h-10 text-[#78716C]/60 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs text-[#78716C]">
                      {imageError ? "Could not load image from URL" : "No image preview"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions Card */}
          <div className="bg-[#F5F5F4] border border-[#D6D3D1] rounded-2xl p-6 shadow-[0_2px_8px_rgba(28,25,23,0.03)] space-y-3">
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 px-4 bg-[#C2410C] hover:bg-[#9A3412] text-white font-semibold text-sm rounded-lg transition-all duration-150 hover:shadow-[0_4px_12px_rgba(194,65,12,0.25)] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>{isEditing ? "Saving Changes..." : "Creating Product..."}</span>
                </>
              ) : (
                <span>{isEditing ? "Save Changes" : "Publish Product"}</span>
              )}
            </button>

            <Link
              href="/admin/products"
              className="w-full py-2.5 px-4 border border-[#D6D3D1] hover:bg-[#E7E5E4] text-[#57534E] font-semibold text-sm rounded-lg transition-colors duration-150 text-center block cursor-pointer"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </form>
  )
}
