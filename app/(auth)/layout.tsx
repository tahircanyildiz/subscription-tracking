import { ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8faf9] px-4 py-10">
      <Link href="/" className="flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-[#0e7c66] text-white shadow-sm">
          <ShieldCheck size={19} strokeWidth={2.5} />
        </div>
        <span className="text-[17px] font-semibold tracking-[-0.02em] text-[#102a43]">
          Abonelik <span className="text-[#0e7c66]">Dedektifi</span>
        </span>
      </Link>
      <div className="mt-8 w-full max-w-sm rounded-xl border border-[#e6ecea] bg-white p-6 shadow-[0_1px_2px_rgba(16,42,67,.02)] sm:p-7">
        {children}
      </div>
      <p className="mt-6 text-center text-[11px] text-[#a0aec0]">
        Verileriniz güvenle saklanır ve üçüncü taraflarla paylaşılmaz.
      </p>
    </div>
  )
}
