"use client"

export function SiteFooter() {
  return (
    <footer className="w-full bottom-0 left-0 flex justify-center z-50 pb-2 pointer-events-none bg-sidebar">
      <div className="text-xs font-mono px-2 py-1 rounded bg-muted text-muted-foreground shadow pointer-events-auto">
        Ver: {process.env.NEXT_PUBLIC_ENV?.toUpperCase()} |
        {" "}{process.env.NEXT_PUBLIC_GIT_COMMIT_REF} @
        {" "}{process.env.NEXT_PUBLIC_GIT_COMMIT_SHA}
      </div>
    </footer>
  )
} 