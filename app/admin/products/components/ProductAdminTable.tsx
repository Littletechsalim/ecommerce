"use client"

import { useState, useTransition, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { Product } from "@/types/database"
import { adjustStock } from "@/app/actions/admin-products"
import DeleteProductModal from "./DeleteProductModal"

interface ProductAdminTableProps {
  initialProducts: Product[]
}

type StockFilter = "all" | "in_stock" | "low_stock" | "out_of_stock"
type SortOption = "newest" | "price_asc" | "price_desc" | "stock_asc" | "stock_desc" | "name_asc"

export default function ProductAdminTable({ initialProducts }: ProductAdminTableProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL")
  const [stockFilter, setStockFilter] = useState<StockFilter>("all")
  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [pendingStockId, setPendingStockId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  // Distinct categories from products
  const categories = useMemo(() => {
    const set = new Set<string>()
    initialProducts.forEach((p) => {
      if (p.category) set.add(p.category)
    })
    return Array.from(set).sort()
  }, [initialProducts])

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          const matchName = p.name.toLowerCase().includes(q)
          const matchDesc = p.description?.toLowerCase().includes(q)
          const matchCat = p.category?.toLowerCase().includes(q)
          if (!matchName && !matchDesc && !matchCat) return false
        }

        // Category filter
        if (selectedCategory !== "ALL") {
          if (p.category !== selectedCategory) return false
        }

        // Stock filter
        if (stockFilter === "in_stock" && p.stock <= 0) return false
        if (stockFilter === "low_stock" && (p.stock <= 0 || p.stock > 10)) return false
        if (stockFilter === "out_of_stock" && p.stock !== 0) return false

        return true
      })
      .sort((a, b) => {
        if (sortBy === "price_asc") return a.price - b.price
        if (sortBy === "price_desc") return b.price - a.price
        if (sortBy === "stock_asc") return a.stock - b.stock
        if (sortBy === "stock_desc") return b.stock - a.stock
        if (sortBy === "name_asc") return a.name.localeCompare(b.name)
        // default newest
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
  }, [products, searchQuery, selectedCategory, stockFilter, sortBy])

  // Quick stock adjuster
  const handleQuickStock = (productId: string, delta: number) => {
    setPendingStockId(productId)
    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: Math.max(0, p.stock + delta) } : p))
    )

    startTransition(async () => {
      const res = await adjustStock(productId, delta)
      if (res?.error) {
        // Revert on failure
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, stock: Math.max(0, p.stock - delta) } : p))
        )
      } else if (res?.newStock !== undefined) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, stock: res.newStock! } : p))
        )
      }
      setPendingStockId(null)
    })
  }

  const handleDeleted = (deletedId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== deletedId))
  }

  return (
    <div className="space-y-6">
      {/* Controls & Search Toolbar */}
      <div className="bg-[#F5F5F4] border border-[#D6D3D1] rounded-2xl p-4 sm:p-5 shadow-[0_2px_8px_rgba(28,25,23,0.03)] space-y-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search products by title, category, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#FAFAF9] border border-[#D6D3D1] rounded-lg text-sm text-[#1C1917] placeholder-[#78716C] focus:outline-none focus:border-[#C2410C] focus:ring-2 focus:ring-[#C2410C]/20 transition-all duration-150"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#78716C] hover:text-[#1C1917]"
              >
                Clear
              </button>
            )}
          </div>

          {/* Action: Add Product */}
          <div className="flex items-center gap-3">
            <Link
              href="/admin/products/new"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#C2410C] hover:bg-[#9A3412] text-white text-sm font-semibold rounded-lg transition-all duration-150 hover:shadow-[0_4px_12px_rgba(194,65,12,0.25)] cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Product</span>
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#D6D3D1]/60 text-xs">
          {/* Categories */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-[#78716C] mr-1">Category:</span>
            <button
              type="button"
              onClick={() => setSelectedCategory("ALL")}
              className={`px-2.5 py-1 rounded-full font-medium transition-all duration-150 cursor-pointer ${
                selectedCategory === "ALL"
                  ? "bg-[#C2410C] text-white"
                  : "bg-[#E7E5E4] text-[#57534E] hover:bg-[#D6D3D1]"
              }`}
            >
              All ({products.length})
            </button>
            {categories.map((cat) => {
              const count = products.filter((p) => p.category === cat).length
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-full font-medium transition-all duration-150 cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-[#C2410C] text-white"
                      : "bg-[#E7E5E4] text-[#57534E] hover:bg-[#D6D3D1]"
                  }`}
                >
                  {cat} ({count})
                </button>
              )
            })}
          </div>

          {/* Stock & Sort Dropdowns */}
          <div className="flex items-center gap-3 ml-auto">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[#78716C]">Stock:</span>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as StockFilter)}
                aria-label="Filter by stock status"
                className="bg-[#FAFAF9] border border-[#D6D3D1] rounded-lg px-2.5 py-1 text-xs text-[#1C1917] focus:outline-none focus:border-[#C2410C]"
              >
                <option value="all">All Levels</option>
                <option value="in_stock">In Stock (&gt;0)</option>
                <option value="low_stock">Low Stock (≤10)</option>
                <option value="out_of_stock">Out of Stock (0)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[#78716C]">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Sort products"
                className="bg-[#FAFAF9] border border-[#D6D3D1] rounded-lg px-2.5 py-1 text-xs text-[#1C1917] focus:outline-none focus:border-[#C2410C]"
              >
                <option value="newest">Newest First</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="stock_desc">Stock: High to Low</option>
                <option value="stock_asc">Stock: Low to High</option>
                <option value="name_asc">Name: A to Z</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Product Results Counter */}
      <div className="flex items-center justify-between text-xs text-[#78716C] px-1">
        <span>
          Showing <strong className="text-[#1C1917]">{filteredProducts.length}</strong> of{" "}
          <strong>{products.length}</strong> products
        </span>
      </div>

      {/* Main Table View */}
      {filteredProducts.length === 0 ? (
        <div className="bg-[#F5F5F4] border border-[#D6D3D1] rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#E7E5E4] flex items-center justify-center mx-auto text-[#78716C]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h4
            className="text-lg font-bold text-[#1C1917]"
            style={{ fontFamily: "var(--font-playfair, serif)" }}
          >
            No products match your criteria
          </h4>
          <p className="text-xs text-[#57534E] max-w-sm mx-auto">
            Try adjusting your search query, selecting &ldquo;All Levels&rdquo;, or resetting your filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("")
              setSelectedCategory("ALL")
              setStockFilter("all")
            }}
            className="mt-2 px-3.5 py-1.5 text-xs font-semibold text-[#C2410C] border border-[#C2410C] rounded-lg hover:bg-[#C2410C]/10 transition-colors duration-150 cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="bg-[#F5F5F4] border border-[#D6D3D1] rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(28,25,23,0.03)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#D6D3D1] bg-[#E7E5E4]/60 text-xs font-semibold text-[#57534E] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right">Price</th>
                  <th className="py-3.5 px-4 text-center">Stock Level</th>
                  <th className="py-3.5 px-4 text-center">Rating</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D6D3D1] text-sm">
                {filteredProducts.map((p) => {
                  const isStockPending = pendingStockId === p.id
                  const isOutOfStock = p.stock === 0
                  const isLowStock = p.stock > 0 && p.stock <= 10

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-[#E7E5E4]/40 transition-colors duration-150 group"
                    >
                      {/* Product Thumbnail & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-[#E7E5E4] border border-[#D6D3D1] overflow-hidden shrink-0 relative flex items-center justify-center">
                            {p.image_url ? (
                              <Image
                                src={p.image_url}
                                alt={p.name}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            ) : (
                              <span
                                className="text-lg font-bold text-[#78716C]"
                                style={{ fontFamily: "var(--font-playfair, serif)" }}
                              >
                                {p.name[0]}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs sm:max-w-md">
                            <Link
                              href={`/admin/products/${p.id}/edit`}
                              className="font-semibold text-[#1C1917] hover:text-[#C2410C] transition-colors duration-150 truncate block"
                              title={p.name}
                            >
                              {p.name}
                            </Link>
                            {p.description && (
                              <p className="text-xs text-[#78716C] truncate mt-0.5">
                                {p.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full bg-[#E7E5E4] text-[#57534E] text-xs font-semibold tracking-wide">
                          {p.category ?? "General"}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 text-right font-semibold text-[#1C1917] whitespace-nowrap">
                        ${p.price.toFixed(2)}
                      </td>

                      {/* Stock Level with Quick Adjust */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          {/* Quick Decrement */}
                          <button
                            type="button"
                            onClick={() => handleQuickStock(p.id, -1)}
                            disabled={p.stock <= 0 || isStockPending}
                            title="Decrement stock (-1)"
                            className="w-6 h-6 rounded border border-[#D6D3D1] bg-[#FAFAF9] hover:bg-[#E7E5E4] text-[#57534E] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors duration-150 cursor-pointer text-xs font-bold"
                          >
                            −
                          </button>

                          {/* Stock Badge */}
                          <span
                            className={`min-w-[70px] text-center px-2 py-0.5 rounded-full text-xs font-bold ${
                              isOutOfStock
                                ? "bg-[#DC2626]/10 text-[#DC2626]"
                                : isLowStock
                                ? "bg-[#F59E0B]/20 text-[#D97706]"
                                : "bg-[#16A34A]/10 text-[#16A34A]"
                            }`}
                          >
                            {p.stock} units
                          </span>

                          {/* Quick Increment */}
                          <button
                            type="button"
                            onClick={() => handleQuickStock(p.id, 1)}
                            disabled={isStockPending}
                            title="Increment stock (+1)"
                            className="w-6 h-6 rounded border border-[#D6D3D1] bg-[#FAFAF9] hover:bg-[#E7E5E4] text-[#57534E] flex items-center justify-center transition-colors duration-150 cursor-pointer text-xs font-bold"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="py-3 px-4 text-center whitespace-nowrap text-xs text-[#57534E]">
                        {p.rating ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="text-[#F59E0B]">★</span>
                            <span className="font-semibold text-[#1C1917]">{p.rating.toFixed(1)}</span>
                          </span>
                        ) : (
                          <span className="text-[#78716C]">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View in Storefront */}
                          <Link
                            href={`/product/${p.id}`}
                            target="_blank"
                            title="Preview on storefront"
                            className="p-1.5 text-[#78716C] hover:text-[#C2410C] hover:bg-[#FAFAF9] rounded-lg transition-colors duration-150"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </Link>

                          {/* Edit */}
                          <Link
                            href={`/admin/products/${p.id}/edit`}
                            title="Edit product"
                            className="p-1.5 text-[#57534E] hover:text-[#C2410C] hover:bg-[#FAFAF9] rounded-lg transition-colors duration-150"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setProductToDelete(p)}
                            title="Delete product"
                            className="p-1.5 text-[#78716C] hover:text-[#DC2626] hover:bg-[#DC2626]/10 rounded-lg transition-colors duration-150 cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteProductModal
        product={productToDelete}
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        onDeleted={handleDeleted}
      />
    </div>
  )
}
