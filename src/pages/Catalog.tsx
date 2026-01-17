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

import { ChevronLeft, ChevronRight, Loader2, Sparkles } from "lucide-react"
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
   OPTIMIZED BACKGROUND
================================ */
const CatalogBackground = ({ prefersReducedMotion }: { prefersReducedMotion: boolean }) => {
  if (prefersReducedMotion) {
    return (
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-cyan-500/6 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-purple-500/6 rounded-full blur-3xl" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Cyan orb */}
      <motion.div
        className="absolute top-1/4 right-1/4 w-96 h-96 bg-cyan-500/6 rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.2, 1],
          x: [0, 30, 0],
          y: [0, -20, 0]
        }}
        transition={{ 
          duration: 15,
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      />
      
      {/* Purple orb */}
      <motion.div
        className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-purple-500/6 rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.15, 1],
          x: [0, -25, 0],
          y: [0, 15, 0]
        }}
        transition={{ 
          duration: 13, 
          repeat: Infinity, 
          ease: "easeInOut",
          delay: 0.5
        }}
      />

      {/* Pink accent */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-pink-500/4 rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.4, 0.6, 0.4]
        }}
        transition={{ 
          duration: 10, 
          repeat: Infinity, 
          ease: "easeInOut",
          delay: 1
        }}
      />
    </div>
  );
};

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white relative overflow-hidden">
      <CatalogBackground prefersReducedMotion={!!prefersReducedMotion} />
      
      {/* Additional ambient layers */}
      <div className="fixed inset-0 bg-gradient-to-br from-cyan-500/2 via-transparent to-purple-500/2 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/5 via-transparent to-transparent pointer-events-none" />

      <Navbar onCartClick={() => setCartOpen(true)} />

      <main className="relative max-w-7xl mx-auto px-6 pt-28 pb-24">
        <motion.div
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20 }}
          animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={prefersReducedMotion ? undefined : { duration: 0.4, type: "spring", stiffness: 100 }}
          className="space-y-8"
        >
          {/* Header Section */}
          <motion.div
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? undefined : { delay: 0.1 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-slate-800/60 backdrop-blur-xl border border-cyan-500/30 rounded-full mb-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles className="w-4 h-4 text-cyan-400 relative z-10" />
              </motion.div>
              <span className="text-sm font-bold text-cyan-300 relative z-10">
                Catálogo Completo
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Explorá Nuestra Colección
              </span>
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Encontrá exactamente lo que buscás con nuestros filtros inteligentes
            </p>
          </motion.div>

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
                className="flex flex-col items-center justify-center py-24 space-y-5"
              >
                <motion.div
                  animate={prefersReducedMotion ? undefined : { rotate: 360 }}
                  transition={prefersReducedMotion ? undefined : { duration: 1, repeat: Infinity, ease: "linear" }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full" />
                  <Loader2 className="w-14 h-14 text-cyan-400 relative z-10" />
                </motion.div>
                <div className="text-center">
                  <p className="text-slate-300 text-lg font-bold mb-2">Cargando productos...</p>
                  <motion.div className="flex gap-2 justify-center">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-cyan-400"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </motion.div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
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
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 15 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? undefined : { delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-5 mt-12 pt-10 border-t border-slate-700/40 relative"
            >
              {/* Decorative top line glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-12 px-7 font-bold bg-slate-800/50 hover:bg-slate-800/70 text-white border border-slate-700/40 hover:border-cyan-500/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 touch-manipulation relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-cyan-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg" />
                  <ChevronLeft className="w-5 h-5 mr-2 relative z-10" />
                  <span className="relative z-10">Anterior</span>
                </Button>
              </motion.div>

              <motion.div 
                className="flex items-center gap-3 px-6 py-3 bg-slate-800/50 backdrop-blur-md border border-slate-700/40 rounded-xl relative overflow-hidden group"
                whileHover={{ scale: 1.05 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <span className="text-white font-bold text-lg relative z-10">{page}</span>
                <span className="text-slate-600 font-bold relative z-10">/</span>
                <span className="text-slate-400 font-semibold relative z-10">{totalPages}</span>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-12 px-7 font-bold bg-slate-800/50 hover:bg-slate-800/70 text-white border border-slate-700/40 hover:border-cyan-500/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 touch-manipulation relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-cyan-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg" />
                  <span className="relative z-10">Siguiente</span>
                  <ChevronRight className="w-5 h-5 ml-2 relative z-10" />
                </Button>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </main>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Bottom gradient fade */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
    </div>
  )
}

export default Catalog