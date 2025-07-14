'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Eye, ShoppingCart } from 'lucide-react'
import type { ProductItem } from './types'

export function ProductBubble({ products }: { products: ProductItem[] }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-3xl w-full p-4 mb-4 bg-muted rounded-2xl rounded-bl-none shadow-sm">
        <div className="space-y-4">
          {products.map((product) => (
            <div
              key={product.sku}
              title={`SKU: ${product.sku}`}
              className="relative border rounded-xl p-4 flex items-start gap-4 bg-background"
            >
              {/* Contenuto prodotto */}
              <div className="flex-1 pr-20">
                <div className="flex gap-4">
                  <Image
                    src={product.thumb_url}
                    alt={product.name}
                    width={64}
                    height={64}
                    className="rounded-md object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(product.price ?? 0).toFixed(2)} € · {product.supplier}
                    </p>
                    <p className="text-xs mt-1 text-green-600">
                      {product.available ? 'Disponibile' : 'Non disponibile'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottoni in basso a destra */}
              <div className="absolute bottom-2 right-2 flex flex-row gap-1">
                {product.link && (
                  <a
                    href={product.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-8 h-8 bg-background/70 backdrop-blur-sm border border-border"
                      aria-label="Vedi prodotto"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </a>
                )}
                <Button
                  size="icon"
                  className="w-8 h-8 border border-border"
                  onClick={() => {
                    // TODO: aggiungi a carrello/offerta
                    console.log(`Aggiunto ${product.sku}`)
                  }}
                  aria-label="Aggiungi al carrello"
                >
                  <ShoppingCart className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
