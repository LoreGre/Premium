"use client"

export function SiteFooter() {
  const env = process.env.NEXT_PUBLIC_ENV?.toUpperCase()
  const branch = process.env.NEXT_PUBLIC_GIT_COMMIT_REF
  const commit = process.env.NEXT_PUBLIC_GIT_COMMIT_SHA

  return (
    <footer className="w-full py-4 px-2 text-center text-xs text-muted-foreground font-mono">
      <span className="inline-block rounded bg-muted px-2 py-1">
        Ver: {env} | {branch} @ {commit?.slice(0, 7)}
      </span>
    </footer>
  )
}
