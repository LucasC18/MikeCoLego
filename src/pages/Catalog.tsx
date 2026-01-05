import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import SearchBar from "@/components/SearchBar";
import Filters from "@/components/Filters";
import ProductGrid from "@/components/ProductGrid";
import CartDrawer from "@/components/CartDrawer";
import { useProducts } from "@/context/ProductContext";
import { Product } from "@/types/product";
import { useSearchParams } from "react-router-dom";

const PRODUCTS_PER_PAGE = 24;



// Hook personalizado para detectar móvil (para optimizaciones)
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  return isMobile;
};

const Catalog = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showOnlyInStock, setShowOnlyInStock] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const isMobile = useIsMobile(); // Detectar móvil para ajustesÇ
  const [searchParams, setSearchParams] = useSearchParams();

  const categoryFromUrl = searchParams.get("category");
    


  /* =======================
     Products from context
     ======================= */
  const { products, isLoading } = useProducts();

  /* =======================
     Debounce search (performance)
     ======================= */
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(id);
  }, [searchQuery]);

  /* =======================
     Categories (dynamic)
     ======================= */
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  /* =======================
     Category toggle (memoized)
     ======================= */
const handleCategoryToggle = useCallback((category: string) => {
  setSelectedCategories((prev) =>
    prev.includes(category)
      ? prev.filter((c) => c !== category)
      : [...prev, category]
  );

  // 🔥 limpiar la URL cuando el usuario interactúa manualmente
  setSearchParams({});

  console.log(`Categoría toggled: ${category}`);
}, [setSearchParams]);


    useEffect(() => {
  if (!categoryFromUrl) return;

  setSelectedCategories([categoryFromUrl]);
  setCurrentPage(1);
}, [categoryFromUrl]);


  /* =======================
     Filtered products (optimized with error handling)
     ======================= */
  const filteredProducts = useMemo(() => {
    try {
      const query = debouncedQuery.trim().toLowerCase();
      return products.filter((product: Product) => {
        if (!product || typeof product.name !== "string") return false; // Fallback si datos corruptos
        const matchesSearch =
          query === "" || product.name.toLowerCase().includes(query);
        const matchesCategory =
          selectedCategories.length === 0 ||
          selectedCategories.includes(product.category || "");
        const matchesStock = !showOnlyInStock || product.inStock;
        return matchesSearch && matchesCategory && matchesStock;
      });
    } catch (error) {
      console.error("Error filtrando productos:", error);
      return []; // Fallback vacío
    }
  }, [products, debouncedQuery, selectedCategories, showOnlyInStock]);

  /* =======================
     Reset page only if current page is invalid after filtering
     ======================= */
  useEffect(() => {
    if (currentPage > Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE)) {
      setCurrentPage(1);
    }
  }, [filteredProducts, currentPage]);

  /* =======================
     Pagination
     ======================= */
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  /* =======================
     Generate page numbers for pagination
     ======================= */
  const generatePageNumbers = useCallback(() => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, currentPage]);

  /* =======================
     Handlers (memoized)
     ======================= */
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleStockFilterChange = useCallback((value: boolean) => {
    setShowOnlyInStock(value);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    console.log(`Cambiando a página: ${page} (Móvil: ${isMobile})`); // Log extendido
    setCurrentPage(page);
  }, [isMobile]);

  // Skeleton loader para móviles
  const SkeletonGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: PRODUCTS_PER_PAGE }).map((_, i) => (
        <div key={i} className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar onCartClick={() => setIsCartOpen(true)} />

      <main className="container mx-auto px-4 pt-28 pb-20 bg-grid min-h-screen">
        {/* Header (responsive) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: isMobile ? 0.3 : 0.5 }} // Menos animación en móvil
          className="text-center mb-8 sm:mb-12"
        >
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            <span className="text-foreground">Catálogo </span>
            <span className="text-gradient">Completo</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            Explorá toda nuestra colección de personajes. Usá los filtros para
            encontrar exactamente lo que buscás.
          </p>
        </motion.div>

        {/* Search and Filters */}
        <div className="space-y-4 sm:space-y-6 mb-8 sm:mb-10">
          <div className="flex justify-center">
            <SearchBar value={searchQuery} onChange={handleSearchChange} />
          </div>
          <Filters
            selectedCategories={selectedCategories}
            onCategoryToggle={handleCategoryToggle}
            showOnlyInStock={showOnlyInStock}
            onStockFilterChange={handleStockFilterChange}
            categories={categories}
          />
        </div>

        {/* Results count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6"
        >
          <p className="text-muted-foreground text-sm">
            {isLoading ? (
              "Cargando productos..."
            ) : filteredProducts.length === 0 ? (
              "No se encontraron productos. Intentá ajustar los filtros."
            ) : (
              <>
                Mostrando{" "}
                <span className="text-primary font-semibold">
                  {filteredProducts.length}
                </span>{" "}
                de{" "}
                <span className="text-primary font-semibold">
                  {products.length}
                </span>{" "}
                productos
              </>
            )}
          </p>
        </motion.div>

        {/* Product Grid (con skeleton) */}
        {isLoading ? (
          <SkeletonGrid />
        ) : (
          <ProductGrid
            products={paginatedProducts}
            onClearFilters={() => {
              setSearchQuery("");
              setSelectedCategories([]);
              setShowOnlyInStock(false);
              setCurrentPage(1);
            }}
          />
        )}

        {/* Pagination (responsive y táctil) */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: isMobile ? 0.3 : 0.5 }}
            className="mt-12 flex flex-col items-center gap-4"
          >
            <div className="flex flex-wrap items-center gap-2 justify-center">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg border border-border bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
                aria-label="Página anterior"
              >
                Anterior
              </button>

              <div className="flex gap-1 flex-wrap">
                {generatePageNumbers().map((page, index) => {
                  if (page === "...") {
                    return (
                      <span
                        key={`ellipsis-${index}`}
                        className="px-3 py-2 text-muted-foreground"
                      >
                        ...
                      </span>
                    );
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page as number)}
                      className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg border transition-colors touch-manipulation ${
                        currentPage === page
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border bg-background hover:bg-accent"
                      }`}
                      aria-label={`Ir a página ${page}`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() =>
                  handlePageChange(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg border border-border bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
                aria-label="Página siguiente"
              >
                Siguiente
              </button>
            </div>

            <p className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </p>

            {/* Botón extra para móviles largos */}
            {isMobile && (
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="mt-4 px-6 py-3 bg-primary text-primary-foreground rounded-lg touch-manipulation"
                aria-label="Volver al inicio"
              >
                ↑ Volver al inicio
              </button>
            )}
          </motion.div>
        )}
      </main>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

export default Catalog;