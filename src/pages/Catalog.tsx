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
interface Category {
  id: string
  name: string
  slug: string
}

interface Collection {
  id: string
  name: string
  slug: string
}

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

/* ================================
   CONSTANTS
================================ */
const PRODUCTS_PER_PAGE = 24
const METADATA_LIMIT = 100000
const DEBOUNCE_DELAY = 300
const NAVBAR_HEIGHT = 80

/* ================================
   HELPERS
================================ */
const buildQueryParams = (filters: Partial<FilterState>, withPaging = true) => {
  const p = new URLSearchParams()

  if (filters.category) p.set("category", filters.category)
  if (filters.collection) p.set("collection", filters.collection)
  if (filters.search) p.set("search", filters.search)
  if (filters.inStock) p.set("inStock", "true")

  if (withPaging) {
    p.set("page", String(filters.page ?? 1))
    p.set("limit", String(PRODUCTS_PER_PAGE))
  } else {
    p.set("page", "1")
    p.set("limit", String(METADATA_LIMIT))
  }

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
   PRODUCTS
================================ */
const useProducts = (filters: FilterState) => {
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    apiFetch<ProductsApiResponse>(`/v1/products?${buildQueryParams(filters, true)}`)
      .then(r => {
        setProducts(r.items || [])
        setTotal(r.total || 0)
      })
      .finally(() => setLoading(false))
  }, [filters])

  return { products, total, loading }
}

/* ================================
   CATEGORY SLUGS
   Categories ONLY depend on collection
================================ */
const useCategorySlugs = (filters: {
  collection: string | null
  search: string
  inStock: boolean
}) => {
  const [slugs, setSlugs] = useState<Set<string>>(new Set())

  useEffect(() => {
    apiFetch<ProductsApiResponse>(
      `/v1/products?${buildQueryParams(filters, false)}`
    ).then(r => {
      const s = new Set<string>()
      for (const p of r.items || []) {
        if (p.categorySlug) s.add(p.categorySlug)
      }
      setSlugs(s)
    })
  }, [filters.collection, filters.search, filters.inStock])

  return slugs
}


/* ================================
   COLLECTION SLUGS
   Collections depend on category + search + stock
================================ */
const useCollectionSlugs = (filters: {
  category: string | null
  search: string
  inStock: boolean
}) => {
  const [slugs, setSlugs] = useState<Set<string>>(new Set())

  useEffect(() => {
    apiFetch<ProductsApiResponse>(
      `/v1/products?${buildQueryParams(filters, false)}`
    ).then(r => {
      const s = new Set<string>()
      for (const p of r.items || []) {
        if (p.collectionSlug) s.add(p.collectionSlug)
      }
      setSlugs(s)
    })
  }, [filters.category, filters.search, filters.inStock])

  return slugs
}

/* ================================
   STATIC METADATA
================================ */
const useMetadata = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [collections, setCollections] = useState<Collection[]>([])

  useEffect(() => {
    Promise.all([
      apiFetch<Category[]>("/v1/categories"),
      apiFetch<Collection[]>("/v1/collections"),
    ]).then(([cats, cols]) => {
      setCategories(cats || [])
      setCollections(cols || [])
    })
  }, [])

  return { categories, collections }
}

/* ================================
   COMPONENT
================================ */
const Catalog = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [, startTransition] = useTransition()

  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<string | null>(null)
  const [collection, setCollection] = useState<string | null>(null)
  const [inStock, setInStock] = useState(false)
  const [page, setPage] = useState(1)
  const [cartOpen, setCartOpen] = useState(false)

  const debouncedSearch = useDebounce(search, DEBOUNCE_DELAY)

  const filters = useMemo<FilterState>(
    () => ({ category, collection, search: debouncedSearch, inStock, page }),
    [category, collection, debouncedSearch, inStock, page]
  )

  const { products, total, loading } = useProducts(filters)
  const { categories, collections } = useMetadata()

const categorySlugs = useCategorySlugs({
  collection,
  search: debouncedSearch,
  inStock,
})


  const collectionSlugs = useCollectionSlugs({
    category,
    search: debouncedSearch,
    inStock,
  })

  const categoriesFiltered = useMemo(
    () => categories.filter(c => categorySlugs.has(c.slug)),
    [categories, categorySlugs]
  )

  const collectionsFiltered = useMemo(
    () => collections.filter(c => collectionSlugs.has(c.slug)),
    [collections, collectionSlugs]
  )

  const totalPages = Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE))

  useEffect(() => {
    const p = new URLSearchParams(location.search)
    startTransition(() => {
      setCategory(p.get("category"))
      setCollection(p.get("collection"))
      setSearch(p.get("search") || "")
      setPage(1)
    })
  }, [location.search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, category, collection, inStock])

  const clearFilters = () => {
    setSearch("")
    setCategory(null)
    setCollection(null)
    setInStock(false)
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar onCartClick={() => setCartOpen(true)} />
      <div style={{ height: NAVBAR_HEIGHT }} />

      <main className="max-w-7xl mx-auto px-6 pt-10 pb-24">
        <SearchBar value={search} onChange={setSearch} />

        <Filters
          categories={categoriesFiltered}
          collections={collectionsFiltered}
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

        <Badge>{total} productos</Badge>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div className="flex justify-center py-32">
              <Loader2 className="w-12 h-12 animate-spin" />
            </motion.div>
          ) : (
            <ProductGrid
              products={products}
              onNavigate={(id) => navigate(`/producto/${id}`)}
              onClearFilters={clearFilters}
            />
          )}
        </AnimatePresence>

        {totalPages > 1 && (
          <div className="flex justify-center gap-6 mt-10">
            <Button disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft />
            </Button>
            <span>{page} / {totalPages}</span>
            <Button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight />
            </Button>
          </div>
        )}
      </main>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  )
}

export default Catalog
