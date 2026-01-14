import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { Product } from "@/types/product"
import { apiFetch } from "@/config/api"

/* =======================
   Backend DTO
   ======================= */
interface ProductApiDTO {
  id: string
  name: string
  image?: string | null
  imageUrl?: string | null
  category?: string | null
  categoryName?: string | null
  description?: string | null
  inStock: boolean
  collection?: string
}

/* =======================
   Context types
   ======================= */
interface ProductContextType {
  products: Product[]
  isLoading: boolean
  error: string | null
  reload: () => Promise<void>
}

const ProductContext = createContext<ProductContextType | undefined>(undefined)

/* =======================
   Mapper backend -> frontend
   ======================= */
function mapProductFromApi(p: ProductApiDTO): Product {
  return {
    id: p.id,
    name: p.name,
    image: p.image ?? p.imageUrl ?? "",
    category: p.category ?? p.categoryName ?? "Sin categoría",
    description: p.description ?? "",
    inStock: p.inStock,
    collection: p.collection ?? "Figuras",
  }
}

/* =======================
   Provider
   ======================= */
export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await apiFetch<ProductApiDTO[]>("/v1/products")

      if (!Array.isArray(res)) {
        throw new Error("Formato inválido del backend")
      }

      const mapped = res.map(mapProductFromApi)
      setProducts(mapped)
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message)
      } else {
        setError("Error cargando productos")
      }
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  return (
    <ProductContext.Provider
      value={{
        products,
        isLoading,
        error,
        reload,
      }}
    >
      {children}
    </ProductContext.Provider>
  )
}

/* =======================
   Hook
   ======================= */
export const useProducts = () => {
  const ctx = useContext(ProductContext)
  if (!ctx) {
    throw new Error("useProducts must be used within a ProductProvider")
  }
  return ctx
}
