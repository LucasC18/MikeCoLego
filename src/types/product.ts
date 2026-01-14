export interface Product {
  id: string
  name: string
  description: string
  image: string
  inStock: boolean

  // Lo que se muestra
  category: string | null          // ej: "Star Wars"
  collection: string | null        // ej: "Rancor Battalion"

  // Lo que se usa para filtrar
  categorySlug: string | null      // ej: "star-wars"
  collectionSlug: string | null    // ej: "rancor-battalion"

  // Admin / interno
  stockQty?: number | null
}

export interface CartItem extends Product {
  quantity: number
}
