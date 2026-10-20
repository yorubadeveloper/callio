import { cn } from "@/lib/utils";

// Placeholder layouts shown by the app's loading.tsx files, shaped like the page that's coming,
// so a tap always gets an instant response.

const Block = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse rounded-[24px] bg-ink/[0.06] motion-reduce:animate-none", className)} />
);

function Title({ action = false }: { action?: boolean }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8" aria-hidden>
      <div className="space-y-3">
        <Block className="h-10 w-56 rounded-2xl sm:h-12" />
        <Block className="h-4 w-40 rounded-full" />
      </div>
      {action && <Block className="h-11 w-32 rounded-full" />}
    </div>
  );
}

export function PageSkeleton({ variant }: { variant: "agents" | "agent" | "list" | "detail" | "form" }) {
  return (
    <div role="status" aria-label="Loading">
      {variant === "agents" && (
        <>
          <Title action />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="overflow-hidden rounded-[30px] bg-plate ring-1 ring-line">
                <Block className="h-24 rounded-none" />
                <Block className="-mt-12 ml-5 size-24 rounded-full ring-4 ring-plate" />
                <div className="space-y-2 p-5">
                  <Block className="h-7 w-28 rounded-xl" />
                  <Block className="h-4 w-40 rounded-full" />
                  <div className="flex gap-2 pt-3">
                    <Block className="h-11 w-28 rounded-full" />
                    <Block className="h-11 flex-1 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {variant === "agent" && (
        <>
          <div className="flex flex-col items-center gap-5 rounded-[32px] sm:flex-row sm:bg-plate sm:p-8 sm:ring-1 sm:ring-line">
            <Block className="size-36 rounded-full sm:size-40" />
            <div className="flex flex-1 flex-col items-center gap-3 sm:items-start">
              <Block className="h-12 w-48 rounded-2xl" />
              <Block className="h-4 w-56 rounded-full" />
            </div>
            <Block className="h-12 w-full rounded-full sm:w-48" />
          </div>
          <Block className="mt-8 h-12 w-full rounded-full sm:max-w-md" />
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <Block key={i} className="h-32" />
            ))}
          </div>
        </>
      )}
      {variant === "list" && (
        <>
          <Title />
          <div className="divide-y divide-line overflow-hidden rounded-[28px] bg-plate ring-1 ring-line">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <Block className="size-11 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Block className="h-4 w-2/5 rounded-full" />
                  <Block className="h-3.5 w-3/5 rounded-full" />
                </div>
                <Block className="h-4 w-14 rounded-full" />
              </div>
            ))}
          </div>
        </>
      )}
      {variant === "detail" && (
        <>
          <Title />
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <Block className="h-96" />
            <Block className="h-56" />
          </div>
        </>
      )}
      {variant === "form" && (
        <>
          <Title />
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4 rounded-[28px] bg-plate p-5 ring-1 ring-line sm:p-6">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Block className="h-4 w-28 rounded-full" />
                  <Block className="h-12 rounded-2xl" />
                </div>
              ))}
            </div>
            <Block className="h-64" />
          </div>
        </>
      )}
    </div>
  );
}
