"use server"

import { revalidatePath, updateTag } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/dal"
import { stripe } from "@/lib/stripe"

export async function addToCart(productId: string) {
  const user = await getUser()
  if (!user) redirect("/login")

  const supabase = await createClient()
  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: existing.quantity + 1 })
      .eq("id", existing.id)
    if (error) redirect(`/cart?error=${encodeURIComponent(error.message)}`)
  } else {
    const { error } = await supabase
      .from("cart_items")
      .insert({ user_id: user.id, product_id: productId, quantity: 1 })

    if (error?.code === "23505") {
      // Lost the race with a concurrent add-to-cart for the same product
      // (unique(user_id, product_id)) — the other request already inserted
      // the row, so fold this add into it instead of dropping it silently.
      const { data: current } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .single()
      if (current) {
        await supabase
          .from("cart_items")
          .update({ quantity: current.quantity + 1 })
          .eq("id", current.id)
      }
    } else if (error) {
      redirect(`/cart?error=${encodeURIComponent(error.message)}`)
    }
  }

  revalidatePath("/cart")
  redirect("/cart")
}

export async function updateCartQuantity(cartItemId: string, formData: FormData) {
  const user = await getUser()
  if (!user) redirect("/login")

  const quantity = Number(formData.get("quantity"))
  if (!Number.isFinite(quantity)) {
    revalidatePath("/cart")
    return
  }

  const supabase = await createClient()

  const { error } =
    quantity <= 0
      ? await supabase.from("cart_items").delete().eq("id", cartItemId).eq("user_id", user.id)
      : await supabase
          .from("cart_items")
          .update({ quantity })
          .eq("id", cartItemId)
          .eq("user_id", user.id)

  if (error) redirect(`/cart?error=${encodeURIComponent(error.message)}`)

  revalidatePath("/cart")
}

export async function removeFromCart(cartItemId: string) {
  const user = await getUser()
  if (!user) redirect("/login")

  const supabase = await createClient()
  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", cartItemId)
    .eq("user_id", user.id)

  if (error) redirect(`/cart?error=${encodeURIComponent(error.message)}`)

  revalidatePath("/cart")
}

export async function placeOrder(formData?: FormData) {
  const user = await getUser()
  if (!user) redirect("/login")

  const supabase = await createClient()

  // Sync client-side quantities from localStorage to cart_items before executing place_order
  const quantitiesRaw = formData?.get("quantities")
  if (typeof quantitiesRaw === "string" && quantitiesRaw.trim() !== "") {
    try {
      const quantities = JSON.parse(quantitiesRaw) as Record<string, number>
      const updates = Object.entries(quantities).map(async ([cartItemId, qty]) => {
        const num = Number(qty)
        if (!Number.isFinite(num)) return
        if (num <= 0) {
          return supabase.from("cart_items").delete().eq("id", cartItemId).eq("user_id", user.id)
        } else {
          return supabase
            .from("cart_items")
            .update({ quantity: num })
            .eq("id", cartItemId)
            .eq("user_id", user.id)
        }
      })
      await Promise.all(updates)
    } catch (err) {
      console.error("Failed to sync cart quantities on checkout:", err)
    }
  }

  // place_order() locks the cart's product rows, rejects the order if any line
  // exceeds the stock on hand, and decrements stock in the same transaction
  // that writes the order. Two shoppers racing for the last unit serialize
  // inside it: one gets an order, the other gets the error below and never
  // reaches Stripe.
  const { data: orderId, error } = await supabase.rpc("place_order")

  if (error) {
    redirect(`/cart?error=${encodeURIComponent(error.message)}`)
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("quantity, unit_price, product:products(name)")
    .eq("order_id", orderId)
    .overrideTypes<{ quantity: number; unit_price: number; product: { name: string } | null }[], { merge: false }>()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      line_items: (items ?? []).map((item) => ({
        price_data: {
          currency: "usd",
          product_data: { name: item.product?.name ?? "Item" },
          // Stripe wants integer cents; price*100 can land on e.g. 1998.9999999997
          // in floating point, so round instead of truncating with Math.floor.
          unit_amount: Math.round(item.unit_price * 100),
        },
        quantity: item.quantity,
      })),
      // The pending order holds the stock until this session is paid or
      // expires, so keep the hold short — Stripe's default is 24 hours, which
      // would park inventory for a day. 30 minutes is Stripe's minimum. The
      // expiry is what fires checkout.session.expired, which the webhook turns
      // back into available stock.
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      success_url: `${siteUrl}/orders/${orderId}?success=true`,
      cancel_url: `${siteUrl}/cart`,
      client_reference_id: user.id,
      customer_email: user.email ?? undefined,
      // Read back by the webhook to know which order a completed session paid for.
      metadata: { order_id: orderId },
    },
    // One session per order: a retried action reuses the existing session
    // instead of opening a second one against the same held stock.
    { idempotencyKey: `checkout-session:${orderId}` },
  )

  if (!session.url) {
    redirect(`/cart?error=${encodeURIComponent("Could not start checkout")}`)
  }

  revalidatePath("/cart")
  revalidatePath("/orders")
  // Stock just dropped. Product reads are cached under the "products" tag with
  // cacheLife("minutes") (lib/products.ts), so without this a sold-out product
  // keeps rendering as in stock. updateTag (not revalidateTag) because a Server
  // Action wants read-your-own-writes, not stale-while-revalidate.
  updateTag("products")
  redirect(session.url)
}
