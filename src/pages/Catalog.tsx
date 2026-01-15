import { useEffect, useState, useTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"

import Navbar from "@/components/Navbar"
import SearchBar from "@/components/SearchBar"
import Filters from "@/components/Filters"
import ProductGrid from "@/components/ProductGrid"
import CartDrawer from "@/components/CartDrawer"

import { apiFetch } from "@/config/api"
import { Product } from "@/types/product"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

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

/* ======================= PAGINATION ======================= */

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  isLoading: boolean
}

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  isLoading,
}: PaginationProps) => (
  <motion.div className="flex justify-center gap-2 mt-12">
    <Button
      disabled={currentPage === 1 || isLoading}
      onClick={() => onPageChange(currentPage - 1)}
    >
      <ChevronLeft />
    </Button>

    <span className="px-4 py-2 font-semibold">
      {currentPage} / {totalPages}
    </span>

    <Button
      disabled={currentPage === totalPages || isLoading}
      onClick={() => onPageChange(currentPage + 1)}
    >
      <ChevronRight />
    </Button>
  </motion.div>
)

/* ======================= MAIN ======================= */

const Catalog = () => {
  const navigate = useNavigate()

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

  /* ======================= NAVIGATION ======================= */

  const handleNavigateToProduct = (id: string) => {
    navigate(`/producto/${id}`)
  }

  /* ======================= DEBOUNCE ======================= */

  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedQuery(searchQuery)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(id)
  }, [searchQuery])

  /* ======================= LOAD META ======================= */

  useEffect(() => {
    apiFetch<Category[]>("/v1/categories")
      .then(setCategories)
      .catch(() => setCategories([]))

    apiFetch<Collection[]>("/v1/collections")
      .then(setCollections)
      .catch(() => setCollections([]))
  }, [])

  /* ======================= LOAD PRODUCTS ======================= */

  useEffect(() => {
    const params = new URLSearchParams()

    if (selectedCategory) params.set("category", selectedCategory)
    if (selectedCollection) params.set("collection", selectedCollection)
    if (debouncedQuery) params.set("search", debouncedQuery)
    if (showOnlyInStock) params.set("inStock", "true")

    params.set("page", String(currentPage))
    params.set("limit", String(PRODUCTS_PER_PAGE))

    setIsLoading(true)

    apiFetch<{ items: Product[]; total: number }>(
      `/v1/products?${params.toString()}`
    )
      .then((res) => {
        setProducts(res.items)
        setTotal(res.total)
      })
      .catch(() => {
        setProducts([])
        setTotal(0)
      })
      .finally(() => setIsLoading(false))
  }, [selectedCategory, selectedCollection, debouncedQuery, showOnlyInStock, currentPage])

  const totalPages = Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE))

  /* ======================= FILTER LOGIC ======================= */

  const visibleCollections = collections.filter((col) =>
    products.some((p) => p.collection === col.slug)
  )

  const visibleCategories = categories.filter((cat) =>
    products.some((p) => p.category === cat.slug)
  )

  const filteredCategories =
    selectedCollection === "star-wars"
      ? visibleCategories
      : visibleCategories.filter((c) => c.slug !== "hasbro-375")

  /* ======================= HANDLERS ======================= */

  const handleCategoryChange = (slug: string | null) => {
    startTransition(() => {
      setSelectedCategory(slug)
      setCurrentPage(1)
    })
  }

  const handleCollectionChange = (slug: string | null) => {
    startTransition(() => {
      setSelectedCollection(slug)
      setSelectedCategory(null)
      setCurrentPage(1)
    })
  }

  const handleClearFilters = () => {
    setSearchQuery("")
    setDebouncedQuery("")
    setSelectedCategory(null)
    setSelectedCollection(null)
    setShowOnlyInStock(false)
    setCurrentPage(1)
  }

  /* ======================= UI ======================= */

  return (
    <div className="min-h-screen bg-background">
      <Navbar onCartClick={() => setIsCartOpen(true)} />
      <div className="h-20" />

      <main className="container mx-auto px-4 pt-10 pb-20">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        <Filters
          collections={visibleCollections}
          categories={filteredCategories}
          selectedCategory={selectedCategory}
          selectedCollection={selectedCollection}
          onCategoryChange={handleCategoryChange}
          onCollectionChange={handleCollectionChange}
          showOnlyInStock={showOnlyInStock}
          onStockFilterChange={setShowOnlyInStock}
          onClearFilters={handleClearFilters}
        />

        <div className="my-6">
          <Badge>{total} productos</Badge>
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              className="text-center py-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Cargando…
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ProductGrid
                products={products}
                onClearFilters={handleClearFilters}
                onNavigate={handleNavigateToProduct}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {!isLoading && totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
          />
        )}
      </main>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  )
}

export default Catalog
