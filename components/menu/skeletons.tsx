// Instant placeholders shown while a menu or dish streams in.

function Block({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className}`} />;
}

export function MenuSkeleton() {
  return (
    <main className="mx-auto w-full max-w-xl pb-16" aria-busy="true">
      <div className="flex items-center gap-4 px-4 pt-6 pb-4">
        <Block className="size-14 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Block className="h-5 w-40" />
          <Block className="h-4 w-56" />
        </div>
      </div>
      <div className="flex gap-2 border-b px-4 py-2">
        <Block className="h-11 w-24 rounded-full" />
        <Block className="h-11 w-24 rounded-full" />
        <Block className="h-11 w-24 rounded-full" />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex gap-4 px-4 py-4">
          <div className="flex-1 space-y-2">
            <Block className="h-5 w-48" />
            <Block className="h-4 w-full" />
            <Block className="h-4 w-24" />
          </div>
          <Block className="size-28 shrink-0 rounded-xl" />
        </div>
      ))}
    </main>
  );
}

export function DishSkeleton() {
  return (
    <main className="mx-auto w-full max-w-xl pb-16" aria-busy="true">
      <div className="px-2 py-2">
        <Block className="h-11 w-24 rounded-full" />
      </div>
      <Block className="aspect-square w-full rounded-none" />
      <div className="space-y-3 px-4 pt-4">
        <Block className="h-7 w-56" />
        <Block className="h-4 w-full" />
        <Block className="h-4 w-3/4" />
      </div>
    </main>
  );
}
