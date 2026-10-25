import { Suspense } from "react"
import SignupForm from "./SignupForm"

interface SignupPageProps {
  searchParams: Promise<{ next?: string }>
}

async function SignupContent({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  return <SignupForm next={next || "/"} />
}

export default function SignupPage(props: SignupPageProps) {
  return (
    <main className="min-h-screen bg-[#FAFAF9] flex items-center justify-center px-6 py-16">
      <Suspense fallback={<div className="w-full max-w-sm h-80 bg-[#E7E5E4] rounded-2xl animate-pulse" />}>
        <SignupContent searchParams={props.searchParams} />
      </Suspense>
    </main>
  )
}
