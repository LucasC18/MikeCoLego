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

const Catalog = () => {
  const navigate = useNavigate()

  const [products, setProducts] = useState<Product[]>([])
  const [allFilteredProducts, setAllFilteredProducts] = useState<Product[]>([])
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
    apiFetch<Category[]>("/v1/categories").then(setCategories)
    apiFetch<Collection[]>("/v1/collections").then(setCollections)
  }, [])

  /* ======================= FILTER PARAMS ======================= */
  const buildParams = (withPaging: boolean) => {
    const params = new URLSearchParams()

    if (selectedCategory) params.set("category", selectedCategory)
    if (selectedCollection) params.set("collection", selectedCollection)
    if (debouncedQuery) params.set("search", debouncedQuery)
    if (showOnlyInStock) params.set("inStock", "true")

    if (withPaging) {
      params.set("page", String(currentPage))
      params.set("limit", String(PRODUCTS_PER_PAGE))
    }

    return params.toString()
  }

  /* ======================= LOAD PRODUCTS (PAGE) ======================= */
  useEffect(() => {
    setIsLoading(true)

    apiFetch<{ items: Product[]; total: number }>(
      `/v1/products?${buildParams(true)}`
    )
      .then((res) => {
        setProducts(res.items)
        setTotal(res.total)
      })
      .finally(() => setIsLoading(false))
  }, [selectedCategory, selectedCollection, debouncedQuery, showOnlyInStock, currentPage])

  /* ======================= LOAD PRODUCTS (FOR FILTERS) ======================= */
  useEffect(() => {
    apiFetch<{ items: Product[] }>(`/v1/products?${buildParams(false)}`)
      .then((res) => setAllFilteredProducts(res.items))
  }, [selectedCategory, selectedCollection, debouncedQuery, showOnlyInStock])

  const totalPages = Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE))

  /* ======================= FILTERS ======================= */
  const visibleCollections = collections.filter((col) =>
    allFilteredProducts.some((p) => p.collection === col.slug)
  )

  const visibleCategories = categories.filter((cat) =>
    allFilteredProducts.some((p) => p.category === cat.slug)
  )

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
          categories={visibleCategories}
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
            <motion.div className="text-center py-20">Cargando…</motion.div>
          ) : (
            <ProductGrid
              products={products}
              onClearFilters={handleClearFilters}
              onNavigate={handleNavigateToProduct}
            />
          )}
        </AnimatePresence>

        {totalPages > 1 && (
          <motion.div className="flex justify-center gap-2 mt-12">
            <Button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
              <ChevronLeft />
            </Button>
            <span>{currentPage} / {totalPages}</span>
            <Button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>
              <ChevronRight />
            </Button>
          </motion.div>
        )}
      </main>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  )
}

export default Catalog
