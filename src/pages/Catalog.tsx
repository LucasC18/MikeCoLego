import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Navbar from "@/components/Navbar"
import SearchBar from "@/components/SearchBar"
import Filters from "@/components/Filters"
import ProductGrid from "@/components/ProductGrid"
import CartDrawer from "@/components/CartDrawer"
import { useProducts } from "@/context/ProductContext"
import { Product } from "@/types/product"
import { useSearchParams } from "react-router-dom"

const PRODUCTS_PER_PAGE = 24

// Hook optimizado para detectar móvil con matchMedia
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  )
  
  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)")
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches)
    }
    
    handleChange(mediaQuery)
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])
  
  return isMobile
}

const Catalog = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showOnlyInStock, setShowOnlyInStock] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isPending, startTransition] = useTransition()

  const isMobile = useIsMobile()
  const [searchParams, setSearchParams] = useSearchParams()
  const categoryFromUrl = searchParams.get("category")

  const { products, isLoading } = useProducts()

  /* =======================
     Debounce search mejorado con useTransition
     ======================= */
  useEffect(() => {
    const id = setTimeout(() => {
      startTransition(() => {
        setDebouncedQuery(searchQuery)
      })
    }, 300)
    return () => clearTimeout(id)
  }, [searchQuery])

  /* =======================
     Categories (dinámicas, ordenadas y memoizadas)
     ======================= */
  const categories = useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => {
      if (p.category) set.add(p.category)
    })
    return Array.from(set).sort()
  }, [products])

  /* =======================
     Category toggle optimizado
     ======================= */
  const handleCategoryToggle = useCallback(
    (category: string) => {
      startTransition(() => {
        setSelectedCategories((prev) =>
          prev.includes(category)
            ? prev.filter((c) => c !== category)
            : [...prev, category]
        )
        setCurrentPage(1)
      })
      setSearchParams({})
    },
    [setSearchParams]
  )

  /* =======================
     Clear filters mejorado
     ======================= */
  const handleClearFilters = useCallback(() => {
    startTransition(() => {
      setSearchQuery("")
      setDebouncedQuery("")
      setSelectedCategories([])
      setShowOnlyInStock(false)
      setCurrentPage(1)
    })
    setSearchParams({})
  }, [setSearchParams])

  /* =======================
     Sincronizar categoría desde URL
     ======================= */
  useEffect(() => {
    if (!categoryFromUrl || !categories.length) return
    if (categories.includes(categoryFromUrl)) {
      setSelectedCategories([categoryFromUrl])
      setCurrentPage(1)
    }
  }, [categoryFromUrl, categories])

  /* =======================
     Filtrado de productos optimizado
     ======================= */
  const filteredProducts = useMemo(() => {
    const query = debouncedQuery.trim().toLowerCase()

    return products.filter((product: Product) => {
      if (!product?.name) return false

      // Early returns para mejor performance
      if (showOnlyInStock && !product.inStock) return false
      if (selectedCategories.length > 0 && !selectedCategories.includes(product.category || "")) return false
      if (query && !product.name.toLowerCase().includes(query)) return false

      return true
    })
  }, [products, debouncedQuery, selectedCategories, showOnlyInStock])

  /* =======================
     Reset automático de página inválida
     ======================= */
  useEffect(() => {
    const maxPage = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE)
    if (maxPage > 0 && currentPage > maxPage) {
      setCurrentPage(1)
    }
  }, [filteredProducts.length, currentPage])

  /* =======================
     Paginación mejorada
     ======================= */
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE))

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE
    return filteredProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE)
  }, [filteredProducts, currentPage])

  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = []

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      
      if (currentPage > 3) pages.push("...")
      
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      if (currentPage < totalPages - 2) pages.push("...")
      pages.push(totalPages)
    }

    return pages
  }, [totalPages, currentPage])

  /* =======================
     Handlers de paginación con scroll suave
     ======================= */
  const handlePageChange = useCallback((page: number) => {
    startTransition(() => {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }, [])

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1)
    }
  }, [currentPage, totalPages, handlePageChange])

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1)
    }
  }, [currentPage, handlePageChange])

  /* =======================
     Skeleton con animación escalonada
     ======================= */
  const SkeletonGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: PRODUCTS_PER_PAGE }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.03 }}
          className="animate-pulse bg-gray-200 h-64 rounded-lg"
        />
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar onCartClick={() => setIsCartOpen(true)} />

      <main className="container mx-auto px-4 pt-28 pb-20 bg-grid min-h-screen">
        {/* Header con contador animado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: isMobile ? 0.3 : 0.5 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            <span className="text-foreground">Catálogo </span>
            <span className="text-gradient">Completo</span>
          </h1>
          
          {/* Contador de productos con animación */}
          <AnimatePresence mode="wait">
            <motion.p
              key={filteredProducts.length}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="text-sm text-muted-foreground"
            >
              {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'} 
              {selectedCategories.length > 0 && ` en ${selectedCategories.join(', ')}`}
            </motion.p>
          </AnimatePresence>
        </motion.div>

        {/* Búsqueda y filtros */}
        <div className="space-y-6 mb-10">
          <div className="flex justify-center">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
          
          <Filters
            selectedCategories={selectedCategories}
            onCategoryToggle={handleCategoryToggle}
            showOnlyInStock={showOnlyInStock}
            onStockFilterChange={(value) => {
              startTransition(() => {
                setShowOnlyInStock(value)
                setCurrentPage(1)
              })
            }}
            categories={categories}
          />
        </div>

        {/* Indicador de carga en transición */}
        {isPending && (
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Grid de productos */}
        {isLoading ? (
          <SkeletonGrid />
        ) : (
          <ProductGrid
            products={paginatedProducts}
            onClearFilters={handleClearFilters}
          />
        )}

        {/* Paginación mejorada con accesibilidad */}
        {!isLoading && filteredProducts.length > PRODUCTS_PER_PAGE && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12"
          >
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg bg-card border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent transition-colors"
              aria-label="Página anterior"
            >
              ← Anterior
            </button>

            <div className="flex gap-2 flex-wrap justify-center">
              {pageNumbers.map((page, idx) => (
                <button
                  key={idx}
                  onClick={() => typeof page === 'number' && handlePageChange(page)}
                  disabled={page === "..." || page === currentPage}
                  className={`min-w-[40px] h-10 rounded-lg border transition-all ${
                    page === currentPage
                      ? 'bg-primary text-primary-foreground border-primary font-semibold'
                      : page === "..."
                      ? 'border-transparent cursor-default'
                      : 'bg-card border-border hover:bg-accent hover:border-primary'
                  }`}
                  aria-label={typeof page === 'number' ? `Ir a página ${page}` : undefined}
                  aria-current={page === currentPage ? 'page' : undefined}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg bg-card border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent transition-colors"
              aria-label="Página siguiente"
            >
              Siguiente →
            </button>
          </motion.div>
        )}

        {/* Info de página actual */}
        {!isLoading && filteredProducts.length > PRODUCTS_PER_PAGE && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            Página {currentPage} de {totalPages}
          </p>
        )}
      </main>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  )
}

export default Catalog