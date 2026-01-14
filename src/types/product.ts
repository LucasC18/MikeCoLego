export interface Product {
  id: string
  name: string

  // Label visible (ej: "Star Wars", "Marvel", "Terror")
  category: string | null

  // Slug URL-safe (ej: "star-wars", "marvel", "terror")
  categorySlug?: string | null

  description: string
  inStock: boolean
  image: string

  // Slug de colección (ej: "simil", "hasbro-3-75")
  collection: string

  // Solo admin
  stockQty?: number | null
}

export interface CartItem extends Product {
  quantity: number
}
