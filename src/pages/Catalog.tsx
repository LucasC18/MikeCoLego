import { useEffect, useMemo, useState, useTransition } from "react"
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

  // Filters
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<string | null>(null)
  const [collection, setCollection] = useState<string | null>(null)
  const [inStock, setInStock] = useState(false)
  const [page, setPage] = useState(1)
  const [cartOpen, setCartOpen] = useState(false)

  // Data
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [collections, setCollections] = useState<Collection[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  const debouncedSearch = useDebounce(search, 300)

  /* ======================
     Load collections
  ====================== */
  useEffect(() => {
    apiFetch<Collection[]>("/v1/collections").then(c => {
      setCollections(c || [])
    })
  }, [])

  /* ======================
     Load categories by collection
  ====================== */
  useEffect(() => {
    if (!collection) {
      setCategories([])
      return
    }

    apiFetch<Category[]>(`/v1/categories?collection=${collection}`)
      .then(c => setCategories(c || []))
  }, [collection])

  /* ======================
     Sync URL → State
  ====================== */
  useEffect(() => {
    const p = new URLSearchParams(location.search)
    startTransition(() => {
      setCategory(p.get("category"))
      setCollection(p.get("collection"))
      setSearch(p.get("search") || "")
    })
  }, [location.search])

  /* ======================
     Invalidate invalid category when collection changes
  ====================== */
  useEffect(() => {
    if (!collection || !category) return

    // Si la categoría actual no pertenece a la colección → la limpiamos
    if (!categories.some(c => c.slug === category)) {
      setCategory(null)
    }
  }, [collection, categories, category])

  /* ======================
     Load products
  ====================== */
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

  /* ======================
     Reset page on filter change
  ====================== */
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      <Navbar onCartClick={() => setCartOpen(true)} />

      <main className="relative max-w-7xl mx-auto px-6 pt-24 pb-24">
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
            setCategory(null) // limpieza inmediata
          }}
          onStockFilterChange={setInStock}
          onClearFilters={clearFilters}
        />

        <AnimatePresence mode="wait">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>
          ) : (
            <ProductGrid
              products={products}
              onNavigate={(id) => navigate(`/producto/${id}`)}
              onClearFilters={clearFilters}
            />
          )}
        </AnimatePresence>

        {totalPages > 1 && (
          <div className="flex justify-center gap-4 mt-12">
            <Button disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft /> Anterior
            </Button>
            <span>{page} / {totalPages}</span>
            <Button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
              Siguiente <ChevronRight />
            </Button>
          </div>
        )}
      </main>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  )
}

export default Catalog
