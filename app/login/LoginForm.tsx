"use client"

import { useActionState } from "react"
import Link from "next/link"
import { login, signInWithGoogle } from "@/app/actions/auth"

export default function LoginForm({ next = "/" }: { next?: string }) {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <div className="w-full max-w-sm">
      <h1
        className="text-3xl font-bold text-[#1C1917] mb-2"
        style={{ fontFamily: "var(--font-playfair, serif)", letterSpacing: "-0.02em" }}
      >
        Sign in
      </h1>
      <p className="text-[#57534E] mb-8">
        Sign in to add products to your cart and view your orders.
      </p>

      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next} />

        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-[#1C1917] mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full px-4 py-2.5 rounded-lg border border-[#D6D3D1] bg-white text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-[#1C1917] mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full px-4 py-2.5 rounded-lg border border-[#D6D3D1] bg-white text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
          />
        </div>

        {state?.error && <p className="text-sm text-[#DC2626]">{state.error}</p>}

        <button
          disabled={pending}
          type="submit"
          className="w-full py-3 bg-[#C2410C] hover:bg-[#9A3412] disabled:opacity-60 text-white font-semibold rounded-lg transition-all duration-150 cursor-pointer"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="h-px flex-1 bg-[#D6D3D1]" />
        <span className="text-xs text-[#78716C]">OR</span>
        <div className="h-px flex-1 bg-[#D6D3D1]" />
      </div>

      <form action={signInWithGoogle}>
        <input type="hidden" name="next" value={next} />
        <button
          type="submit"
          className="w-full py-3 border border-[#D6D3D1] hover:bg-[#F5F5F4] text-[#1C1917] font-semibold rounded-lg transition-all duration-150 cursor-pointer"
        >
          Continue with Google
        </button>
      </form>

      <p className="mt-8 text-sm text-[#57534E] text-center">
        Don&apos;t have an account?{" "}
        <Link
          href={`/signup${next && next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="text-[#C2410C] font-semibold hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  )
}
