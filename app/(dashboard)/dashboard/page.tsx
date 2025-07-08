import { ChatInput } from '@/components/form/chat-input'

export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 overflow-y-auto p-6">
        {/* area messaggi scrollabile */}
      </div>

      <ChatInput />
    </div>
  )
}
