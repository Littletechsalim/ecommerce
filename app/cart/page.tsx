import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getUser } from "@/lib/dal"
import { createClient } from "@/lib/supabase/server"
import { PageSkeleton } from "@/app/components/Skeletons"
import { CartClient } from "./CartClient"
import type { CartItem } from "@/types/database"

type SearchParams = Promise<{ error?: string }>

export default function CartPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CartContent searchParams={searchParams} />
    </Suspense>
  )
}

async function CartContent({ searchParams }: { searchParams: SearchParams }) {
  const { error } = await searchParams

  const user = await getUser()
  if (!user) redirect("/login")

  const supabase = await createClient()
  const { data: cartItems } = await supabase
    .from("cart_items")
    .select("id, user_id, product_id, quantity, created_at, product:products(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .overrideTypes<CartItem[], { merge: false }>()

  const items = cartItems ?? []

  return <CartClient initialItems={items} userId={user.id} error={error} />
}
