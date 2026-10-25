import { Suspense } from "react"
import LoginForm from "./LoginForm"

interface LoginPageProps {
  searchParams: Promise<{ next?: string; error?: string }>
}

async function LoginContent({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next } = await searchParams
  return <LoginForm next={next || "/"} />
}

export default function LoginPage(props: LoginPageProps) {
  return (
    <main className="min-h-screen bg-[#FAFAF9] flex items-center justify-center px-6 py-16">
      <Suspense fallback={<div className="w-full max-w-sm h-80 bg-[#E7E5E4] rounded-2xl animate-pulse" />}>
        <LoginContent searchParams={props.searchParams} />
      </Suspense>
    </main>
  )
}
