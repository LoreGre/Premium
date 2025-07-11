'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ArrowUp } from 'lucide-react'

type ChatInputProps = {
  onSend: (message: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (!input.trim()) return
    onSend(input.trim())
    setInput('')
  }

  return (
    <div className="sticky bottom-0 w-full border-t bg-background px-4 pt-4">
      <div className="max-w-3xl mx-auto relative">
        <Textarea
          placeholder="Scrivi qui la tua richiesta..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="min-h-[120px] resize-none pr-12"
          disabled={disabled}
        />
        <Button
          size="icon"
          className="absolute bottom-2 right-2"
          onClick={handleSend}
          disabled={disabled}
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
