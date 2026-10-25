import { Product } from "@/types/database"

interface AdminMetricsProps {
  products: Product[]
}

export default function AdminMetrics({ products }: AdminMetricsProps) {
  const totalProducts = products.length
  const totalStockUnits = products.reduce((acc, p) => acc + (p.stock || 0), 0)
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 10).length
  const outOfStockCount = products.filter((p) => p.stock === 0).length
  const totalValue = products.reduce((acc, p) => acc + (p.price || 0) * (p.stock || 0), 0)

  const metrics = [
    {
      label: "Total Products",
      value: totalProducts.toString(),
      helper: "Active catalog items",
      icon: (
        <svg className="w-5 h-5 text-[#C2410C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      badgeColor: "bg-[#C2410C]/10 text-[#C2410C]",
    },
    {
      label: "Total Inventory",
      value: totalStockUnits.toLocaleString(),
      helper: "Units on hand",
      icon: (
        <svg className="w-5 h-5 text-[#57534E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      ),
      badgeColor: "bg-[#E7E5E4] text-[#57534E]",
    },
    {
      label: "Low Stock Alert",
      value: lowStockCount.toString(),
      helper: "≤ 10 units left",
      icon: (
        <svg className="w-5 h-5 text-[#D97706]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      badgeColor: lowStockCount > 0 ? "bg-[#F59E0B]/15 text-[#D97706]" : "bg-[#E7E5E4] text-[#78716C]",
    },
    {
      label: "Out of Stock",
      value: outOfStockCount.toString(),
      helper: "Requires restocking",
      icon: (
        <svg className="w-5 h-5 text-[#DC2626]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      ),
      badgeColor: outOfStockCount > 0 ? "bg-[#DC2626]/10 text-[#DC2626]" : "bg-[#E7E5E4] text-[#78716C]",
    },
    {
      label: "Inventory Value",
      value: `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      helper: "At retail price",
      icon: (
        <svg className="w-5 h-5 text-[#16A34A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      badgeColor: "bg-[#16A34A]/10 text-[#16A34A]",
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {metrics.map((item) => (
        <div
          key={item.label}
          className="bg-[#F5F5F4] border border-[#D6D3D1] rounded-xl p-4 transition-all duration-150 hover:shadow-[0_4px_16px_rgba(28,25,23,0.06)]"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#78716C]">
              {item.label}
            </span>
            <div className={`p-1.5 rounded-lg ${item.badgeColor}`}>
              {item.icon}
            </div>
          </div>
          <div
            className="text-2xl font-bold text-[#1C1917] tracking-tight"
            style={{ fontFamily: "var(--font-playfair, serif)" }}
          >
            {item.value}
          </div>
          <p className="mt-1 text-xs text-[#57534E]">{item.helper}</p>
        </div>
      ))}
    </div>
  )
}
