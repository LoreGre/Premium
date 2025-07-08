'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ArrowUp } from 'lucide-react'

export function ChatInput() {
  const [input, setInput] = useState('')

  return (
    <div className="sticky bottom-0 w-full border-t bg-background px-4 pt-4">
      <div className="max-w-3xl mx-auto relative">
        <Textarea
          placeholder="Scrivi qui la tua richiesta..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="min-h-[120px] resize-none pr-12"
        />
        <Button
          size="icon"
          className="absolute bottom-2 right-2"
          onClick={() => {
            console.log('Messaggio:', input)
            setInput('')
          }}
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
