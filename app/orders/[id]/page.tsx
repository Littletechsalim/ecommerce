import { Suspense } from "react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getUser } from "@/lib/dal"
import { createClient } from "@/lib/supabase/server"
import { PageSkeleton } from "@/app/components/Skeletons"
import type { Order } from "@/types/database"

const STATUS_LABEL: Record<Order["status"], string> = {
  pending: "Order placed",
  paid: "Payment received",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
}

type OrderPageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ success?: string }>
}

export default function OrderDetailPage(props: OrderPageProps) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <OrderDetail {...props} />
    </Suspense>
  )
}

async function OrderDetail({ params, searchParams }: OrderPageProps) {
  const { id } = await params
  const { success } = await searchParams

  const user = await getUser()
  if (!user) redirect("/login")

  const supabase = await createClient()
  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, user_id, status, total, created_at, order_items(id, order_id, product_id, quantity, unit_price, created_at, product:products(*))"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle()
    .overrideTypes<Order, { merge: false }>()

  if (!order) notFound()

  return (
    <main className="min-h-screen bg-[#FAFAF9] px-6 py-12 md:py-16">
      <div className="max-w-[800px] mx-auto">
        {success === "true" && order.status === "pending" && (
          <p className="mb-4 px-4 py-2 rounded-lg bg-[#FEF3C7] text-[#92400E] text-sm">
            Payment received by Stripe — confirming with our system now. This page will say
            &quot;Payment received&quot; within a few seconds; refresh if it doesn&apos;t update.
          </p>
        )}
        <p className="text-sm font-semibold text-[#C2410C] mb-2">{STATUS_LABEL[order.status]}</p>
        <h1
          className="text-3xl font-bold text-[#1C1917] mb-2"
          style={{ fontFamily: "var(--font-playfair, serif)", letterSpacing: "-0.02em" }}
        >
          Order #{order.id.slice(0, 8)}
        </h1>
        <p className="text-[#57534E] mb-8">Placed {new Date(order.created_at).toLocaleString()}</p>

        <div className="bg-[#F5F5F4] border border-[#D6D3D1] rounded-xl p-5 mb-6">
          <div className="flex flex-col gap-3 mb-4">
            {order.order_items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-[#1C1917]">
                  {item.product?.name ?? "Product"} × {item.quantity}
                </span>
                <span className="text-[#78716C]">${(item.unit_price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#D6D3D1] flex items-center justify-between">
            <span className="font-semibold text-[#1C1917]">Total</span>
            <span className="text-lg font-bold text-[#C2410C]">${order.total.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex gap-4">
          <Link
            href="/orders"
            className="text-sm font-semibold text-[#C2410C] hover:underline cursor-pointer"
          >
            View all orders
          </Link>
          <Link
            href="/featured_products"
            className="text-sm font-semibold text-[#57534E] hover:text-[#C2410C] transition-colors duration-150 cursor-pointer"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </main>
  )
}
