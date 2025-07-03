"use client"

import * as React from "react"
import { type Icon } from "@tabler/icons-react"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string
    url?: string
    icon: Icon
    onClick?: () => void
  }[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              {item.url ? (
                <a
                  href={item.url}
                  onClick={item.onClick}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-accent focus:outline-none focus:ring-2"
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.title}</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-accent focus:outline-none focus:ring-2"
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.title}</span>
                </button>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
