export default function RenewalsLoading() {
  return (
    <div className="space-y-5" aria-label="Cargando renovaciones">
      <div className="space-y-2">
        <div className="h-7 w-44 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-full max-w-xl animate-pulse rounded bg-muted" />
      </div>
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex gap-3 border-b p-4">
          <div className="h-9 w-72 animate-pulse rounded-lg bg-muted" />
          <div className="ml-auto h-9 w-72 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="space-y-0">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="grid grid-cols-6 gap-6 border-b p-4">
              {Array.from({ length: 6 }).map((__, cell) => <div key={cell} className="h-4 animate-pulse rounded bg-muted" />)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
