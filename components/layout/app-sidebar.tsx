"use client"

import * as React from "react"
import Link from "next/link"
import Image from 'next/image'
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  IconDashboard,
  IconListDetails,
  IconUsers,
  IconBuildingStore,
  IconLogout,
  IconMessageDots
} from "@tabler/icons-react"

import { NavMain } from "@/components/layout/nav-main"
import { NavSecondary } from "@/components/layout/nav-secondary"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
  
    // 🔒 Elimina i cookie Supabase (client-side)
    document.cookie = 'sb-access-token=; Max-Age=0; Path=/;'
    document.cookie = 'sb-refresh-token=; Max-Age=0; Path=/;'
  
    router.push("/login")
  }
  

  const data = {
    navMain: [
      { title: "Dashboard", url: "/dashboard", icon: IconDashboard },
      { title: "Chats", url: "/chats", icon: IconMessageDots },
      { title: "Offerte",    url: "/offerte", icon: IconListDetails },
      { title: "Clienti",    url: "/clienti", icon: IconUsers },
      { title: "Fornitori",  url: "/fornitori", icon: IconBuildingStore },
    ],
    navSecondary: [
      { title: "Logout", icon: IconLogout, onClick: handleLogout },
    ],
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link href="/dashboard" className="flex items-center gap-2">
              <Image
                src="/logo.svg"
                alt="Premium S.r.l."
                width={0}
                height={0}
                sizes="50vw"
                style={{ width: '50%', height: 'auto' }}
              />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} />

        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
    </Sidebar>
  )
}
