'use client'

import { ChatContainer } from '@/components/chat/chat-container'

export default function DashboardPage() {
  return (
    <div className="relative h-full flex flex-col">
      <ChatContainer />
    </div>
  )
}
