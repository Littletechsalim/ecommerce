import { Suspense } from "react"
import Link from "next/link"
import { getUser, getIsAdmin } from "@/lib/dal"
import { logout } from "@/app/actions/auth"

const linkClass =
  "text-[15px] text-[#57534E] hover:text-[#C2410C] transition-colors duration-150 cursor-pointer focus:outline-none focus:text-[#C2410C]"

// Only the pieces that depend on the signed-in user read cookies, and each
// sits behind its own <Suspense>. Everything else in the header is static and
// ships in the prerendered shell.
async function OrdersLink() {
  const user = await getUser()
  if (!user) return null
  return (
    <Link href="/orders" className={linkClass}>
      Orders
    </Link>
  )
}

async function AdminLink() {
  const isAdmin = await getIsAdmin()
  if (!isAdmin) return null
  return (
    <Link href="/admin/products" className={linkClass}>
      Admin
    </Link>
  )
}

async function Account() {
  const user = await getUser()

  if (user) {
    return (
      <>
        <Link
          href="/cart"
          className="text-sm font-semibold text-[#57534E] hover:text-[#C2410C] transition-colors duration-150 cursor-pointer"
        >
          Cart
        </Link>
        <span className="text-sm text-[#78716C] max-w-[160px] truncate">{user.email}</span>
        <form action={logout}>
          <button
            type="submit"
            className="px-4 py-2 border border-[#D6D3D1] hover:bg-[#F5F5F4] text-[#1C1917] text-sm font-semibold rounded-lg transition-all duration-150 cursor-pointer"
          >
            Log out
          </button>
        </form>
      </>
    )
  }

  return (
    <>
      <Link
        href="/login"
        className="text-sm font-semibold text-[#57534E] hover:text-[#C2410C] transition-colors duration-150 cursor-pointer"
      >
        Sign in
      </Link>
      <Link
        href="/signup"
        className="inline-flex items-center px-4 py-2 bg-[#C2410C] hover:bg-[#9A3412] text-white text-sm font-semibold rounded-lg transition-all duration-150 hover:shadow-[0_4px_12px_rgba(194,65,12,0.25)] cursor-pointer"
      >
        Sign up
      </Link>
    </>
  )
}

export default function NavBar() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#FAFAF9]/90 border-b border-[#D6D3D1]">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="text-2xl font-bold tracking-tight text-[#C2410C]"
          style={{ fontFamily: "var(--font-playfair, serif)" }}
        >
          ShopWave
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className={linkClass}>
            Home
          </Link>
          <Link href="/featured_products" className={linkClass}>
            Products
          </Link>
          <a href="#contact" className={linkClass}>
            Contact
          </a>
          <Suspense fallback={null}>
            <OrdersLink />
          </Suspense>
          <Suspense fallback={null}>
            <AdminLink />
          </Suspense>
        </nav>

        <div className="hidden md:flex items-center gap-4 min-w-[220px] justify-end">
          <Suspense fallback={<div className="h-9 w-40 rounded-lg bg-[#E7E5E4] animate-pulse" />}>
            <Account />
          </Suspense>
        </div>
      </div>
    </header>
  )
}
