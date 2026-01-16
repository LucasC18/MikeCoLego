import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import { Sparkles, ChevronDown, ArrowRight, Star, Loader2, Package } from "lucide-react";
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
   DEVICE DETECTION
================================= */
interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number;
}

const useDeviceDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isLowEnd, setIsLowEnd] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      const nav = navigator as NavigatorWithMemory;
      const cores = navigator.hardwareConcurrency || 4;
      const memory = nav.deviceMemory || 4;
      setIsLowEnd(cores <= 2 || memory <= 2);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  return { isMobile, isLowEnd };
};

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
   OPTIMIZED BACKGROUND
================================= */
const OptimizedBackground = ({ isMobile, isLowEnd, prefersReducedMotion }: { 
  isMobile: boolean; 
  isLowEnd: boolean;
  prefersReducedMotion: boolean;
}) => {
  if (prefersReducedMotion || isLowEnd) {
    return (
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/8 rounded-full blur-3xl" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className={`absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/8 rounded-full ${isMobile ? 'blur-2xl' : 'blur-3xl'}`}
        style={{ willChange: "transform" }}
        animate={{ 
          scale: [1, 1.1, 1],
          x: [0, isMobile ? 15 : 40, 0],
          y: [0, isMobile ? 10 : 25, 0]
        }}
        transition={{ 
          duration: isMobile ? 12 : 10,
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      />
      
      {!isMobile && (
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/8 rounded-full blur-3xl"
          style={{ willChange: "transform" }}
          animate={{ 
            scale: [1, 1.15, 1],
            x: [0, -35, 0],
            y: [0, -20, 0]
          }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </div>
  );
};

/* ================================
   SUB-COMPONENTS
================================= */
const HeroBackground = ({ imageSrc, isMobile, prefersReducedMotion }: { 
  imageSrc: string;
  isMobile: boolean;
  prefersReducedMotion: boolean;
}) => {
  const isImageLoaded = useImagePreload(imageSrc);

  return (
    <motion.div
      initial={prefersReducedMotion ? undefined : { scale: 1.05 }}
      animate={prefersReducedMotion ? undefined : { scale: 1 }}
      transition={prefersReducedMotion ? undefined : { duration: 1.2, ease: "easeOut" }}
      className="absolute inset-0"
    >
      {!isImageLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 animate-pulse" />
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

      <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-slate-900/30 to-black/50" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
    </motion.div>
  );
};

const HeroBadge = () => (
  <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500/15 to-orange-500/15 backdrop-blur-sm border border-amber-500/30 rounded-full mb-7">
    <Sparkles className="w-4 h-4 text-amber-400" />
    <span className="text-sm font-semibold text-amber-200">
      Colecciones Exclusivas
    </span>
  </div>
);

const HeroTitle = () => (
  <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
    <span className="text-white drop-shadow-2xl">Jedi</span>
    <span className="block sm:inline text-white drop-shadow-2xl">
      {" "}Collector71
    </span>
  </h1>
);

const HeroDescription = () => (
  <p className="text-slate-200 text-lg md:text-xl max-w-3xl mx-auto mb-10 leading-relaxed px-4 drop-shadow-lg">
    Explorá nuestras colecciones y encontrá tu próximo favorito
  </p>
);

const CollectionButtons = ({
  collections,
  isLoading,
  prefersReducedMotion,
}: {
  collections: Collection[];
  isLoading: boolean;
  prefersReducedMotion: boolean;
}) => {
  const visibleCollections = useMemo(
    () => collections.slice(0, MAX_VISIBLE_COLLECTIONS),
    [collections]
  );

  if (isLoading) {
    return (
      <div className="flex flex-wrap justify-center gap-3 mb-10 w-full max-w-2xl">
        {[1, 2].map((i) => (
          <motion.div
            key={i}
            className="px-10 py-4 h-14 min-w-[180px] rounded-xl bg-slate-800/30 border border-slate-700/50"
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
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
      className="flex flex-wrap justify-center gap-3 mb-10 w-full max-w-2xl"
      initial={prefersReducedMotion ? undefined : { opacity: 0, y: 15 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={prefersReducedMotion ? undefined : { duration: 0.4, delay: 0.3 }}
    >
      {visibleCollections.map((collection, index) => (
        <motion.div
          key={collection.id}
          initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.95 }}
          animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1 }}
          transition={
            prefersReducedMotion
              ? undefined
              : {
                  duration: 0.3,
                  delay: 0.4 + index * 0.1,
                }
          }
        >
          <Link
            to={`/catalogo?collection=${collection.slug}`}
            className="inline-block px-10 py-4 h-14 min-w-[180px] rounded-xl bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-600/60 font-semibold text-base text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
            aria-label={`Ver colección ${collection.name}`}
          >
            <Package className="w-4 h-4" />
            {collection.name}
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
};

const FeaturedButton = ({ onClick }: { 
  onClick: () => void;
  prefersReducedMotion: boolean;
}) => {
  return (
    <button
      onClick={onClick}
      className="px-10 py-4 h-14 min-w-[200px] font-semibold text-lg rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-0 shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
      aria-label="Ver productos destacados"
    >
      Ver Destacados
    </button>
  );
};

const ScrollIndicator = ({ prefersReducedMotion }: { prefersReducedMotion: boolean }) => (
  <motion.div
    className="absolute bottom-8"
    animate={
      prefersReducedMotion
        ? undefined
        : { y: [0, 10, 0] }
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
    <div className="flex flex-col items-center gap-2">
      <ChevronDown className="w-7 h-7 text-violet-400" />
      <span className="text-sm text-slate-300 font-medium">Scrolleá para ver más</span>
    </div>
  </motion.div>
);

const LoadingSpinner = ({ message }: { message?: string }) => (
  <div className="text-center py-28">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="inline-block mb-4"
    >
      <Loader2 className="w-14 h-14 text-violet-400" />
    </motion.div>
    <p className="text-slate-300 text-lg font-medium">{message || "Cargando..."}</p>
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <motion.div 
    className="text-center py-28"
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
  >
    <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-10 max-w-md mx-auto">
      <Package className="w-16 h-16 text-slate-500 mx-auto mb-3" />
      <p className="text-slate-400 text-lg font-medium">{message}</p>
    </div>
  </motion.div>
);

const SectionTitle = ({ title }: { 
  title: string;
  prefersReducedMotion: boolean;
}) => (
  <motion.div 
    className="flex items-center justify-center gap-3 mb-14"
    initial={{ opacity: 0, y: 15 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.4 }}
  >
    <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
    <h2 className="text-3xl md:text-4xl font-bold text-white">
      {title}
    </h2>
    <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
  </motion.div>
);

const CatalogButton = () => (
  <motion.div 
    className="text-center mt-16"
    initial={{ opacity: 0, y: 15 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.4 }}
  >
    <Link
      to="/catalogo"
      className="inline-flex items-center gap-2 px-10 py-4 h-14 bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-600/60 rounded-xl font-semibold text-base text-white transition-all duration-200 shadow-lg"
      aria-label="Ver catálogo completo de productos"
    >
      Ver Catálogo Completo
      <ArrowRight className="w-4 h-4" />
    </Link>
  </motion.div>
);

const FeaturedSection = ({
  products,
  isLoading,
}: {
  products: Product[];
  isLoading: boolean;
}) => {
  if (isLoading) {
    return <LoadingSpinner message="Cargando productos destacados..." />;
  }

  if (products.length === 0) {
    return <EmptyState message="No hay productos destacados todavía" />;
  }

  return (
    <motion.div 
      className="flex justify-center"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <div className="w-full max-w-6xl">
        <ProductGrid products={products} />
      </div>
    </motion.div>
  );
};

/* ================================
   MAIN COMPONENT
================================= */
const Home = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion() || false;
  const { isMobile, isLowEnd } = useDeviceDetection();

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
    preloadImage(heroImage).catch(() => {});
  }, []);

  return (
    <div
      className="min-h-[100dvh] bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 relative overflow-hidden"
      style={getSafeAreaStyle()}
    >
      <OptimizedBackground 
        isMobile={isMobile} 
        isLowEnd={isLowEnd}
        prefersReducedMotion={prefersReducedMotion}
      />

      <Navbar onCartClick={handleCartOpen} />

      <section
        className="relative flex items-center justify-center overflow-hidden"
        style={{ minHeight: getViewportHeight() }}
      >
        <HeroBackground 
          imageSrc={heroImage}
          isMobile={isMobile}
          prefersReducedMotion={prefersReducedMotion}
        />

        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 py-16 flex flex-col items-center justify-center text-center">
          <motion.div
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 30 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={
              prefersReducedMotion
                ? undefined
                : { duration: 0.6, delay: 0.2 }
            }
            className="w-full flex flex-col items-center"
          >
            <HeroBadge />
            <HeroTitle />
            <HeroDescription />

            <CollectionButtons
              collections={collections}
              isLoading={isLoadingCollections}
              prefersReducedMotion={prefersReducedMotion}
            />

            <FeaturedButton 
              onClick={handleScrollToFeatured}
              prefersReducedMotion={prefersReducedMotion}
            />
          </motion.div>

          <ScrollIndicator prefersReducedMotion={prefersReducedMotion} />
        </div>
      </section>

      <main id="featured" className="relative w-full px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <SectionTitle 
            title="Productos Destacados"
            prefersReducedMotion={prefersReducedMotion}
          />

          <FeaturedSection
            products={featuredProducts}
            isLoading={isLoadingFeatured}
          />

          <CatalogButton />
        </div>
      </main>

      <CartDrawer isOpen={isCartOpen} onClose={handleCartClose} />
    </div>
  );
};

export default Home;