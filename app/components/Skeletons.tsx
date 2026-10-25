export function PageSkeleton() {
  return (
    <main className="min-h-screen bg-[#FAFAF9] px-6 py-12 md:py-16" aria-busy="true">
      <div className="max-w-[800px] mx-auto animate-pulse">
        <div className="h-8 w-48 bg-[#E7E5E4] rounded mb-8" />
        <div className="flex flex-col gap-4">
          <div className="h-20 bg-[#F5F5F4] border border-[#D6D3D1] rounded-xl" />
          <div className="h-20 bg-[#F5F5F4] border border-[#D6D3D1] rounded-xl" />
          <div className="h-20 bg-[#F5F5F4] border border-[#D6D3D1] rounded-xl" />
        </div>
      </div>
    </main>
  )
}

export function ProductGridSkeleton() {
  return (
    <div aria-busy="true" className="animate-pulse">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="h-10 w-full sm:w-64 bg-[#E7E5E4] rounded-lg" />
        <div className="h-10 w-44 bg-[#E7E5E4] rounded-lg" />
        <div className="h-10 w-44 bg-[#E7E5E4] rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-72 bg-[#F5F5F4] border border-[#D6D3D1] rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export function ProductDetailSkeleton() {
  return (
    <div
      aria-busy="true"
      className="max-w-[1200px] mx-auto px-6 py-12 md:py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start animate-pulse"
    >
      <div className="aspect-square bg-[#E7E5E4] rounded-2xl" />
      <div className="flex flex-col gap-6">
        <div className="h-5 w-24 bg-[#E7E5E4] rounded-full" />
        <div className="h-12 w-3/4 bg-[#E7E5E4] rounded" />
        <div className="h-5 w-32 bg-[#E7E5E4] rounded" />
        <div className="h-10 w-28 bg-[#E7E5E4] rounded" />
        <div className="h-20 w-full bg-[#E7E5E4] rounded" />
        <div className="h-14 w-full bg-[#E7E5E4] rounded-xl" />
      </div>
    </div>
  )
}
