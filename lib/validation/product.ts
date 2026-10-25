import { z } from "zod"

/**
 * Single source of truth for product input, shared by the create and update
 * server actions. Mirrors the `products` table in supabase/schema.sql:
 * name is required, price is numeric(10,2) >= 0, rating is numeric(2,1),
 * stock is a non-negative integer, everything else is nullable.
 */

/**
 * Mirrors next/image `remotePatterns` in next.config.ts, paths included:
 * a URL that passes here must also be renderable by next/image.
 */
const ALLOWED_IMAGE_SOURCES = [
  { hostname: "picsum.photos", pathPrefix: "/seed/" },
  { hostname: "res.cloudinary.com", pathPrefix: "/" },
  { hostname: "images.unsplash.com", pathPrefix: "/" },
  { hostname: "lrhnjchkxvrolyijoweu.supabase.co", pathPrefix: "/storage/v1/object/public/" },
] as const

const ALLOWED_IMAGE_HOSTS = ALLOWED_IMAGE_SOURCES.map((source) => source.hostname)

export const PRODUCT_FIELDS = [
  "name",
  "description",
  "price",
  "stock",
  "category",
  "rating",
  "image_url",
] as const

export type ProductField = (typeof PRODUCT_FIELDS)[number]

/** FormData entries arrive as `string | File | null`; normalize to trimmed text. */
const formText = z
  .unknown()
  .transform((value) => (typeof value === "string" ? value.trim() : ""))

/** Empty input means "no value" for every optional column. */
const emptyToNull = formText.transform((value) => (value === "" ? null : value))

const nullableText = (max: number, label: string) =>
  emptyToNull.pipe(
    z
      .string()
      .max(max, { error: `${label} must be ${max} characters or fewer.` })
      .nullable()
  )

/** Rejects NaN/Infinity before any range check runs. */
const decimal = (label: string) =>
  z
    .string()
    .refine((value) => Number.isFinite(Number(value)), {
      error: `${label} must be a valid number.`,
    })
    .transform((value) => Number(value))

const round = (value: number, decimals: number) => {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/**
 * An image the admin cannot see is worse than no image: next/image throws at
 * render time for any host missing from remotePatterns, so reject it on input.
 */
function isSupportedImageUrl(value: string): boolean {
  if (value.startsWith("//")) return false
  if (value.startsWith("/")) return true

  let url: URL
  try {
    url = new URL(value)
  } catch {
    return false
  }

  if (url.protocol !== "https:") return false
  return ALLOWED_IMAGE_SOURCES.some(
    (source) => url.hostname === source.hostname && url.pathname.startsWith(source.pathPrefix)
  )
}

export const productInputSchema = z.object({
  name: formText.pipe(
    z
      .string()
      .min(1, { error: "Product name is required." })
      .max(120, { error: "Product name must be 120 characters or fewer." })
  ),

  description: nullableText(2000, "Description"),

  category: nullableText(60, "Category"),

  price: formText
    .pipe(z.string().min(1, { error: "Price is required." }))
    .pipe(decimal("Price"))
    .pipe(
      z
        .number()
        .min(0, { error: "Price cannot be negative." })
        .max(99_999_999.99, { error: "Price must be 99,999,999.99 or less." })
    )
    .transform((value) => round(value, 2)),

  // Blank stock means a product with nothing in the warehouse yet, not an error.
  stock: formText
    .transform((value) => (value === "" ? "0" : value))
    .pipe(decimal("Stock"))
    .pipe(
      z
        .number()
        .int({ error: "Stock must be a whole number." })
        .min(0, { error: "Stock cannot be negative." })
        .max(1_000_000, { error: "Stock must be 1,000,000 or less." })
    ),

  rating: emptyToNull
    .pipe(
      z.nullable(
        decimal("Rating").pipe(
          z
            .number()
            .min(0, { error: "Rating must be between 0.0 and 5.0." })
            .max(5, { error: "Rating must be between 0.0 and 5.0." })
        )
      )
    )
    .transform((value) => (value === null ? null : round(value, 1))),

  image_url: emptyToNull.pipe(
    z.nullable(
      z
        .string()
        .max(2048, { error: "Image URL must be 2048 characters or fewer." })
        .refine(isSupportedImageUrl, {
          error: `Image URL must be a site-relative path or an https link on an allowed host (${ALLOWED_IMAGE_HOSTS.join(", ")}).`,
        })
    )
  ),
})

/** Row shape accepted by the products table. */
export type ProductInput = z.output<typeof productInputSchema>

/** Raw submitted text, echoed back so the form can repopulate after an error. */
export type ProductFormFields = Record<ProductField, string>

export type ProductFieldErrors = Partial<Record<ProductField, string>>

export type ParsedProductForm =
  | { ok: true; data: ProductInput; fields: ProductFormFields }
  | {
      ok: false
      message: string
      fieldErrors: ProductFieldErrors
      fields: ProductFormFields
    }

function readFields(formData: FormData): ProductFormFields {
  const fields = {} as ProductFormFields
  for (const field of PRODUCT_FIELDS) {
    fields[field] = formData.get(field)?.toString().trim() ?? ""
  }
  return fields
}

export function parseProductForm(formData: FormData): ParsedProductForm {
  const fields = readFields(formData)
  const result = productInputSchema.safeParse(fields)

  if (result.success) {
    return { ok: true, data: result.data, fields }
  }

  const flattened = z.flattenError(result.error)
  const fieldErrors: ProductFieldErrors = {}
  for (const field of PRODUCT_FIELDS) {
    const message = flattened.fieldErrors[field]?.[0]
    if (message) fieldErrors[field] = message
  }

  const message =
    Object.values(fieldErrors)[0] ??
    flattened.formErrors[0] ??
    "Please check the product details and try again."

  return { ok: false, message, fieldErrors, fields }
}
