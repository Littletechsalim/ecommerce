import Image from "next/image"

// Shared by the catalog cards and the product detail page so both degrade the
// same way: a product whose image_url is still null keeps the lettered
// placeholder instead of rendering an empty box.
export default function ProductImage({
  name,
  imageUrl,
  sizes,
  className = "",
  priority = false,
}: {
  name: string
  imageUrl: string | null
  sizes: string
  className?: string
  priority?: boolean
}) {
  const initial = name.trim().charAt(0).toUpperCase()

  if (!imageUrl) {
    return (
      <div
        className={`bg-gradient-to-br from-[#E7E5E4] via-[#F5F5F4] to-[#E7E5E4] flex items-center justify-center ${className}`}
      >
        <span
          className="text-4xl font-bold text-[#D6D3D1] select-none"
          style={{ fontFamily: "var(--font-playfair, serif)" }}
          aria-hidden="true"
        >
          {initial}
        </span>
        <span className="sr-only">No image for {name}</span>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden bg-[#E7E5E4] ${className}`}>
      {/* fill + sizes rather than fixed width/height: the catalog grid and the
          detail page size this box with CSS, so the intrinsic dimensions are
          not known here. */}
      <Image
        src={imageUrl}
        alt={name}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
    </div>
  )
}
