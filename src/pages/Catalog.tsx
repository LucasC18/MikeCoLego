import { useEffect, useState, useTransition } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
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
  const prefersReducedMotion = useReducedMotion()

  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<string | null>(null)
  const [collection, setCollection] = useState<string | null>(null)
  const [inStock, setInStock] = useState(false)
  const [page, setPage] = useState(1)
  const [cartOpen, setCartOpen] = useState(false)

  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [collections, setCollections] = useState<Collection[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    apiFetch<Collection[]>("/v1/collections").then(c => {
      setCollections(c || [])
    })
  }, [])

  useEffect(() => {
    if (!collection) {
      setCategories([])
      return
    }

    apiFetch<Category[]>(`/v1/categories?collection=${collection}`)
      .then(c => setCategories(c || []))
  }, [collection])

  useEffect(() => {
    const p = new URLSearchParams(location.search)
    startTransition(() => {
      setCategory(p.get("category"))
      setCollection(p.get("collection"))
      setSearch(p.get("search") || "")
    })
  }, [location.search])

  useEffect(() => {
    if (!collection || !category) return

    if (!categories.some(c => c.slug === category)) {
      setCategory(null)
    }
  }, [collection, categories, category])

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white">
      <Navbar onCartClick={() => setCartOpen(true)} />

      <main className="relative max-w-7xl mx-auto px-6 pt-24 pb-20">
        <motion.div
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20 }}
          animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={prefersReducedMotion ? undefined : { duration: 0.3 }}
          className="space-y-6"
        >
          <SearchBar value={search} onChange={setSearch} />

          <Filters
            categories={categories}
            collections={collections}
            selectedCategory={category}
            selectedCollection={collection}
            showOnlyInStock={inStock}
            onCategoryChange={setCategory}
            onCollectionChange={(v) => {
              setCollection(v)
              setCategory(null)
            }}
            onStockFilterChange={setInStock}
            onClearFilters={clearFilters}
          />

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 space-y-4"
              >
                <motion.div
                  animate={prefersReducedMotion ? undefined : { rotate: 360 }}
                  transition={prefersReducedMotion ? undefined : { duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="w-12 h-12 text-violet-400" />
                </motion.div>
                <p className="text-slate-400 text-sm font-medium">Cargando productos...</p>
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ProductGrid
                  products={products}
                  onNavigate={(id) => navigate(`/producto/${id}`)}
                  onClearFilters={clearFilters}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {!loading && totalPages > 1 && (
            <motion.div
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? undefined : { delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 pt-8 border-t border-slate-700/50"
            >
              <Button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-11 px-6 font-semibold bg-slate-800/40 hover:bg-slate-800/60 text-white border-slate-700/50 hover:border-slate-600/60 disabled:opacity-40 disabled:cursor-not-allowed transition-all touch-manipulation"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>

              <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/30 border border-slate-700/50 rounded-lg">
                <span className="text-white font-semibold">{page}</span>
                <span className="text-slate-500">/</span>
                <span className="text-slate-400">{totalPages}</span>
              </div>

              <Button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-11 px-6 font-semibold bg-slate-800/40 hover:bg-slate-800/60 text-white border-slate-700/50 hover:border-slate-600/60 disabled:opacity-40 disabled:cursor-not-allowed transition-all touch-manipulation"
              >
                Siguiente
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}
        </motion.div>
      </main>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  )
}

export default Catalog