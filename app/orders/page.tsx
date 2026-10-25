import { Suspense } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getUser } from "@/lib/dal"
import { createClient } from "@/lib/supabase/server"
import { PageSkeleton } from "@/app/components/Skeletons"
import type { Order } from "@/types/database"

export default function OrdersPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <OrdersContent />
    </Suspense>
  )
}

async function OrdersContent() {
  const user = await getUser()
  if (!user) redirect("/login")

  const supabase = await createClient()
  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, user_id, status, total, created_at, order_items(id, order_id, product_id, quantity, unit_price, created_at, product:products(*))"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .overrideTypes<Order[], { merge: false }>()

  const items = orders ?? []

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-[#FAFAF9] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <h1
            className="text-3xl font-bold text-[#1C1917] mb-3"
            style={{ fontFamily: "var(--font-playfair, serif)", letterSpacing: "-0.02em" }}
          >
            No orders yet
          </h1>
          <p className="text-[#57534E] mb-8">Once you place an order, it&apos;ll show up here.</p>
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

  return (
    <main className="min-h-screen bg-[#FAFAF9] px-6 py-12 md:py-16">
      <div className="max-w-[800px] mx-auto">
        <h1
          className="text-3xl font-bold text-[#1C1917] mb-8"
          style={{ fontFamily: "var(--font-playfair, serif)", letterSpacing: "-0.02em" }}
        >
          Your Orders
        </h1>

        <div className="flex flex-col gap-6">
          {items.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="bg-[#F5F5F4] border border-[#D6D3D1] rounded-xl p-5 block transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(28,25,23,0.06)] cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-[#1C1917]">
                    Order #{order.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-[#78716C]">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#E7E5E4] text-[#78716C] text-xs font-semibold uppercase tracking-wide">
                  {order.status}
                </span>
              </div>

              <div className="flex flex-col gap-2 mb-4">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-[#1C1917]">
                      {item.product?.name ?? "Product"} × {item.quantity}
                    </span>
                    <span className="text-[#78716C]">
                      ${(item.unit_price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-[#D6D3D1] flex items-center justify-between">
                <span className="font-semibold text-[#1C1917]">Total</span>
                <span className="text-lg font-bold text-[#C2410C]">${order.total.toFixed(2)}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
