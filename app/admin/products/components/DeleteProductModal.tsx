"use client"

import { useState, useTransition } from "react"
import { Product } from "@/types/database"
import { deleteProduct } from "@/app/actions/admin-products"

interface DeleteProductModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  onDeleted: (productId: string) => void
}

export default function DeleteProductModal({
  product,
  isOpen,
  onClose,
  onDeleted,
}: DeleteProductModalProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (!isOpen || !product) return null

  const handleDelete = () => {
    setError(null)
    startTransition(async () => {
      const res = await deleteProduct(product.id)
      if (res?.error) {
        setError(res.error)
      } else {
        onDeleted(product.id)
        onClose()
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1917]/40 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <div
        className="bg-[#FAFAF9] border border-[#D6D3D1] rounded-2xl max-w-md w-full p-6 shadow-[0_24px_48px_rgba(28,25,23,0.12)] space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#DC2626]/10 flex items-center justify-center text-[#DC2626] shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h3
              id="delete-dialog-title"
              className="text-lg font-bold text-[#1C1917]"
              style={{ fontFamily: "var(--font-playfair, serif)" }}
            >
              Delete Product
            </h3>
            <p className="text-xs text-[#78716C]">Are you sure you want to remove this product?</p>
          </div>
        </div>

        <div className="p-3 bg-[#F5F5F4] rounded-lg border border-[#D6D3D1] text-sm">
          <p className="font-semibold text-[#1C1917] truncate">{product.name}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-[#57534E]">
            <span>Category: {product.category ?? "General"}</span>
            <span>•</span>
            <span>Stock: {product.stock}</span>
            <span>•</span>
            <span>Price: ${product.price.toFixed(2)}</span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-[#DC2626]/10 border border-[#DC2626]/30 rounded-lg text-xs text-[#DC2626] leading-relaxed">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 border border-[#D6D3D1] hover:bg-[#F5F5F4] text-[#57534E] text-sm font-semibold rounded-lg transition-colors duration-150 disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-sm font-semibold rounded-lg transition-colors duration-150 disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            {isPending ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Deleting...</span>
              </>
            ) : (
              <span>Confirm Delete</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
