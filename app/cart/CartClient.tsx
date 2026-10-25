"use client"

import { useCallback, useMemo, useState, useSyncExternalStore, useTransition } from "react"
import Link from "next/link"
import { removeFromCart, placeOrder } from "@/app/actions/cart"
import type { CartItem } from "@/types/database"

interface CartClientProps {
  initialItems: CartItem[]
  userId: string
  error?: string
}

// Saved quantities live in localStorage, so React reads them as an external
// store rather than copying them into state from an effect. The `storage`
// event only fires in *other* tabs, so writes from this tab notify the local
// subscribers themselves - both paths end up in the same snapshot.
const listeners = new Set<() => void>()

function subscribeToQuantities(onStoreChange: () => void) {
  listeners.add(onStoreChange)
  window.addEventListener("storage", onStoreChange)
  return () => {
    listeners.delete(onStoreChange)
    window.removeEventListener("storage", onStoreChange)
  }
}

// Passing null clears the saved quantities.
function writeQuantities(storageKey: string, quantities: Record<string, number> | null) {
  try {
    if (quantities === null) {
      localStorage.removeItem(storageKey)
    } else {
      localStorage.setItem(storageKey, JSON.stringify(quantities))
    }
  } catch (err) {
    console.error("Failed to save cart quantities to localStorage:", err)
  }

  for (const listener of listeners) {
    listener()
  }
}

// Stock can drop between saving a quantity and coming back to the cart, so a
// saved quantity is capped on the way out of the store, not only when typed.
function capToStock(item: CartItem, quantity: number) {
  const qty = Math.max(1, quantity)
  return item.product.stock > 0 ? Math.min(qty, item.product.stock) : qty
}

export function CartClient({ initialItems, userId, error }: CartClientProps) {
  const [isPending, startTransition] = useTransition()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [removedIds, setRemovedIds] = useState<ReadonlySet<string>>(() => new Set())

  const storageKey = `cart_quantities_${userId}`

  const readQuantities = useCallback(() => {
    try {
      return localStorage.getItem(storageKey)
    } catch (err) {
      console.error("Failed to read cart quantities from localStorage:", err)
      return null
    }
  }, [storageKey])

  // The server has no localStorage, so its snapshot is null: the first client
  // render matches the server HTML and saved quantities appear on the render
  // right after hydration.
  const storedQuantities = useSyncExternalStore(subscribeToQuantities, readQuantities, () => null)

  const overrides = useMemo<Record<string, number>>(() => {
    if (!storedQuantities) return {}
    try {
      return JSON.parse(storedQuantities)
    } catch (err) {
      console.error("Failed to parse cart quantities from localStorage:", err)
      return {}
    }
  }, [storedQuantities])

  // The rendered cart is the server's cart with the saved quantities laid over
  // it, minus whatever this session removed.
  const items = useMemo(
    () =>
      initialItems
        .filter((item) => !removedIds.has(item.id))
        .map((item) => {
          const savedQty = overrides[item.id]
          if (typeof savedQty !== "number" || savedQty <= 0) return item
          return { ...item, quantity: capToStock(item, savedQty) }
        }),
    [initialItems, removedIds, overrides]
  )

  const hasLocalChanges = useMemo(() => {
    const serverQuantities = new Map(initialItems.map((item) => [item.id, item.quantity]))
    return items.some((item) => serverQuantities.get(item.id) !== item.quantity)
  }, [initialItems, items])

  // Update quantity in localStorage ONLY (no DB query); the render picks it up.
  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    const next: Record<string, number> = {}
    for (const item of items) {
      next[item.id] = item.id === itemId ? capToStock(item, newQuantity) : item.quantity
    }
    writeQuantities(storageKey, next)
  }

  // Remove item from both the client view and the database
  const handleRemove = (itemId: string) => {
    const remaining = items.filter((item) => item.id !== itemId)
    setRemovedIds((prev) => new Set(prev).add(itemId))

    if (remaining.length === 0) {
      writeQuantities(storageKey, null)
    } else {
      const next: Record<string, number> = {}
      for (const item of remaining) {
        next[item.id] = item.quantity
      }
      writeQuantities(storageKey, next)
    }

    startTransition(async () => {
      await removeFromCart(itemId)
    })
  }

  // Place order: quantities ride along in a hidden input, then localStorage is
  // cleared because the database becomes the source of truth again.
  const handleCheckoutSubmit = () => {
    setIsCheckingOut(true)
    writeQuantities(storageKey, null)
  }

  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-[#FAFAF9] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          {error && (
            <p className="mb-4 px-4 py-2 rounded-lg bg-[#FEE2E2] text-[#DC2626] text-sm">{error}</p>
          )}
          <h1
            className="text-3xl font-bold text-[#1C1917] mb-3"
            style={{ fontFamily: "var(--font-playfair, serif)", letterSpacing: "-0.02em" }}
          >
            Your cart is empty
          </h1>
          <p className="text-[#57534E] mb-8">Browse the catalog and add something you like.</p>
          <Link
            href="/featured_products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#C2410C] hover:bg-[#9A3412] text-white font-semibold rounded-lg transition-all duration-150 hover:shadow-[0_4px_12px_rgba(194,65,12,0.25)] cursor-pointer"
          >
            Shop now
          </Link>
        </div>
      </main>
    )
  }

  // Prepare quantities map for the checkout action
  const quantitiesMap: Record<string, number> = {}
  for (const item of items) {
    quantitiesMap[item.id] = item.quantity
  }

  return (
    <main className="min-h-screen bg-[#FAFAF9] px-6 py-12 md:py-16">
      <div className="max-w-[800px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-2">
          <h1
            className="text-3xl font-bold text-[#1C1917]"
            style={{ fontFamily: "var(--font-playfair, serif)", letterSpacing: "-0.02em" }}
          >
            Your Cart
          </h1>
          {hasLocalChanges && (
            <span className="inline-flex items-center gap-1.5 text-xs text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-3 py-1 rounded-full font-medium w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
              Saved locally on device (syncs at checkout)
            </span>
          )}
        </div>

        {error && (
          <p className="mb-6 px-4 py-2 rounded-lg bg-[#FEE2E2] text-[#DC2626] text-sm">{error}</p>
        )}

        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center gap-4 bg-[#F5F5F4] border border-[#D6D3D1] rounded-xl p-4"
            >
              <div className="flex-1">
                <p className="font-semibold text-[#1C1917]">{item.product.name}</p>
                <p className="text-sm text-[#78716C]">${item.product.price.toFixed(2)} each</p>
                {item.product.stock <= 5 && (
                  <p className="text-xs text-[#EA580C] mt-0.5">Only {item.product.stock} left in stock</p>
                )}
              </div>

              {/* Quantity Stepper (Stores in localStorage only) */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  className="w-8 h-8 rounded-lg border border-[#D6D3D1] bg-white hover:bg-[#E7E5E4] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold text-[#1C1917] transition-colors cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <input
                  type="number"
                  name="quantity"
                  value={item.quantity}
                  min={1}
                  max={item.product.stock > 0 ? item.product.stock : undefined}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10)
                    if (!isNaN(val)) {
                      handleUpdateQuantity(item.id, val)
                    }
                  }}
                  className="w-14 px-2 py-1.5 rounded-lg border border-[#D6D3D1] bg-white text-center font-semibold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                />
                <button
                  type="button"
                  onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                  disabled={item.product.stock > 0 && item.quantity >= item.product.stock}
                  className="w-8 h-8 rounded-lg border border-[#D6D3D1] bg-white hover:bg-[#E7E5E4] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold text-[#1C1917] transition-colors cursor-pointer"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                disabled={isPending}
                className="text-sm text-[#78716C] hover:text-[#DC2626] transition-colors duration-150 cursor-pointer disabled:opacity-50"
              >
                Remove
              </button>

              {/* Line Subtotal */}
              <p className="sm:w-20 text-right font-semibold text-[#1C1917]">
                ${(item.product.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-[#D6D3D1] flex items-center justify-between">
          <span className="text-lg font-semibold text-[#1C1917]">Total</span>
          <span
            className="text-2xl font-bold text-[#C2410C]"
            style={{ fontFamily: "var(--font-playfair, serif)" }}
          >
            ${total.toFixed(2)}
          </span>
        </div>

        {/* Checkout Form - Passes localStorage quantities to Server Action */}
        <form action={placeOrder} onSubmit={handleCheckoutSubmit} className="mt-6">
          <input type="hidden" name="quantities" value={JSON.stringify(quantitiesMap)} />
          <button
            type="submit"
            disabled={isCheckingOut || isPending}
            className="w-full py-4 bg-[#C2410C] hover:bg-[#9A3412] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-150 hover:shadow-[0_6px_20px_rgba(194,65,12,0.3)] cursor-pointer"
          >
            {isCheckingOut ? "Processing Order..." : "Place Order"}
          </button>
        </form>
      </div>
    </main>
  )
}
