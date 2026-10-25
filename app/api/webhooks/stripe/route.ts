import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import Stripe from "stripe"
import { stripe } from "@/lib/stripe"
import { createServiceClient } from "@/lib/supabase/service"

// Stripe calls this from its own servers, not a browser — there is no
// logged-in user and no cookie session. Authenticity comes entirely from the
// signature check below (stripe.webhooks.constructEvent), which proves the
// request body was signed with our STRIPE_WEBHOOK_SECRET. Skipping that check
// would let anyone POST a fake "payment succeeded" event and mark any order
// paid for free — never remove it, and never parse the body as JSON before
// verifying (the signature is computed over the exact raw bytes).
export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature"
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 })
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.order_id

    if (orderId) {
      const supabase = createServiceClient()

      if (event.type === "checkout.session.completed") {
        // Only flip pending -> paid, scoped to this order's id. Stripe retries
        // webhook deliveries, so this must tolerate being called more than
        // once for the same event: the second call matches zero rows (status
        // is already 'paid') and is a silent no-op instead of a double-charge
        // side effect. Stock needs no change here — place_order() already
        // claimed the units when the order was created.
        const { error } = await supabase
          .from("orders")
          .update({ status: "paid", stripe_session_id: session.id })
          .eq("id", orderId)
          .eq("status", "pending")

        // Non-2xx makes Stripe retry the delivery later instead of treating
        // a failed write as success and leaving the order stuck on 'pending'.
        if (error) {
          console.error("Stripe webhook: failed to mark order paid", orderId, error.message)
          return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
        }
      } else {
        // The shopper never paid and the session is dead, so the stock this
        // pending order was holding has to go back on the shelf. The function
        // cancels the order and restocks in one transaction, and is idempotent
        // across retried deliveries (it only acts while status = 'pending').
        const { error } = await supabase.rpc("release_order_stock", { p_order_id: orderId })

        if (error) {
          console.error("Stripe webhook: failed to release order stock", orderId, error.message)
          return NextResponse.json({ error: "Failed to release stock" }, { status: 500 })
        }

        // Cached product reads carry the "products" tag (lib/products.ts).
        // updateTag is Server-Action-only, so a Route Handler uses
        // revalidateTag; "max" gives stale-while-revalidate, and the bare
        // one-argument form is deprecated in Next 16.
        revalidateTag("products", "max")
      }
    }
  }

  return NextResponse.json({ received: true })
}
