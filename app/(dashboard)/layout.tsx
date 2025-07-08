import { createServerClientWrapper } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClientWrapper()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />

        {/* ⚠️ Scroll solo dentro il main */}
        <div className="flex flex-1 flex-col h-[100dvh] overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
          {/* se vuoi reinserire il footer */}
          <SiteFooter />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

