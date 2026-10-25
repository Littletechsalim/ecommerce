import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    // next/image refuses any remote host that is not listed here, so a product
    // whose image_url points elsewhere renders as a broken image until its host
    // is added. Keep this list to hosts the catalog actually serves from.
    remotePatterns: [
      // Seeded placeholder photos (supabase/seed_product_images.sql).
      { protocol: "https", hostname: "picsum.photos", pathname: "/seed/**" },
      // Product photos hosted on your own Cloudinary account
      // (scripts/upload-to-cloudinary.mjs puts them there).
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      // Real product photography pasted in from Unsplash.
      { protocol: "https", hostname: "images.unsplash.com" },
      // Images uploaded to this project's own Supabase Storage buckets.
      { protocol: "https", hostname: "lrhnjchkxvrolyijoweu.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
};

export default nextConfig;
