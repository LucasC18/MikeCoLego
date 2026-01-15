import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import { Sparkles, ChevronDown, ArrowRight, Star, Loader2 } from "lucide-react";
import heroImage from "@/assets/hero-starwars.jpg";
import { apiFetch } from "@/config/api";
import { Product } from "@/types/product";
import ProductGrid from "@/components/ProductGrid";

/* ================================
   TYPES & INTERFACES
================================= */
interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

interface FeaturedApiResponse {
  items: Product[];
  total?: number;
  page?: number;
}

interface ApiError extends Error {
  status?: number;
  code?: string;
}

/* ================================
   CONSTANTS
================================= */
const FEATURED_PRODUCTS_LIMIT = 4;
const MAX_VISIBLE_COLLECTIONS = 2;
const SCROLL_BEHAVIOR: ScrollBehavior = "smooth";

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

const getViewportHeight = (): string => {
  return "calc(100dvh - 64px)";
};

const smoothScrollToElement = (elementId: string): void => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const navbarHeight = 64;
  const elementPosition = element.getBoundingClientRect().top + window.scrollY;
  const offsetPosition = elementPosition - navbarHeight;

  window.scrollTo({
    top: offsetPosition,
    behavior: SCROLL_BEHAVIOR,
  });
};

const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
};

const debounce = <T extends (...args: never[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/* ================================
   CUSTOM HOOKS
================================= */
const useCollections = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchCollections = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiFetch<Collection[]>("/v1/collections", {
        signal: abortControllerRef.current.signal,
      });

      setCollections(response || []);
    } catch (err: unknown) {
      if (isApiError(err) && err.name === "AbortError") {
        return;
      }
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
      setCollections([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollections();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchCollections]);

  return { collections, isLoading, error, refetch: fetchCollections };
};

const useFeaturedProducts = (limit: number = FEATURED_PRODUCTS_LIMIT) => {
  const [products, setProducts] = useState<Product[]>([]);
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
      const response = await apiFetch<FeaturedApiResponse>(
        `/v1/products?featured=true&limit=${limit}`,
        {
          signal: abortControllerRef.current.signal,
        }
      );

      setProducts(response.items || []);
    } catch (err: unknown) {
      if (isApiError(err) && err.name === "AbortError") {
        return;
      }
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchProducts();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchProducts]);

  return { products, isLoading, error, refetch: fetchProducts };
};

const useViewportHeight = () => {
  const [vh, setVh] = useState<number>(window.innerHeight);

  useEffect(() => {
    const updateVh = () => {
      const newVh = window.innerHeight;
      setVh(newVh);
      document.documentElement.style.setProperty("--vh", `${newVh * 0.01}px`);
    };

    updateVh();

    const debouncedUpdate = debounce(updateVh, 150);

    window.addEventListener("resize", debouncedUpdate);
    window.addEventListener("orientationchange", updateVh);

    return () => {
      window.removeEventListener("resize", debouncedUpdate);
      window.removeEventListener("orientationchange", updateVh);
    };
  }, []);

  return vh;
};

const useImagePreload = (src: string) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    preloadImage(src)
      .then(() => setIsLoaded(true))
      .catch(() => setIsLoaded(false));
  }, [src]);

  return isLoaded;
};

/* ================================
   SUB-COMPONENTS
================================= */
const HeroBackground = ({ imageSrc }: { imageSrc: string }) => {
  const prefersReducedMotion = useReducedMotion();
  const isImageLoaded = useImagePreload(imageSrc);

  return (
    <motion.div
      initial={prefersReducedMotion ? undefined : { scale: 1.1 }}
      animate={prefersReducedMotion ? undefined : { scale: 1 }}
      transition={prefersReducedMotion ? undefined : { duration: 1.5, ease: "easeOut" }}
      className="absolute inset-0"
    >
      {!isImageLoaded && (
        <div className="absolute inset-0 bg-slate-900 animate-pulse" />
      )}

      <img
        src={imageSrc}
        alt="Hero background"
        className={`w-full h-full object-cover transition-opacity duration-500 ${
          isImageLoaded ? "opacity-100" : "opacity-0"
        }`}
        loading="eager"
        decoding="async"
      />

      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-transparent to-slate-950/70" />
    </motion.div>
  );
};

const HeroBadge = () => (
  <div className="inline-flex items-center gap-2 px-5 py-2.5 glass-card rounded-full mb-8 shadow-lg">
    <Sparkles className="w-5 h-5 text-amber-400 animate-pulse-glow" />
    <span className="text-base font-semibold text-amber-300">
      Colecciones Exclusivas
    </span>
  </div>
);

const HeroTitle = () => (
  <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight">
    <span className="text-slate-100">Jedi</span>
    <span className="text-gradient block sm:inline"> Collector71</span>
  </h1>
);

const HeroDescription = () => (
  <p className="text-slate-300 text-xl md:text-2xl max-w-3xl mx-auto mb-12 leading-relaxed px-4">
    Explorá nuestros personajes organizados por colección. Elegí una y
    encontrá tu próximo favorito.
  </p>
);

const CollectionButtons = ({
  collections,
  isLoading,
}: {
  collections: Collection[];
  isLoading: boolean;
}) => {
  const prefersReducedMotion = useReducedMotion();
  const visibleCollections = useMemo(
    () => collections.slice(0, MAX_VISIBLE_COLLECTIONS),
    [collections]
  );

  if (isLoading) {
    return (
      <div className="flex flex-wrap justify-center gap-4 mb-12 w-full max-w-2xl">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="px-12 py-5 min-h-[56px] min-w-[180px] rounded-xl glass-card animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (collections.length === 0) {
    return null;
  }

  return (
    <motion.div
      className="flex flex-wrap justify-center gap-4 mb-12 w-full max-w-2xl"
      initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={prefersReducedMotion ? undefined : { duration: 0.6, delay: 0.5, ease: "easeOut" }}
    >
      {visibleCollections.map((collection, index) => (
        <motion.div
          key={collection.id}
          initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.9 }}
          animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1 }}
          transition={
            prefersReducedMotion
              ? undefined
              : {
                  duration: 0.4,
                  delay: 0.6 + index * 0.1,
                  ease: "easeOut",
                }
          }
        >
          <Link
            to={`/catalogo?collection=${collection.slug}`}
            className="inline-block px-12 py-5 min-h-[56px] min-w-[180px] rounded-xl font-display font-bold text-lg glass-card neon-border hover-glow text-primary transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl touch-manipulation"
            aria-label={`Ver colección ${collection.name}`}
          >
            {collection.name}
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
};

const FeaturedButton = ({ onClick }: { onClick: () => void }) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.button
      onClick={onClick}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
      className="px-12 py-5 min-h-[56px] min-w-[200px] bg-primary text-primary-foreground font-bold text-lg rounded-xl neon-glow transition-all duration-300 shadow-2xl touch-manipulation"
      aria-label="Ver productos destacados"
    >
      Ver Destacados
    </motion.button>
  );
};

const ScrollIndicator = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className="absolute bottom-8"
      animate={
        prefersReducedMotion
          ? undefined
          : {
              y: [0, 10, 0],
            }
      }
      transition={
        prefersReducedMotion
          ? undefined
          : {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }
      }
    >
      <ChevronDown className="w-8 h-8 text-primary drop-shadow-lg" />
    </motion.div>
  );
};

const LoadingSpinner = ({ message }: { message?: string }) => (
  <div className="text-center py-32">
    <Loader2 className="inline-block w-12 h-12 text-primary animate-spin mb-4" />
    <p className="text-slate-300 text-xl">{message || "Cargando..."}</p>
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="text-center py-32">
    <p className="text-slate-400 text-xl">{message}</p>
  </div>
);

const SectionTitle = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center gap-3 mb-16">
    <Star className="w-7 h-7 text-yellow-400 fill-yellow-400" />
    <h2 className="text-3xl md:text-4xl font-bold text-slate-100 text-center">
      {title}
    </h2>
    <Star className="w-7 h-7 text-yellow-400 fill-yellow-400" />
  </div>
);

const CatalogButton = () => (
  <div className="text-center mt-20">
    <Link
      to="/catalogo"
      className="inline-flex items-center gap-3 px-12 py-5 min-h-[56px] glass-card neon-border rounded-xl font-semibold text-lg text-primary hover-glow transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl touch-manipulation"
      aria-label="Ver catálogo completo de productos"
    >
      Ver Catálogo Completo
      <ArrowRight className="w-5 h-5" />
    </Link>
  </div>
);

const FeaturedSection = ({
  products,
  isLoading,
}: {
  products: Product[];
  isLoading: boolean;
}) => {
  if (isLoading) {
    return <LoadingSpinner message="Cargando productos..." />;
  }

  if (products.length === 0) {
    return <EmptyState message="No hay productos destacados todavía" />;
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-6xl">
        <ProductGrid products={products} />
      </div>
    </div>
  );
};

/* ================================
   MAIN COMPONENT
================================= */
const Home = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const { collections, isLoading: isLoadingCollections } = useCollections();
  const { products: featuredProducts, isLoading: isLoadingFeatured } = useFeaturedProducts();

  useViewportHeight();

  const handleScrollToFeatured = useCallback(() => {
    smoothScrollToElement("featured");
  }, []);

  const handleCartOpen = useCallback(() => {
    setIsCartOpen(true);
  }, []);

  const handleCartClose = useCallback(() => {
    setIsCartOpen(false);
  }, []);

  useEffect(() => {
    preloadImage(heroImage).catch(() => {
      // Silencioso
    });
  }, []);

  return (
    <div
      className="min-h-[100dvh] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"
      style={getSafeAreaStyle()}
    >
      <Navbar onCartClick={handleCartOpen} />

      {/* ================= HERO SECTION ================= */}
      <section
        className="relative flex items-center justify-center overflow-hidden"
        style={{ minHeight: getViewportHeight() }}
      >
        <HeroBackground imageSrc={heroImage} />

        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 py-16 flex flex-col items-center justify-center text-center">
          <motion.div
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 50 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={
              prefersReducedMotion
                ? undefined
                : { duration: 0.8, delay: 0.3, ease: "easeOut" }
            }
            className="w-full flex flex-col items-center"
          >
            <HeroBadge />
            <HeroTitle />
            <HeroDescription />

            <CollectionButtons
              collections={collections}
              isLoading={isLoadingCollections}
            />

            <FeaturedButton onClick={handleScrollToFeatured} />
          </motion.div>

          <ScrollIndicator />
        </div>
      </section>

      {/* ================= FEATURED PRODUCTS SECTION ================= */}
      <main id="featured" className="w-full px-6 py-24 bg-grid">
        <div className="max-w-7xl mx-auto">
          <SectionTitle title="Productos Destacados" />

          <FeaturedSection
            products={featuredProducts}
            isLoading={isLoadingFeatured}
          />

          <CatalogButton />
        </div>
      </main>

      {/* ================= CART DRAWER ================= */}
      <CartDrawer isOpen={isCartOpen} onClose={handleCartClose} />
    </div>
  );
};

export default Home;