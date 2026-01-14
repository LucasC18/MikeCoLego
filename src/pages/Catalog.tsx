import { useCallback, useEffect, useState, useTransition } from "react"
import { motion } from "framer-motion"
import Navbar from "@/components/Navbar"
import SearchBar from "@/components/SearchBar"
import Filters from "@/components/Filters"
import ProductGrid from "@/components/ProductGrid"
import CartDrawer from "@/components/CartDrawer"
import { apiFetch } from "@/config/api"
import { Product } from "@/types/product"
import { useSearchParams } from "react-router-dom"

const PRODUCTS_PER_PAGE = 24

type Category = {
  id: string
  name: string
  slug: string
}

type Collection = {
  id: string
  name: string
  slug: string
}

type QueryParams = {
  category?: string
  collection?: string
}

const Catalog = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const [categories, setCategories] = useState<Category[]>([])
  const [collections, setCollections] = useState<Collection[]>([])

  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null)
  const [showOnlyInStock, setShowOnlyInStock] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [, startTransition] = useTransition()

  const [searchParams, setSearchParams] = useSearchParams()

  const categoryFromUrl = searchParams.get("category")
  const collectionFromUrl = searchParams.get("collection")

  /* Debounce */
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedQuery(searchQuery)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(id)
  }, [searchQuery])

  /* Cargar categorías y colecciones */
  useEffect(() => {
    apiFetch<Category[]>("/v1/categories").then(setCategories).catch(() => setCategories([]))
    apiFetch<Collection[]>("/v1/collections").then(setCollections).catch(() => setCollections([]))
  }, [])

  /* Sync URL → state */
  useEffect(() => {
    setSelectedCategory(categoryFromUrl)
    setSelectedCollection(collectionFromUrl)
    setCurrentPage(1)
  }, [categoryFromUrl, collectionFromUrl])

  /* Fetch productos */
  useEffect(() => {
    const load = async () => {
      setIsLoading(true)

      const params = new URLSearchParams()

      if (selectedCategory) params.set("category", selectedCategory)
      if (selectedCollection) params.set("collection", selectedCollection)
      if (debouncedQuery) params.set("search", debouncedQuery)
      if (showOnlyInStock) params.set("inStock", "true")

      params.set("page", String(currentPage))
      params.set("limit", String(PRODUCTS_PER_PAGE))

      try {
        const res = await apiFetch<{ items: Product[]; total: number }>(
          `/v1/products?${params.toString()}`
        )
        setProducts(res.items)
        setTotal(res.total)
      } catch {
        setProducts([])
        setTotal(0)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [selectedCategory, selectedCollection, debouncedQuery, showOnlyInStock, currentPage])

  /* Utils */
  const buildQuery = (category: string | null, collection: string | null): QueryParams => {
    const q: QueryParams = {}
    if (category) q.category = category
    if (collection) q.collection = collection
    return q
  }

  /* Handlers */
  const handleCategoryChange = useCallback(
    (slug: string | null) => {
      startTransition(() => {
        setSelectedCategory(slug)
        setCurrentPage(1)
      })

      setSearchParams(buildQuery(slug, selectedCollection))
    },
    [selectedCollection, setSearchParams]
  )

  const handleCollectionChange = useCallback(
    (slug: string | null) => {
      startTransition(() => {
        setSelectedCollection(slug)
        setCurrentPage(1)
      })

      setSearchParams(buildQuery(selectedCategory, slug))
    },
    [selectedCategory, setSearchParams]
  )

  const handleClearFilters = useCallback(() => {
    setSearchQuery("")
    setDebouncedQuery("")
    setSelectedCategory(null)
    setSelectedCollection(null)
    setShowOnlyInStock(false)
    setCurrentPage(1)
    setSearchParams({})
  }, [setSearchParams])

  const totalPages = Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE))

  return (
    <div className="min-h-screen bg-background">
      <Navbar onCartClick={() => setIsCartOpen(true)} />

      <main className="container mx-auto px-4 pt-28 pb-20">
        <motion.div className="text-center mb-8">
          <h1 className="text-4xl font-bold">Catálogo</h1>
          <p className="text-sm text-muted-foreground">{total} productos</p>
        </motion.div>

        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        <Filters
          categories={categories}
          collections={collections}
          selectedCategory={selectedCategory}
          selectedCollection={selectedCollection}
          onCategoryChange={handleCategoryChange}
          onCollectionChange={handleCollectionChange}
          showOnlyInStock={showOnlyInStock}
          onStockFilterChange={(value) => {
            startTransition(() => {
              setShowOnlyInStock(value)
              setCurrentPage(1)
            })
          }}
          onClearFilters={handleClearFilters}
        />

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <ProductGrid products={products} onClearFilters={handleClearFilters} />
        )}

        <div className="flex justify-center items-center gap-6 mt-10">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="px-4 py-2 bg-card rounded disabled:opacity-50"
          >
            ←
          </button>
          <span>
            {currentPage} / {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-4 py-2 bg-card rounded disabled:opacity-50"
          >
            →
          </button>
        </div>
      </main>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  )
}

export default Catalog
