import "server-only"
import { cacheLife, cacheTag } from "next/cache"
import { createPublicClient } from "@/lib/supabase/public"
import type { Product } from "@/types/database"

// Errors are thrown, not swallowed into an empty result: a cached "no
// products" from a transient Supabase outage would otherwise stick around
// until the entry expires.

export async function getProducts(): Promise<Product[]> {
  "use cache"
  cacheLife("hours")
  cacheTag("products")

  const { data, error } = await createPublicClient()
    .from("products")
    .select("*")
    .order("created_at", { ascending: true })
    .overrideTypes<Product[], { merge: false }>()

  if (error) throw new Error(`Failed to load products: ${error.message}`)
  return data
}

export async function getFeaturedProducts(): Promise<Product[]> {
  "use cache"
  cacheLife("hours")
  cacheTag("products")

  const { data, error } = await createPublicClient()
    .from("products")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(3)
    .overrideTypes<Product[], { merge: false }>()

  if (error) throw new Error(`Failed to load featured products: ${error.message}`)
  return data
}

// Shorter lifetime than the lists: this row carries `stock`.
export async function getProduct(id: string): Promise<Product | null> {
  "use cache"
  cacheLife("minutes")
  cacheTag("products", `product:${id}`)

  const { data, error } = await createPublicClient()
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle<Product>()

  if (error) throw new Error(`Failed to load product: ${error.message}`)
  return data
}

export async function getRelatedProducts(id: string): Promise<Product[]> {
  "use cache"
  cacheLife("hours")
  cacheTag("products")

  const { data, error } = await createPublicClient()
    .from("products")
    .select("*")
    .neq("id", id)
    .limit(4)
    .overrideTypes<Product[], { merge: false }>()

  if (error) throw new Error(`Failed to load related products: ${error.message}`)
  return data
}
