import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import SearchBar from "@/components/SearchBar";
import Filters from "@/components/Filters";
import ProductGrid from "@/components/ProductGrid";
import CartDrawer from "@/components/CartDrawer";
import { useProducts } from "@/context/ProductContext";
import { Product } from "@/types/product";

const PRODUCTS_PER_PAGE = 24;

const Catalog = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showOnlyInStock, setShowOnlyInStock] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

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
     Category toggle
     ======================= */
  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  /* =======================
     Filtered products (optimized)
     ======================= */
  const filteredProducts = useMemo(() => {
    const query = debouncedQuery.trim().toLowerCase();

    return products.filter((product: Product) => {
      const matchesSearch =
        query === "" || product.name.toLowerCase().includes(query);

      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(product.category);

      const matchesStock = !showOnlyInStock || product.inStock;

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, debouncedQuery, selectedCategories, showOnlyInStock]);

  useEffect(() => {
  setCurrentPage(1);
}, [debouncedQuery, selectedCategories, showOnlyInStock]);


  /* =======================
     Pagination
     ======================= */
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(
      startIndex,
      startIndex + PRODUCTS_PER_PAGE
    );
  }, [filteredProducts, currentPage]);

  /* =======================
     Generate page numbers for pagination
     ======================= */
  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 5) {
      // Show all pages if 5 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Show ellipsis if there's a gap before the current range
      if (currentPage > 3) {
        pages.push("...");
      }

      // Show pages around current page (current -1, current, current +1)
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Show ellipsis if there's a gap after the current range
      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  /* =======================
     Handlers
     ======================= */
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleStockFilterChange = (value: boolean) => {
    setShowOnlyInStock(value);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onCartClick={() => setIsCartOpen(true)} />

      <main className="container mx-auto px-4 pt-28 pb-20 bg-grid min-h-screen">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            <span className="text-foreground">Catálogo </span>
            <span className="text-gradient">Completo</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Explorá toda nuestra colección de personajes. Usá los filtros para
            encontrar exactamente lo que buscás.
          </p>
        </motion.div>

        {/* Search and Filters */}
        <div className="space-y-6 mb-10">
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <p className="text-muted-foreground text-sm">
            {isLoading ? (
              "Cargando productos..."
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

        {/* Product Grid */}
        <ProductGrid
          products={paginatedProducts}
          onClearFilters={() => {
            setSearchQuery("");
            setSelectedCategories([]);
            setShowOnlyInStock(false);
          }}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 flex flex-col items-center gap-4"
          >
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border border-border bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>

              <div className="flex gap-1">
                {generatePageNumbers().map((page, index) => {
                  if (page === "...") {
                    return (
                      <span key={`ellipsis-${index}`} className="px-3 py-2 text-muted-foreground">
                        ...
                      </span>
                    );
                  }

                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page as number)}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        currentPage === page
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border bg-background hover:bg-accent"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg border border-border bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
              </button>
            </div>

            <p className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </p>
          </motion.div>
        )}
      </main>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

export default Catalog;