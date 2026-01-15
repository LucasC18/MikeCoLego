import { useEffect, useMemo, useState, useTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate, useLocation } from "react-router-dom"

import Navbar from "@/components/Navbar"
import SearchBar from "@/components/SearchBar"
import Filters from "@/components/Filters"
import ProductGrid from "@/components/ProductGrid"
import CartDrawer from "@/components/CartDrawer"

import { apiFetch } from "@/config/api"
import { Product } from "@/types/product"

import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

/* ================================
   TYPES
================================ */
interface Category { id: string; name: string; slug: string }
interface Collection { id: string; name: string; slug: string }

interface ProductsApiResponse {
  items: Product[]
  total: number
}

interface FilterState {
  category: string | null
  collection: string | null
  search: string
  inStock: boolean
  page: number
}

const PRODUCTS_PER_PAGE = 24

/* ================================
   HELPERS
================================ */
const buildQueryParams = (filters: Partial<FilterState>) => {
  const p = new URLSearchParams()
  if (filters.category) p.set("category", filters.category)
  if (filters.collection) p.set("collection", filters.collection)
  if (filters.search) p.set("search", filters.search)
  if (filters.inStock) p.set("inStock", "true")
  p.set("page", String(filters.page ?? 1))
  p.set("limit", String(PRODUCTS_PER_PAGE))
  return p.toString()
}

const useDebounce = <T,>(v: T, delay: number): T => {
  const [d, setD] = useState(v)
  useEffect(() => {
    const t = setTimeout(() => setD(v), delay)
    return () => clearTimeout(t)
  }, [v, delay])
  return d
}

/* ================================
   COMPONENT
================================ */
const Catalog = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [, startTransition] = useTransition()

  // State
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<string | null>(null)
  const [collection, setCollection] = useState<string | null>(null)
  const [inStock, setInStock] = useState(false)
  const [page, setPage] = useState(1)
  const [cartOpen, setCartOpen] = useState(false)

  // Data State
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [metadata, setMetadata] = useState<{cats: Category[], cols: Collection[]}>({ cats: [], cols: [] })

  const debouncedSearch = useDebounce(search, 300)

  // 1. Cargar Metadatos Iniciales (Solo una vez)
  useEffect(() => {
    Promise.all([
      apiFetch<Category[]>("/v1/categories"),
      apiFetch<Collection[]>("/v1/collections"),
    ]).then(([cats, cols]) => setMetadata({ cats: cats || [], cols: cols || [] }))
  }, [])

  // 2. Sincronizar URL con Estado (Deep linking)
  useEffect(() => {
    const p = new URLSearchParams(location.search)
    startTransition(() => {
      setCategory(p.get("category"))
      setCollection(p.get("collection"))
      setSearch(p.get("search") || "")
    })
  }, [location.search])

  // 3. Cargar Productos cuando cambian filtros
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const query = buildQueryParams({ category, collection, search: debouncedSearch, inStock, page })
        const r = await apiFetch<ProductsApiResponse>(`/v1/products?${query}`)
        setProducts(r.items || [])
        setTotal(r.total || 0)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [category, collection, debouncedSearch, inStock, page])

  // Reset de página al filtrar
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, category, collection, inStock])

  const totalPages = Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE))

  const clearFilters = () => {
    setSearch("")
    setCategory(null)
    setCollection(null)
    setInStock(false)
    setPage(1)
    navigate(location.pathname, { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar onCartClick={() => setCartOpen(true)} />
      
      <main className="max-w-7xl mx-auto px-6 pt-24 pb-24">
        <SearchBar value={search} onChange={setSearch} />

        <Filters
          categories={metadata.cats}
          collections={metadata.cols}
          selectedCategory={category}
          selectedCollection={collection}
          showOnlyInStock={inStock}
          onCategoryChange={setCategory}
          onCollectionChange={(v) => {
            setCollection(v)
            setCategory(null) // Limpiar categoría al cambiar colección
          }}
          onStockFilterChange={setInStock}
          onClearFilters={clearFilters}
        />

        <div className="flex items-center gap-2 mb-6">
          <Badge variant="outline" className="text-slate-400">
            {loading ? "Cargando..." : `${total} productos encontrados`}
          </Badge>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loader"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex justify-center py-32"
            >
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            >
              <ProductGrid
                products={products}
                onNavigate={(id) => navigate(`/producto/${id}`)}
                onClearFilters={clearFilters}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-6 mt-12">
            <Button 
              variant="secondary"
              disabled={page === 1} 
              onClick={() => {
                setPage(p => p - 1)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            >
              <ChevronLeft className="w-4 h-4 mr-2" /> Anterior
            </Button>
            <span className="font-mono">{page} / {totalPages}</span>
            <Button 
              variant="secondary"
              disabled={page === totalPages} 
              onClick={() => {
                setPage(p => p + 1)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            >
              Siguiente <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </main>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  )
}

export default Catalog