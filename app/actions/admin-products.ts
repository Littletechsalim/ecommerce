"use server"

import { updateTag, revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createServiceClient } from "@/lib/supabase/service"
import { requireAdmin } from "@/lib/dal"
import {
  parseProductForm,
  type ProductFieldErrors,
  type ProductFormFields,
} from "@/lib/validation/product"

export type AdminProductFormState = {
  error?: string
  success?: boolean
  fieldErrors?: ProductFieldErrors
  fields?: ProductFormFields
} | undefined

export async function createProduct(
  _prevState: AdminProductFormState,
  formData: FormData
): Promise<AdminProductFormState> {
  await requireAdmin("/admin/products/new")

  const parsed = parseProductForm(formData)
  if (!parsed.ok) {
    return { error: parsed.message, fieldErrors: parsed.fieldErrors, fields: parsed.fields }
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("products")
    .insert(parsed.data)
    .select("id")
    .single()

  if (error) {
    return { error: `Failed to create product: ${error.message}`, fields: parsed.fields }
  }

  // Next.js 16 cache invalidation
  updateTag("products")
  if (data?.id) {
    updateTag(`product:${data.id}`)
  }
  revalidatePath("/admin/products")
  revalidatePath("/featured_products")
  revalidatePath("/")

  redirect("/admin/products?created=true")
}

export async function updateProduct(
  id: string,
  _prevState: AdminProductFormState,
  formData: FormData
): Promise<AdminProductFormState> {
  await requireAdmin(`/admin/products/${id}/edit`)

  if (!id) {
    return { error: "Missing product ID." }
  }

  const parsed = parseProductForm(formData)
  if (!parsed.ok) {
    return { error: parsed.message, fieldErrors: parsed.fieldErrors, fields: parsed.fields }
  }

  const supabase = createServiceClient()
  const { error } = await supabase.from("products").update(parsed.data).eq("id", id)

  if (error) {
    return { error: `Failed to update product: ${error.message}`, fields: parsed.fields }
  }

  // Invalidate cache immediately
  updateTag("products")
  updateTag(`product:${id}`)
  revalidatePath("/admin/products")
  revalidatePath(`/product/${id}`)
  revalidatePath("/featured_products")
  revalidatePath("/")

  redirect("/admin/products?updated=true")
}

export async function deleteProduct(id: string): Promise<{ error?: string; success?: boolean }> {
  await requireAdmin("/admin/products")

  if (!id) {
    return { error: "Missing product ID." }
  }

  const supabase = createServiceClient()
  const { error } = await supabase.from("products").delete().eq("id", id)

  if (error) {
    // Postgres code 23503 is foreign_key_violation (e.g. product is in order_items)
    if (error.code === "23503") {
      return {
        error:
          "This product cannot be deleted because it is recorded in historical customer orders. You can set its stock to 0 to make it unavailable.",
      }
    }
    return { error: `Failed to delete product: ${error.message}` }
  }

  updateTag("products")
  updateTag(`product:${id}`)
  revalidatePath("/admin/products")
  revalidatePath(`/product/${id}`)
  revalidatePath("/featured_products")
  revalidatePath("/")

  return { success: true }
}

export async function adjustStock(
  id: string,
  delta: number
): Promise<{ error?: string; success?: boolean; newStock?: number }> {
  await requireAdmin("/admin/products")

  if (!id) return { error: "Missing product ID" }

  const supabase = createServiceClient()
  const { data: current, error: fetchError } = await supabase
    .from("products")
    .select("stock")
    .eq("id", id)
    .single()

  if (fetchError || !current) {
    return { error: "Product not found" }
  }

  const newStock = Math.max(0, (current.stock ?? 0) + delta)
  const { error: updateError } = await supabase
    .from("products")
    .update({ stock: newStock })
    .eq("id", id)

  if (updateError) {
    return { error: updateError.message }
  }

  updateTag("products")
  updateTag(`product:${id}`)
  revalidatePath("/admin/products")
  revalidatePath(`/product/${id}`)
  revalidatePath("/featured_products")

  return { success: true, newStock }
}

export async function setProductStock(
  id: string,
  targetStock: number
): Promise<{ error?: string; success?: boolean; newStock?: number }> {
  await requireAdmin("/admin/products")

  if (!id) return { error: "Missing product ID" }
  const safeStock = Math.max(0, Math.floor(targetStock))

  const supabase = createServiceClient()
  const { error } = await supabase.from("products").update({ stock: safeStock }).eq("id", id)

  if (error) {
    return { error: error.message }
  }

  updateTag("products")
  updateTag(`product:${id}`)
  revalidatePath("/admin/products")
  revalidatePath(`/product/${id}`)
  revalidatePath("/featured_products")

  return { success: true, newStock: safeStock }
}
