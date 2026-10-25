"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import ProductCard from "@/app/components/ProductCard"
import type { Product } from "@/types/database"

const SORT_OPTIONS = {
  price_desc: "Price: High to Low",
  price_asc: "Price: Low to High",
  rating_desc: "Rating: High to Low",
  rating_asc: "Rating: Low to High",
} as const

type SortKey = keyof typeof SORT_OPTIONS

function isSortKey(value: string): value is SortKey {
  return value in SORT_OPTIONS
}

// Must render inside <Suspense>: useSearchParams() suspends during prerender
// because the query string isn't known until the request.
export default function ProductFilter({ products }: { products: Product[] }) {
  const router = useRouter()
  const urlParams = useSearchParams()
  const initialCategory = urlParams.get("category")
  const initialQuery = urlParams.get("q")
  const initialSort = urlParams.get("sort")

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of products) {
      if (p.category) counts.set(p.category, (counts.get(p.category) ?? 0) + 1)
    }
    return counts
  }, [products])

  const categories = useMemo(() => Array.from(categoryCounts.keys()).sort(), [categoryCounts])

  // `|| "All"` (not `??`) so a stray "?category=" (empty string) doesn't
  // resolve to a category nothing matches, hiding the whole catalog.
  const [category, setCategory] = useState(initialCategory || "All")
  const [query, setQuery] = useState(initialQuery ?? "")
  const [sort, setSort] = useState<SortKey | "">(initialSort && isSortKey(initialSort) ? initialSort : "")

  // Skip the sync on mount — state there is just a mirror of the URL we were
  // given, so replacing it again would be a same-URL navigation on every load.
  const skipNextSync = useRef(true)

  // Push URL updates on a short delay so typing doesn't spam browser history.
  useEffect(() => {
    if (skipNextSync.current) {
      skipNextSync.current = false
      return
    }
    const timeout = setTimeout(() => {
      const params = new URLSearchParams()
      if (category !== "All") params.set("category", category)
      if (query.trim()) params.set("q", query.trim())
      if (sort) params.set("sort", sort)
      const search = params.toString()
      // Read in the effect (browser only) rather than via usePathname(), which
      // suspends during prerender and would push this whole grid out of the shell.
      const { pathname } = window.location
      router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false })
    }, 300)
    return () => clearTimeout(timeout)
  }, [category, query, sort, router])

  const filtered = products.filter((p) => {
    const matchesCategory = category === "All" || p.category === category
    const matchesQuery = query.trim() === "" || p.name.toLowerCase().includes(query.trim().toLowerCase())
    return matchesCategory && matchesQuery
  })

  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case "price_desc":
        return b.price - a.price
      case "price_asc":
        return a.price - b.price
      case "rating_desc":
        return (b.rating ?? 0) - (a.rating ?? 0)
      case "rating_asc":
        return (a.rating ?? 0) - (b.rating ?? 0)
      default:
        return 0
    }
  })

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products…"
          className="w-full sm:w-64 px-4 py-2 rounded-lg border border-[#D6D3D1] bg-white text-[#1C1917] text-sm focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
        />

        <div className="flex items-center gap-3">
          <label htmlFor="category-filter" className="text-sm font-semibold text-[#1C1917]">
            Category
          </label>
          <select
            id="category-filter"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[#D6D3D1] bg-white text-[#1C1917] text-sm focus:outline-none focus:ring-2 focus:ring-[#C2410C] cursor-pointer"
          >
            <option value="All">All ({products.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c} ({categoryCounts.get(c)})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="sort-by" className="text-sm font-semibold text-[#1C1917]">
            Sort
          </label>
          <select
            id="sort-by"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey | "")}
            className="px-3 py-2 rounded-lg border border-[#D6D3D1] bg-white text-[#1C1917] text-sm focus:outline-none focus:ring-2 focus:ring-[#C2410C] cursor-pointer"
          >
            <option value="">Featured</option>
            {Object.entries(SORT_OPTIONS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="text-[#78716C]">No products match.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sorted.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
