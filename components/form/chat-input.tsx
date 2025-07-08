'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ArrowUp } from 'lucide-react'

export function ChatInput() {
  const [input, setInput] = useState('')

  return (
    <div className="sticky bottom-0 w-full border-t px-4 py-4">
      <div className="max-w-3xl mx-auto relative">
        <Textarea
          placeholder="Scrivi qui la tua richiesta..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="min-h-[150px] resize-none pr-12 shadow-sm text-base py-4"
        />
        <Button
          size="icon"
          className="absolute bottom-2 right-2 bg-black text-white hover:bg-black/80 rounded-full"
        >
          <ArrowUp className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
