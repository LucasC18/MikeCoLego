import { useEffect, useMemo, useState, useTransition, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";

import Navbar from "@/components/Navbar";
import SearchBar from "@/components/SearchBar";
import Filters from "@/components/Filters";
import ProductGrid from "@/components/ProductGrid";
import CartDrawer from "@/components/CartDrawer";

import { apiFetch } from "@/config/api";
import { Product } from "@/types/product";

import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/* ================================
   TYPES & INTERFACES
================================= */
interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

interface ProductsApiResponse {
  items: Product[];
  total: number;
  page?: number;
  limit?: number;
}

interface ApiError extends Error {
  status?: number;
  code?: string;
}

interface FilterState {
  category: string | null;
  collection: string | null;
  search: string;
  inStock: boolean;
  page: number;
}

/* ================================
   CONSTANTS
================================= */
const PRODUCTS_PER_PAGE = 24;
const FILTERS_LIMIT = 1000;
const DEBOUNCE_DELAY = 300;
const NAVBAR_HEIGHT = 80;

/* ================================
   HELPERS & UTILITIES
================================= */
const isApiError = (error: unknown): error is ApiError => {
  return error instanceof Error;
};

const extractErrorMessage = (error: unknown): string => {
  if (isApiError(error)) {
    return error.message || "Error al cargar datos";
  }
  if (typeof error === "string") {
    return error;
  }
  return "Error desconocido";
};

const getSafeAreaStyle = (): React.CSSProperties => {
  return {
    paddingTop: "env(safe-area-inset-top)",
    paddingBottom: "env(safe-area-inset-bottom)",
    paddingLeft: "env(safe-area-inset-left)",
    paddingRight: "env(safe-area-inset-right)",
  };
};

const buildQueryParams = (filters: FilterState, withPaging: boolean): string => {
  const params = new URLSearchParams();

  if (filters.category) params.set("category", filters.category);
  if (filters.collection) params.set("collection", filters.collection);
  if (filters.search) params.set("search", filters.search);
  if (filters.inStock) params.set("inStock", "true");

  if (withPaging) {
    params.set("page", String(filters.page));
    params.set("limit", String(PRODUCTS_PER_PAGE));
  } else {
    params.set("limit", String(FILTERS_LIMIT));
    params.set("page", "1");
  }

  return params.toString();
};

const scrollToTop = (smooth: boolean = true): void => {
  window.scrollTo({
    top: 0,
    behavior: smooth ? "smooth" : "auto",
  });
};

/* ================================
   CUSTOM HOOKS
================================= */
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const useMetadata = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setIsLoading(true);

      try {
        const [categoriesData, collectionsData] = await Promise.all([
          apiFetch<Category[]>("/v1/categories", {
            signal: abortControllerRef.current.signal,
          }),
          apiFetch<Collection[]>("/v1/collections", {
            signal: abortControllerRef.current.signal,
          }),
        ]);

        setCategories(categoriesData || []);
        setCollections(collectionsData || []);
      } catch (err: unknown) {
        if (isApiError(err) && err.name === "AbortError") {
          return;
        }
        setCategories([]);
        setCollections([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetadata();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { categories, collections, isLoading };
};

const useProducts = (filters: FilterState) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchProducts = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      const queryString = buildQueryParams(filters, true);
      const response = await apiFetch<ProductsApiResponse>(
        `/v1/products?${queryString}`,
        {
          signal: abortControllerRef.current.signal,
        }
      );

      setProducts(response.items || []);
      setTotal(response.total || 0);
    } catch (err: unknown) {
      if (isApiError(err) && err.name === "AbortError") {
        return;
      }
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
      setProducts([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchProducts]);

  return { products, total, isLoading, error, refetch: fetchProducts };
};

const useAllFilteredProducts = (filters: Omit<FilterState, "page">) => {
  const [products, setProducts] = useState<Product[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchProducts = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const queryString = buildQueryParams({ ...filters, page: 1 }, false);
      const response = await apiFetch<ProductsApiResponse>(
        `/v1/products?${queryString}`,
        {
          signal: abortControllerRef.current.signal,
        }
      );

      setProducts(response.items || []);
    } catch (err: unknown) {
      if (isApiError(err) && err.name === "AbortError") {
        return;
      }
      setProducts([]);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchProducts]);

  return products;
};

const useViewportHeight = () => {
  useEffect(() => {
    const updateVh = () => {
      const vh = window.innerHeight;
      document.documentElement.style.setProperty("--vh", `${vh * 0.01}px`);
    };

    updateVh();
    window.addEventListener("resize", updateVh);
    window.addEventListener("orientationchange", updateVh);

    return () => {
      window.removeEventListener("resize", updateVh);
      window.removeEventListener("orientationchange", updateVh);
    };
  }, []);
};

/* ================================
   SUB-COMPONENTS
================================= */
const LoadingState = () => (
  <motion.div
    key="loading"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="flex flex-col items-center justify-center py-32"
  >
    <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
    <p className="text-slate-300 text-xl font-medium">Cargando productos...</p>
  </motion.div>
);

const ProductsContainer = ({
  products,
  onClearFilters,
  onNavigate,
}: {
  products: Product[];
  onClearFilters: () => void;
  onNavigate: (id: string) => void;
}) => (
  <motion.div
    key="products"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
  >
    <ProductGrid
      products={products}
      onClearFilters={onClearFilters}
      onNavigate={onNavigate}
    />
  </motion.div>
);

const ProductCountBadge = ({ count }: { count: number }) => (
  <div className="mb-8 flex justify-center md:justify-start">
    <Badge className="text-base px-4 py-2 bg-slate-800/80 text-slate-200 border-slate-700 shadow-lg">
      {count} {count === 1 ? "producto" : "productos"}
    </Badge>
  </div>
);

const PaginationControls = ({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  const prefersReducedMotion = useReducedMotion();

  const handlePrevious = useCallback(() => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
      scrollToTop(true);
    }
  }, [currentPage, onPageChange]);

  const handleNext = useCallback(() => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
      scrollToTop(true);
    }
  }, [currentPage, totalPages, onPageChange]);

  if (totalPages <= 1) return null;

  return (
    <motion.div
      initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={prefersReducedMotion ? undefined : { duration: 0.4 }}
      className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-16"
    >
      <Button
        disabled={currentPage === 1}
        onClick={handlePrevious}
        className="min-h-[52px] min-w-[52px] px-6 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg touch-manipulation"
        size="lg"
        aria-label="Página anterior"
      >
        <ChevronLeft className="w-6 h-6" />
      </Button>

      <div className="flex items-center gap-3 px-6 py-3 bg-slate-800/80 border border-slate-700 rounded-xl shadow-lg">
        <span className="text-slate-200 font-semibold text-lg">
          Página <span className="text-primary">{currentPage}</span> de {totalPages}
        </span>
      </div>

      <Button
        disabled={currentPage === totalPages}
        onClick={handleNext}
        className="min-h-[52px] min-w-[52px] px-6 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg touch-manipulation"
        size="lg"
        aria-label="Página siguiente"
      >
        <ChevronRight className="w-6 h-6" />
      </Button>
    </motion.div>
  );
};

/* ================================
   MAIN COMPONENT
================================= */
const Catalog = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [showOnlyInStock, setShowOnlyInStock] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, DEBOUNCE_DELAY);
  const { categories, collections } = useMetadata();

  useViewportHeight();

  const filters = useMemo<FilterState>(
    () => ({
      category: selectedCategory,
      collection: selectedCollection,
      search: debouncedSearch,
      inStock: showOnlyInStock,
      page: currentPage,
    }),
    [selectedCategory, selectedCollection, debouncedSearch, showOnlyInStock, currentPage]
  );

  const { products, total, isLoading } = useProducts(filters);

  const allFilteredProducts = useAllFilteredProducts({
    category: selectedCategory,
    collection: selectedCollection,
    search: debouncedSearch,
    inStock: showOnlyInStock,
  });

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE)),
    [total]
  );

  const visibleCollections = useMemo(
    () =>
      collections.filter((col) =>
        allFilteredProducts.some((p) => p.collectionSlug === col.slug)
      ),
    [collections, allFilteredProducts]
  );

  const visibleCategories = useMemo(
    () =>
      categories.filter((cat) =>
        allFilteredProducts.some((p) => p.categorySlug === cat.slug)
      ),
    [categories, allFilteredProducts]
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlCategory = params.get("category");
    const urlCollection = params.get("collection");
    const urlSearch = params.get("search");

    startTransition(() => {
      if (urlCollection !== null) setSelectedCollection(urlCollection || null);
      if (urlCategory !== null) setSelectedCategory(urlCategory || null);
      if (urlSearch !== null) {
        setSearchQuery(urlSearch || "");
      }
      setCurrentPage(1);
    });
  }, [location.search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const handleNavigateToProduct = useCallback(
    (id: string) => {
      navigate(`/producto/${id}`);
    },
    [navigate]
  );

  const handleCategoryChange = useCallback((slug: string | null) => {
    startTransition(() => {
      setSelectedCategory(slug);
      setCurrentPage(1);
    });
  }, []);

  const handleCollectionChange = useCallback((slug: string | null) => {
    startTransition(() => {
      setSelectedCollection(slug);
      setSelectedCategory(null);
      setCurrentPage(1);
    });
  }, []);

  const handleStockFilterChange = useCallback((inStock: boolean) => {
    startTransition(() => {
      setShowOnlyInStock(inStock);
      setCurrentPage(1);
    });
  }, []);

  const handleClearFilters = useCallback(() => {
    startTransition(() => {
      setSearchQuery("");
      setSelectedCategory(null);
      setSelectedCollection(null);
      setShowOnlyInStock(false);
      setCurrentPage(1);
    });
  }, []);

  const handlePageChange = useCallback((page: number) => {
    startTransition(() => {
      setCurrentPage(page);
    });
  }, []);

  const handleCartOpen = useCallback(() => {
    setIsCartOpen(true);
  }, []);

  const handleCartClose = useCallback(() => {
    setIsCartOpen(false);
  }, []);

  return (
    <div
      className="min-h-[100dvh] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"
      style={getSafeAreaStyle()}
    >
      <Navbar onCartClick={handleCartOpen} />
      <div style={{ height: `${NAVBAR_HEIGHT}px` }} />

      <main className="max-w-7xl mx-auto px-6 pt-10 pb-24">
        <div className="mb-10">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>

        <div className="mb-10">
          <Filters
            collections={visibleCollections}
            categories={visibleCategories}
            selectedCategory={selectedCategory}
            selectedCollection={selectedCollection}
            onCategoryChange={handleCategoryChange}
            onCollectionChange={handleCollectionChange}
            showOnlyInStock={showOnlyInStock}
            onStockFilterChange={handleStockFilterChange}
            onClearFilters={handleClearFilters}
          />
        </div>

        <ProductCountBadge count={total} />

        <AnimatePresence mode="wait">
          {isLoading ? (
            <LoadingState />
          ) : (
            <ProductsContainer
              products={products}
              onClearFilters={handleClearFilters}
              onNavigate={handleNavigateToProduct}
            />
          )}
        </AnimatePresence>

        {!isLoading && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </main>

      <CartDrawer isOpen={isCartOpen} onClose={handleCartClose} />
    </div>
  );
};

export default Catalog;