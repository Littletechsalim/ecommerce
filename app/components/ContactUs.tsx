const contactInfo = [
  {
    label: "Email",
    value: "support@shopwave.com",
    href: "mailto:support@shopwave.com",
  },
  {
    label: "Phone",
    value: "+1 (800) 555-0192",
    href: "tel:+18005550192",
  },
  {
    label: "Address",
    value: "123 Commerce St, San Francisco, CA 94105",
    href: null,
  },
  {
    label: "Hours",
    value: "Mon–Fri, 9am–6pm PST",
    href: null,
  },
]

export default function ContactUs() {
  return (
    <section id="contact" className="bg-[#F5F5F4] border-t border-[#D6D3D1] px-6 py-16 md:py-24">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-10">
          <h2
            className="text-3xl md:text-4xl font-bold text-[#1C1917] tracking-tight"
            style={{ fontFamily: "var(--font-playfair, serif)", letterSpacing: "-0.02em" }}
          >
            Contact Us
          </h2>
          <p className="mt-2 text-[#57534E]">We&apos;re here to help. Reach out anytime.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {contactInfo.map((item) => (
            <div
              key={item.label}
              className="bg-[#FAFAF9] border border-[#D6D3D1] rounded-xl p-5 flex flex-col gap-1"
            >
              <span className="text-xs font-semibold uppercase tracking-widest text-[#78716C]">
                {item.label}
              </span>
              {item.href ? (
                <a
                  href={item.href}
                  className="text-[#1C1917] font-semibold hover:text-[#C2410C] transition-colors duration-150"
                >
                  {item.value}
                </a>
              ) : (
                <span className="text-[#1C1917] font-semibold">{item.value}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
