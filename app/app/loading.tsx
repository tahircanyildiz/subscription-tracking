export default function AppLoading() {
  return (
    <div aria-busy="true" aria-label="Yükleniyor">
      <div className="h-4 w-36 animate-pulse rounded bg-[#e6ecea]" />
      <div className="mt-3 h-7 w-64 animate-pulse rounded bg-[#e6ecea]" />
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[110px] animate-pulse rounded-xl border border-[#e6ecea] bg-white p-5"
          >
            <div className="h-3 w-24 rounded bg-[#edf1f0]" />
            <div className="mt-3 h-6 w-32 rounded bg-[#edf1f0]" />
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <div className="h-[300px] animate-pulse rounded-xl border border-[#e6ecea] bg-white" />
        <div className="h-[300px] animate-pulse rounded-xl border border-[#e6ecea] bg-white" />
      </div>
    </div>
  )
}
