import { NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { createServiceClient } from "@/lib/supabase/service"

// Dev-only harness for the oversell guard. It drives the real checkout path —
// two separate authenticated Supabase sessions calling place_order() at the
// same moment — so the lock inside place_order() is what decides the winner,
// exactly as it does for two shoppers clicking Place Order together.
//
// It is NOT part of the product: it creates users, writes carts, and rewrites
// product stock with the service-role key, so it must never be reachable in
// production. The guard below is the only thing standing between this route
// and a public "reset my inventory" endpoint — do not remove it, and delete
// this file once the behaviour is verified.
const TEST_USERS = [
  { label: "A", email: "race-test-a@example.com", password: "race-test-A1!pw" },
  { label: "B", email: "race-test-b@example.com", password: "race-test-B2!pw" },
]

type Attempt = {
  user: string
  ok: boolean
  orderId: string | null
  error: string | null
}

async function signIn(email: string, password: string) {
  const admin = createServiceClient()

  // 422 / "already registered" just means a previous run created them.
  const { error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (createError && !/already|exists|registered/i.test(createError.message)) {
    throw new Error(`createUser(${email}): ${createError.message}`)
  }

  const client = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`signIn(${email}): ${error.message}`)

  return { client, userId: data.user.id }
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}) as Record<string, unknown>)
  const requestedProductId = typeof body.productId === "string" ? body.productId : null
  const quantity = Number(body.quantity) || 1
  const stock = Number(body.stock) || 1

  const admin = createServiceClient()

  // Pick the product to fight over.
  const { data: product, error: productError } = requestedProductId
    ? await admin.from("products").select("id, name, stock").eq("id", requestedProductId).single()
    : await admin
        .from("products")
        .select("id, name, stock")
        .order("created_at", { ascending: true })
        .limit(1)
        .single()

  if (productError || !product) {
    return NextResponse.json({ error: productError?.message ?? "No products" }, { status: 500 })
  }

  const sessions = []
  for (const user of TEST_USERS) {
    sessions.push({ ...user, ...(await signIn(user.email, user.password)) })
  }

  // Arrange: exact stock on the shelf, and both carts wanting it.
  await admin.from("products").update({ stock }).eq("id", product.id)
  for (const session of sessions) {
    await admin.from("cart_items").delete().eq("user_id", session.userId)
    const { error } = await admin
      .from("cart_items")
      .insert({ user_id: session.userId, product_id: product.id, quantity })
    if (error) {
      return NextResponse.json({ error: `seed cart ${session.label}: ${error.message}` }, { status: 500 })
    }
  }

  // Act: both checkouts in flight at once. Each rpc call is its own Postgres
  // transaction, so one of them blocks on the other's row lock.
  const attempts: Attempt[] = await Promise.all(
    sessions.map(async (session): Promise<Attempt> => {
      const { data, error } = await session.client.rpc("place_order")
      return {
        user: session.label,
        ok: !error,
        orderId: typeof data === "string" ? data : null,
        error: error?.message ?? null,
      }
    })
  )

  // Assert.
  const { data: after } = await admin.from("products").select("stock").eq("id", product.id).single()
  const { data: orders } = await admin
    .from("orders")
    .select("id, user_id, status, total")
    .in(
      "user_id",
      sessions.map((s) => s.userId)
    )
    .order("created_at", { ascending: false })
    .limit(TEST_USERS.length)

  const winners = attempts.filter((a) => a.ok).length
  const finalStock = after?.stock ?? null
  const expectedWinners = Math.floor(stock / quantity)

  const expectedStock = stock - expectedWinners * quantity

  // Every checkout passing while stock sat still is the signature of the old
  // place_order(), which never touched the column at all.
  const guardMissing =
    finalStock === stock && winners === TEST_USERS.length && expectedWinners < TEST_USERS.length

  const verdict = guardMissing
    ? "FAIL - stock never moved and every checkout passed: add_stock_reservation.sql has not been applied to this database"
    : winners === expectedWinners && finalStock === expectedStock
      ? `PASS - ${winners} of ${TEST_USERS.length} checkouts won, stock ${stock} -> ${finalStock}`
      : `FAIL - expected ${expectedWinners} winner(s) and stock ${expectedStock}, got ${winners} and ${finalStock}`

  return NextResponse.json({
    verdict,
    product: { id: product.id, name: product.name },
    stockBefore: stock,
    stockAfter: finalStock,
    quantityEach: quantity,
    attempts,
    orders,
  })
}
