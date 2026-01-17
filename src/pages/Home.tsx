// Home.tsx
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import {
  Sparkles,
  ChevronDown,
  ArrowRight,
  Star,
  Loader2,
  Package,
  Zap,
} from "lucide-react";
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
const NAVBAR_HEIGHT = 64;
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
  if (isApiError(error)) return error.message || "Error al cargar datos";
  if (typeof error === "string") return error;
  return "Error desconocido";
};

const getSafeAreaStyle = (): React.CSSProperties => ({
  paddingTop: "env(safe-area-inset-top)",
  paddingBottom: "env(safe-area-inset-bottom)",
  paddingLeft: "env(safe-area-inset-left)",
  paddingRight: "env(safe-area-inset-right)",
});

const getViewportHeight = (): string => `calc(100dvh - ${NAVBAR_HEIGHT}px)`;

const smoothScrollToElement = (elementId: string): void => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const elementPosition = element.getBoundingClientRect().top + window.scrollY;
  const offsetPosition = elementPosition - NAVBAR_HEIGHT;

  window.scrollTo({ top: offsetPosition, behavior: SCROLL_BEHAVIOR });
};

const preloadImage = (src: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });

const debounce = <T extends (...args: never[]) => void>(func: T, wait: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
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
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiFetch<Collection[]>("/v1/collections", {
        signal: abortControllerRef.current.signal,
      });
      setCollections(response || []);
    } catch (err: unknown) {
      if (isApiError(err) && err.name === "AbortError") return;
      setError(extractErrorMessage(err));
      setCollections([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollections();
    return () => abortControllerRef.current?.abort();
  }, [fetchCollections]);

  return { collections, isLoading, error, refetch: fetchCollections };
};

const useFeaturedProducts = (limit: number = FEATURED_PRODUCTS_LIMIT) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchProducts = useCallback(async () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiFetch<FeaturedApiResponse>(
        `/v1/products?featured=true&limit=${limit}`,
        { signal: abortControllerRef.current.signal }
      );
      setProducts(response.items || []);
    } catch (err: unknown) {
      if (isApiError(err) && err.name === "AbortError") return;
      setError(extractErrorMessage(err));
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchProducts();
    return () => abortControllerRef.current?.abort();
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
const OptimizedBackground = ({
  isMobile,
  isLowEnd,
  prefersReducedMotion,
}: {
  isMobile: boolean;
  isLowEnd: boolean;
  prefersReducedMotion: boolean;
}) => {
  if (prefersReducedMotion || isLowEnd) {
    return (
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/6 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/6 rounded-full blur-3xl" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className={`absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-violet-500/7 rounded-full ${
          isMobile ? "blur-2xl" : "blur-3xl"
        }`}
        style={{ willChange: "transform" }}
        animate={{
          scale: [1, 1.15, 1],
          x: [0, isMobile ? 20 : 50, 0],
          y: [0, isMobile ? 15 : 30, 0],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{
          duration: isMobile ? 15 : 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {!isMobile && (
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-fuchsia-500/7 rounded-full blur-3xl"
          style={{ willChange: "transform" }}
          animate={{
            scale: [1, 1.2, 1],
            x: [0, -40, 0],
            y: [0, -25, 0],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {!isMobile && (
        <motion.div
          className="absolute top-1/2 right-1/3 w-[350px] h-[350px] bg-cyan-500/5 rounded-full blur-3xl"
          style={{ willChange: "transform" }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </div>
  );
};

/* ================================
   SUB-COMPONENTS
================================= */
const HeroBackground = ({
  imageSrc,
  prefersReducedMotion,
}: {
  imageSrc: string;
  isMobile: boolean;
  prefersReducedMotion: boolean;
}) => {
  const isImageLoaded = useImagePreload(imageSrc);

  return (
    <motion.div
      initial={prefersReducedMotion ? undefined : { scale: 1.05, opacity: 0 }}
      animate={prefersReducedMotion ? undefined : { scale: 1, opacity: 1 }}
      transition={prefersReducedMotion ? undefined : { duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0"
    >
      {!isImageLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/20 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}

      <img
        src={imageSrc}
        alt="Hero background"
        className={`w-full h-full object-cover transition-opacity duration-700 ${
          isImageLoaded ? "opacity-100" : "opacity-0"
        }`}
        loading="eager"
        decoding="async"
      />

      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-slate-900/40 to-black/60" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/70 to-slate-900/20" />
      
      {/* Subtle vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(15,23,42,0.4)_100%)]" />
    </motion.div>
  );
};

const HeroBadge = () => (
  <motion.div
    className="inline-flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 backdrop-blur-xl border border-amber-500/25 rounded-full mb-8 shadow-lg relative overflow-hidden group"
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.2 }}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-400/10 to-amber-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
    <Sparkles className="w-4 h-4 text-amber-400 relative z-10" />
    <span className="text-sm font-semibold text-amber-200 relative z-10">Colecciones Exclusivas</span>
  </motion.div>
);

const HeroTitle = () => (
  <motion.h1
    className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-[1.1]"
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: 0.3 }}
  >
    <span className="text-white drop-shadow-2xl block sm:inline">Jedi</span>
    <span className="block sm:inline text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 drop-shadow-2xl"> Collector71</span>
  </motion.h1>
);

const HeroDescription = () => (
  <motion.p
    className="text-slate-200 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed px-4 drop-shadow-lg"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.6, delay: 0.5 }}
  >
    Explorá nuestras colecciones y encontrá tu próximo favorito
  </motion.p>
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
      <div className="flex flex-wrap justify-center gap-3 mb-10 w-full max-w-2xl px-4">
        {[1, 2].map((i) => (
          <motion.div
            key={i}
            className="px-10 py-4 h-14 min-w-[180px] rounded-2xl bg-slate-800/20 border border-slate-700/30 relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-600/20 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: i * 0.3 }}
            />
          </motion.div>
        ))}
      </div>
    );
  }

  if (collections.length === 0) return null;

  return (
    <motion.div
      className="flex flex-wrap justify-center gap-3 mb-10 w-full max-w-2xl px-4"
      initial={prefersReducedMotion ? undefined : { opacity: 0, y: 15 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={prefersReducedMotion ? undefined : { duration: 0.5, delay: 0.6 }}
    >
      {visibleCollections.map((collection, index) => (
        <motion.div
          key={collection.id}
          initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.9 }}
          animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1 }}
          transition={
            prefersReducedMotion
              ? undefined
              : { duration: 0.4, delay: 0.7 + index * 0.1 }
          }
        >
          <Link
            to={`/catalogo?collection=${collection.slug}`}
            className="group relative inline-block px-10 py-4 h-14 min-w-[180px] rounded-2xl bg-slate-800/30 backdrop-blur-xl border border-slate-700/40 hover:bg-slate-800/50 hover:border-violet-500/30 font-semibold text-base text-white transition-all duration-300 flex items-center justify-center gap-2.5 shadow-lg hover:shadow-violet-500/10 overflow-hidden"
            aria-label={`Ver colección ${collection.name}`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/5 to-violet-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <Package className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:scale-110" />
            <span className="relative z-10">{collection.name}</span>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
};

const FeaturedButton = ({
  onClick,
  prefersReducedMotion,
}: {
  onClick: () => void;
  prefersReducedMotion: boolean;
}) => (
  <motion.button
    onClick={onClick}
    className="group relative px-12 py-4 h-16 min-w-[220px] font-semibold text-lg rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-0 shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden"
    aria-label="Ver productos destacados"
    initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20 }}
    animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
    transition={prefersReducedMotion ? undefined : { duration: 0.5, delay: 0.9 }}
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.98 }}
  >
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
      animate={{ x: ['-100%', '100%'] }}
      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
    />
    <Zap className="w-5 h-5 relative z-10" />
    <span className="relative z-10">Ver Destacados</span>
  </motion.button>
);

const ScrollIndicator = ({ prefersReducedMotion }: { prefersReducedMotion: boolean }) => (
  <motion.div
    className="absolute bottom-10"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1, y: prefersReducedMotion ? 0 : [0, 10, 0] }}
    transition={
      prefersReducedMotion
        ? { duration: 0.5, delay: 1.2 }
        : { duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }
    }
  >
    <div className="flex flex-col items-center gap-2">
      <div className="w-8 h-12 rounded-full border-2 border-violet-400/40 flex items-start justify-center p-2">
        <motion.div
          className="w-1.5 h-2 bg-violet-400 rounded-full"
          animate={prefersReducedMotion ? {} : { y: [0, 12, 0], opacity: [1, 0.3, 1] }}
          transition={prefersReducedMotion ? {} : { duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <span className="text-sm text-slate-300 font-medium">Scrolleá para ver más</span>
    </div>
  </motion.div>
);

const LoadingSpinner = ({ message }: { message?: string }) => (
  <div className="text-center py-28">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="inline-block mb-5"
    >
      <Loader2 className="w-14 h-14 text-violet-400" strokeWidth={2} />
    </motion.div>
    <p className="text-slate-300 text-lg font-medium">{message || "Cargando..."}</p>
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <motion.div
    className="text-center py-28"
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
  >
    <div className="relative bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-12 max-w-md mx-auto overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-700/5 via-transparent to-slate-600/5" />
      <Package className="w-16 h-16 text-slate-500 mx-auto mb-4 relative z-10" strokeWidth={1.5} />
      <p className="text-slate-400 text-lg font-medium relative z-10">{message}</p>
    </div>
  </motion.div>
);

const SectionTitle = ({
  title,
}: {
  title: string;
  prefersReducedMotion: boolean;
}) => (
  <motion.div
    className="flex items-center justify-center gap-3 mb-14"
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.5 }}
  >
    <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
    <h2 className="text-3xl md:text-4xl font-bold text-white">{title}</h2>
    <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
  </motion.div>
);

const CatalogButton = () => (
  <motion.div
    className="text-center mt-16"
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.5 }}
  >
    <Link
      to="/catalogo"
      className="group relative inline-flex items-center gap-2.5 px-12 py-4 h-14 bg-slate-800/30 backdrop-blur-xl border border-slate-700/40 hover:bg-slate-800/50 hover:border-violet-500/30 rounded-2xl font-semibold text-base text-white transition-all duration-300 shadow-lg hover:shadow-violet-500/10 overflow-hidden"
      aria-label="Ver catálogo completo de productos"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/5 to-violet-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
      <span className="relative z-10">Ver Catálogo Completo</span>
      <ArrowRight className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
    </Link>
  </motion.div>
);

const FeaturedSection = ({
  products,
  isLoading,
  onNavigateProduct,
}: {
  products: Product[];
  isLoading: boolean;
  onNavigateProduct: (id: string) => void;
}) => {
  if (isLoading) return <LoadingSpinner message="Cargando productos destacados..." />;
  if (products.length === 0) return <EmptyState message="No hay productos destacados todavía" />;

  return (
    <motion.div
      className="flex justify-center"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
    >
      <div className="w-full max-w-6xl">
        <ProductGrid products={products} onNavigate={onNavigateProduct} />
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
  const navigate = useNavigate();

  const { collections, isLoading: isLoadingCollections, error: collectionsError } =
    useCollections();
  const { products: featuredProducts, isLoading: isLoadingFeatured, error: featuredError } =
    useFeaturedProducts();

  useViewportHeight();

  const handleNavigateProduct = useCallback(
    (id: string) => {
      navigate(`/producto/${id}`);
    },
    [navigate]
  );

  const handleScrollToFeatured = useCallback(() => {
    smoothScrollToElement("featured");
  }, []);

  const handleCartOpen = useCallback(() => setIsCartOpen(true), []);
  const handleCartClose = useCallback(() => setIsCartOpen(false), []);

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

        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 py-20 flex flex-col items-center justify-center text-center">
          <motion.div
            className="w-full flex flex-col items-center"
          >
            <HeroBadge />
            <HeroTitle />
            <HeroDescription />

            {!isLoadingCollections && collectionsError && (
              <motion.p
                className="text-sm text-rose-300 mb-6 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {collectionsError}
              </motion.p>
            )}

            <CollectionButtons
              collections={collections}
              isLoading={isLoadingCollections}
              prefersReducedMotion={prefersReducedMotion}
            />

            <FeaturedButton onClick={handleScrollToFeatured} prefersReducedMotion={prefersReducedMotion} />
          </motion.div>

          <ScrollIndicator prefersReducedMotion={prefersReducedMotion} />
        </div>
      </section>

      <main id="featured" className="relative w-full px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <SectionTitle title="Productos Destacados" prefersReducedMotion={prefersReducedMotion} />

          {!isLoadingFeatured && featuredError && (
            <motion.p
              className="text-center text-sm text-rose-300 mb-8 bg-rose-500/10 border border-rose-500/30 rounded-xl px-6 py-3 max-w-md mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {featuredError}
            </motion.p>
          )}

          <FeaturedSection
            products={featuredProducts}
            isLoading={isLoadingFeatured}
            onNavigateProduct={handleNavigateProduct}
          />

          <CatalogButton />
        </div>
      </main>

      <CartDrawer isOpen={isCartOpen} onClose={handleCartClose} />
    </div>
  );
};

export default Home;