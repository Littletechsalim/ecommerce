// Moves the catalog's product photos onto your own Cloudinary account and
// repoints products.image_url at them.
//
//   pnpm images:cloudinary            upload anything not already on Cloudinary
//   pnpm images:cloudinary --force    re-upload everything, overwriting
//   pnpm images:cloudinary --dry-run  list what would happen, touch nothing
//
// Cloudinary fetches each current image_url itself (upload-by-URL), so nothing
// is downloaded to this machine. Each product lands at products/<slug> so a
// re-run overwrites the same asset instead of piling up duplicates.
//
// Needs CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in
// .env, plus the Supabase service-role key (products has no write policy for
// anon or authenticated, by design). The API secret signs upload requests —
// keep it server-side only and never rename it to NEXT_PUBLIC_*.
import { v2 as cloudinary } from "cloudinary"

const force = process.argv.includes("--force")
const dryRun = process.argv.includes("--dry-run")

// A dry run never signs an upload, so it only needs the Supabase side.
const required = [
  ...(dryRun ? [] : ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"]),
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
]
const missing = required.filter((key) => !process.env[key])
if (missing.length) {
  console.error(`Missing env var(s): ${missing.join(", ")}`)
  console.error("Run with: pnpm images:cloudinary  (loads .env via node --env-file)")
  process.exit(1)
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

const SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, "content-type": "application/json" }

const slugify = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

const res = await fetch(`${SUPABASE}/rest/v1/products?select=id,name,image_url&order=created_at`, { headers })
if (!res.ok) {
  console.error(`Could not read products: ${res.status} ${await res.text()}`)
  process.exit(1)
}
const products = await res.json()

let uploaded = 0
let skipped = 0
const failures = []

for (const product of products) {
  const slug = slugify(product.name)
  const publicId = `products/${slug}`

  if (!product.image_url) {
    console.log(`-  ${product.name}: no image_url to copy, skipped`)
    skipped++
    continue
  }
  if (!force && product.image_url.includes("res.cloudinary.com")) {
    console.log(`-  ${product.name}: already on Cloudinary, skipped`)
    skipped++
    continue
  }

  if (dryRun) {
    console.log(`?  ${product.name}: would upload ${product.image_url} -> ${publicId}`)
    uploaded++
    continue
  }

  try {
    const result = await cloudinary.uploader.upload(product.image_url, {
      public_id: publicId,
      overwrite: true,
      invalidate: true,
      resource_type: "image",
    })

    // f_auto/q_auto let Cloudinary pick format and compression per browser.
    // next/image still wraps this URL, so the two optimizers stack harmlessly:
    // Cloudinary delivers a sensible original, Next resizes per breakpoint.
    const url = cloudinary.url(result.public_id, {
      secure: true,
      fetch_format: "auto",
      quality: "auto",
      version: result.version,
    })

    const patch = await fetch(`${SUPABASE}/rest/v1/products?id=eq.${product.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ image_url: url }),
    })
    if (!patch.ok) throw new Error(`Supabase PATCH ${patch.status}: ${await patch.text()}`)

    console.log(`✓  ${product.name} -> ${url}`)
    uploaded++
  } catch (error) {
    console.error(`✗  ${product.name}: ${error.message}`)
    failures.push(product.name)
  }
}

console.log(`\n${dryRun ? "would upload" : "uploaded"}=${uploaded} skipped=${skipped} failed=${failures.length}`)
if (failures.length) {
  console.error(`Failed: ${failures.join(", ")}`)
  process.exit(1)
}
if (!dryRun) {
  console.log("Product rows now point at Cloudinary. Restart `pnpm dev` to clear the cached product reads.")
}
