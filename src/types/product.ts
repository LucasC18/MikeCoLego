export interface Product {
  id: string
  name: string

  // Usado para filtrar (slug: batman, marvel, star-wars, etc)
  category: string | null

  // Opcional si en algún lado querés mostrar el label real
  categorySlug?: string | null

  description: string
  inStock: boolean
  image: string

  // Usado para filtrar (slug: simil, hasbro-3-75)
  collection: string

  // Solo admin
  stockQty?: number | null
}

export interface CartItem extends Product {
  quantity: number
}
