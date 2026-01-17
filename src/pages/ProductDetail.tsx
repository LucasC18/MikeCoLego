import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "react-router-dom";

import { useCart } from "@/context/CartContext";
import { apiFetch } from "@/config/api";
import { Product } from "@/types/product";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, PackageX, X, ImageOff, ZoomIn, ShoppingBag, CheckCircle2, Sparkles } from "lucide-react";

interface ProductDetailProps {
  id?: string;
  onNavigateBack?: () => void;
  onNavigateCatalog?: () => void;
}

/* ================================
   TYPES & INTERFACES
================================= */
type ProductApiResponse =
  | { item: Product }
  | { data: Product }
  | { product: Product }
  | Product;

interface ImageLoadState {
  isLoaded: boolean;
  hasError: boolean;
  isLoading: boolean;
}

interface ScrollPosition {
  x: number;
  y: number;
}

interface ApiError extends Error {
  name: string;
  message: string;
  code?: string;
  status?: number;
}

/* ================================
   HELPERS & UTILITIES
================================= */
const isApiError = (error: unknown): error is ApiError => {
  return error instanceof Error;
};

const extractErrorMessage = (error: unknown): string => {
  if (isApiError(error)) {
    return error.message || "Error al cargar el producto";
  }
  if (typeof error === "string") {
    return error;
  }
  return "Error desconocido al cargar el producto";
};

const isAbortError = (error: unknown): boolean => {
  return isApiError(error) && error.name === "AbortError";
};

const extractProductFromResponse = (res: ProductApiResponse): Product | null => {
  if (!res) return null;
  
  const data =
    "item" in res
      ? res.item
      : "data" in res
      ? res.data
      : "product" in res
      ? res.product
      : res;

  return data ?? null;
};

const getSafeAreaStyle = (): React.CSSProperties => {
  return {
    paddingTop: "env(safe-area-inset-top)",
    paddingBottom: "env(safe-area-inset-bottom)",
    paddingLeft: "env(safe-area-inset-left)",
    paddingRight: "env(safe-area-inset-right)",
  };
};

const getScrollbarWidth = (): number => {
  return window.innerWidth - document.documentElement.clientWidth;
};

const isTouchDevice = (): boolean => {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error - msMaxTouchPoints is legacy
    navigator.msMaxTouchPoints > 0
  );
};

/* ================================
   CUSTOM HOOKS
================================= */
const useScrollLock = () => {
  const scrollPositionRef = useRef<ScrollPosition>({ x: 0, y: 0 });
  const isLockedRef = useRef(false);

  const lockScroll = useCallback(() => {
    if (isLockedRef.current) return;

    scrollPositionRef.current = {
      x: window.scrollX || window.pageXOffset,
      y: window.scrollY || window.pageYOffset,
    };

    const scrollbarWidth = getScrollbarWidth();
    
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollPositionRef.current.y}px`;
    document.body.style.left = `-${scrollPositionRef.current.x}px`;
    document.body.style.right = "0";
    document.body.style.width = "100%";
    
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const html = document.documentElement;
    html.style.overflow = "hidden";
    html.style.position = "fixed";
    html.style.width = "100%";
    html.style.height = "100%";

    isLockedRef.current = true;
  }, []);

  const unlockScroll = useCallback(() => {
    if (!isLockedRef.current) return;

    document.body.style.overflow = "";
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    document.body.style.paddingRight = "";

    const html = document.documentElement;
    html.style.overflow = "";
    html.style.position = "";
    html.style.width = "";
    html.style.height = "";

    window.scrollTo(scrollPositionRef.current.x, scrollPositionRef.current.y);

    isLockedRef.current = false;
  }, []);

  useEffect(() => {
    return () => {
      if (isLockedRef.current) {
        unlockScroll();
      }
    };
  }, [unlockScroll]);

  return { lockScroll, unlockScroll };
};

const useFocusTrap = (isActive: boolean, containerRef: React.RefObject<HTMLElement>) => {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
      }
    };

    container.addEventListener("keydown", handleTabKey);
    container.addEventListener("keydown", handleEscape);
    
    setTimeout(() => {
      firstElement?.focus();
    }, 100);

    return () => {
      container.removeEventListener("keydown", handleTabKey);
      container.removeEventListener("keydown", handleEscape);
    };
  }, [isActive, containerRef]);
};

const useImageLoader = (src: string | undefined) => {
  const [state, setState] = useState<ImageLoadState>({
    isLoaded: false,
    hasError: false,
    isLoading: true,
  });

  useEffect(() => {
    if (!src) {
      setState({ isLoaded: false, hasError: true, isLoading: false });
      return;
    }

    setState({ isLoaded: false, hasError: false, isLoading: true });

    const img = new Image();
    
    img.onload = () => {
      setState({ isLoaded: true, hasError: false, isLoading: false });
    };

    img.onerror = () => {
      setState({ isLoaded: false, hasError: true, isLoading: false });
    };

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return state;
};

const useKeyboardShortcuts = (callbacks: {
  onEscape?: () => void;
  onBack?: () => void;
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && callbacks.onEscape) {
        e.preventDefault();
        callbacks.onEscape();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "ArrowLeft" && callbacks.onBack) {
        e.preventDefault();
        callbacks.onBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [callbacks]);
};

const useProductFetch = (productId: string | undefined) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchProduct = useCallback(async () => {
    if (!productId) {
      setError("ID de producto no válido");
      setIsLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiFetch<ProductApiResponse>(
        `/v1/products/${productId}`,
        {
          signal: abortControllerRef.current.signal,
        }
      );

      const productData = extractProductFromResponse(response);
      
      if (!productData) {
        throw new Error("Producto no encontrado");
      }

      setProduct(productData);
      setError(null);
    } catch (err: unknown) {
      if (isAbortError(err)) {
        return;
      }
      
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
      setProduct(null);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProduct();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchProduct]);

  return { product, isLoading, error, refetch: fetchProduct };
};

const useViewportHeight = () => {
  const [vh, setVh] = useState<number>(window.innerHeight);

  useEffect(() => {
    const updateVh = () => {
      setVh(window.innerHeight);
      document.documentElement.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);
    };

    updateVh();
    window.addEventListener("resize", updateVh);
    window.addEventListener("orientationchange", updateVh);

    return () => {
      window.removeEventListener("resize", updateVh);
      window.removeEventListener("orientationchange", updateVh);
    };
  }, []);

  return vh;
};

/* ================================
   SUB-COMPONENTS
================================= */
const ProductSkeleton = () => (
  <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
    <motion.div 
      className="relative rounded-3xl h-[350px] sm:h-[450px] lg:h-[550px] overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/30"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/20 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
    </motion.div>
    <div className="space-y-6">
      {[
        { h: 12, w: '75%' },
        { h: 10, w: '40%' },
        { h: 32, w: '100%' },
        { h: 16, w: '100%' }
      ].map((item, i) => (
        <motion.div
          key={i}
          className="rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/30 relative overflow-hidden"
          style={{ height: `${item.h * 4}px`, width: item.w }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/20 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: i * 0.2 }}
          />
        </motion.div>
      ))}
    </div>
  </div>
);

const ErrorState = ({ 
  title, 
  message, 
  onRetry 
}: { 
  title: string; 
  message: string; 
  onRetry?: () => void;
}) => (
  <div className="text-center py-20 sm:py-28">
    <motion.div 
      className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-10 max-w-md mx-auto overflow-hidden"
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 via-transparent to-violet-500/5 pointer-events-none" />
      
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      >
        <PackageX className="w-20 h-20 mx-auto text-rose-400/90 mb-5" strokeWidth={1.5} />
      </motion.div>
      
      <motion.h2 
        className="text-2xl font-bold text-white mb-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {title}
      </motion.h2>
      
      <motion.p 
        className="text-slate-300 text-base leading-relaxed mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {message}
      </motion.p>
      
      {onRetry && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            onClick={onRetry}
            size="lg"
            className="h-12 px-8 text-base font-semibold rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 border-0 shadow-lg shadow-violet-500/25 transition-all duration-300"
          >
            Reintentar
          </Button>
        </motion.div>
      )}
    </motion.div>
  </div>
);

const StockBadge = ({ inStock }: { inStock: boolean }) => {
  if (inStock) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Badge className="relative inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/90 to-teal-500/90 text-white px-5 py-2.5 text-sm sm:text-base font-semibold rounded-xl border-0 shadow-lg shadow-emerald-500/20 overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-white/20 to-emerald-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <CheckCircle2 className="w-4 h-4 relative z-10" />
          <span className="relative z-10">Disponible</span>
        </Badge>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Badge className="relative inline-flex items-center gap-2 bg-gradient-to-r from-rose-500/90 to-red-500/90 text-white px-5 py-2.5 text-sm sm:text-base font-semibold rounded-xl border-0 shadow-lg shadow-rose-500/20 overflow-hidden">
        <X className="w-4 h-4" />
        Agotado
      </Badge>
    </motion.div>
  );
};

const ProductImage = ({
  src,
  alt,
  onClick,
}: {
  src: string;
  alt: string;
  onClick: () => void;
}) => {
  const imageState = useImageLoader(src);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  if (imageState.isLoading && !imageError) {
    return (
      <div className="w-full h-[350px] sm:h-[450px] lg:h-[550px] flex items-center justify-center bg-slate-800/30 rounded-3xl border border-slate-700/30 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-fuchsia-500/5" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-14 h-14 text-violet-400/70" strokeWidth={2} />
        </motion.div>
      </div>
    );
  }

  if (imageState.hasError || imageError) {
    return (
      <motion.div 
        className="w-full h-[350px] sm:h-[450px] lg:h-[550px] flex flex-col items-center justify-center text-slate-400 bg-slate-800/30 rounded-3xl border border-dashed border-slate-700/50 backdrop-blur-xl relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700/5 via-transparent to-slate-600/5" />
        <ImageOff className="w-16 h-16 mb-3 relative z-10" strokeWidth={1.5} />
        <p className="text-lg font-medium relative z-10">Sin imagen disponible</p>
      </motion.div>
    );
  }

  return (
    <motion.button
      onClick={onClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative w-full group cursor-pointer focus:outline-none rounded-3xl overflow-hidden bg-white transition-all duration-500 focus:ring-2 focus:ring-violet-400/50 focus:ring-offset-2 focus:ring-offset-slate-900"
      aria-label="Ver imagen en tamaño completo"
      type="button"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Subtle neon border glow on hover */}
      <motion.div
        className="absolute inset-0 rounded-3xl"
        style={{
          boxShadow: '0 0 0 1px rgba(139, 92, 246, 0), 0 0 20px rgba(139, 92, 246, 0)',
        }}
        animate={{
          boxShadow: isHovered 
            ? '0 0 0 1px rgba(139, 92, 246, 0.3), 0 0 30px rgba(139, 92, 246, 0.15)'
            : '0 0 0 1px rgba(139, 92, 246, 0), 0 0 20px rgba(139, 92, 246, 0)',
        }}
        transition={{ duration: 0.4 }}
      />
      
      <img
        src={src}
        alt={alt}
        onError={handleImageError}
        className="w-full h-[350px] sm:h-[450px] lg:h-[550px] object-contain p-6 relative z-10 transition-transform duration-500"
        loading="lazy"
        decoding="async"
      />
      
      <motion.div 
        className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/0 to-slate-900/0 flex items-end justify-center pb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div 
          className="bg-white/95 backdrop-blur-sm rounded-xl px-6 py-3 flex items-center gap-2.5 shadow-xl border border-white/20"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: isHovered ? 0 : 20, opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <ZoomIn className="w-5 h-5 text-slate-700" strokeWidth={2} />
          <span className="text-sm font-semibold text-slate-700">Ver en grande</span>
        </motion.div>
      </motion.div>
    </motion.button>
  );
};

const ImageModal = ({
  isOpen,
  imageSrc,
  imageAlt,
  onClose,
}: {
  isOpen: boolean;
  imageSrc: string;
  imageAlt: string;
  onClose: () => void;
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { lockScroll, unlockScroll } = useScrollLock();
  
  useFocusTrap(isOpen, modalRef);
  useViewportHeight();

  useEffect(() => {
    if (isOpen) {
      lockScroll();
    } else {
      unlockScroll();
    }
  }, [isOpen, lockScroll, unlockScroll]);

  useKeyboardShortcuts({
    onEscape: onClose,
  });

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;

    const preventTouchMove = (e: TouchEvent) => {
      if (e.target === modalRef.current) {
        e.preventDefault();
      }
    };

    document.addEventListener("touchmove", preventTouchMove, { passive: false });

    return () => {
      document.removeEventListener("touchmove", preventTouchMove);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={modalRef}
        className="fixed inset-0 bg-slate-950/98 flex items-center justify-center z-[9999] p-4 sm:p-6 backdrop-blur-2xl"
        style={{
          ...getSafeAreaStyle(),
          height: "100dvh",
        }}
        onClick={handleBackdropClick}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        role="dialog"
        aria-modal="true"
        aria-label="Vista ampliada de imagen"
      >
        {/* Ambient glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-1/2 left-1/2 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 bg-violet-500/10 rounded-full blur-3xl"
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <motion.div
          className="relative max-h-[85vh] max-w-[90vw] flex items-center justify-center"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <img
            src={imageSrc}
            alt={imageAlt}
            className="max-h-[85vh] max-w-full object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />
        </motion.div>

        <motion.button
          className="fixed top-4 right-4 sm:top-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white border border-white/20 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg"
          onClick={onClose}
          aria-label="Cerrar vista ampliada"
          type="button"
          initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.8, rotate: 90 }}
          transition={{ delay: 0.1 }}
          whileHover={{ rotate: 90 }}
        >
          <X className="w-6 h-6" strokeWidth={2} />
        </motion.button>

        <motion.div 
          className="fixed bottom-6 left-0 right-0 text-center px-4 pointer-events-none"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-white/80 text-sm font-medium bg-slate-900/60 backdrop-blur-xl rounded-full px-6 py-3 inline-block border border-white/10 shadow-xl">
            {isTouchDevice()
              ? "Toca fuera de la imagen para cerrar"
              : "Presiona ESC o haz clic fuera para cerrar"}
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const AddToCartButton = ({
  product,
  inCart,
  onAdd,
}: {
  product: Product;
  inCart: boolean;
  onAdd: (product: Product) => void;
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleClick = useCallback(() => {
    if (isAdding || inCart || !product.inStock) return;

    setIsAdding(true);
    onAdd(product);

    setTimeout(() => {
      setIsAdding(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }, 600);
  }, [isAdding, inCart, product, onAdd]);

  const isDisabled = !product.inStock || inCart || isAdding;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <motion.button
        disabled={isDisabled}
        onClick={handleClick}
        className={`
          relative w-full h-16 sm:h-[68px] text-lg font-semibold rounded-2xl
          overflow-hidden transition-all duration-500 group
          ${isDisabled 
            ? 'bg-slate-700/50 cursor-not-allowed opacity-60 border border-slate-600/30' 
            : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 border-0 shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50'
          }
        `}
        aria-label={inCart ? "Producto agregado" : "Agregar producto a consulta"}
        whileHover={!isDisabled ? { scale: 1.02 } : {}}
        whileTap={!isDisabled ? { scale: 0.98 } : {}}
      >
        {/* Animated gradient overlay */}
        {!isDisabled && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
        )}
        
        {/* Success pulse effect */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              className="absolute inset-0 bg-emerald-400/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            />
          )}
        </AnimatePresence>

        <span className="relative z-10 flex items-center justify-center gap-2.5 text-white">
          <AnimatePresence mode="wait">
            {isAdding ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Loader2 className="w-5 h-5 animate-spin" />
              </motion.div>
            ) : inCart ? (
              <motion.div
                key="added"
                className="flex items-center gap-2.5"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <CheckCircle2 className="w-5 h-5" />
                En Consulta
              </motion.div>
            ) : (
              <motion.div
                key="add"
                className="flex items-center gap-2.5"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <ShoppingBag className="w-5 h-5" />
                Agregar a Consulta
              </motion.div>
            )}
          </AnimatePresence>
        </span>
      </motion.button>
    </motion.div>
  );
};

/* ================================
   MAIN COMPONENT
================================= */
const ProductDetail = ({
  id,
  onNavigateBack,
  onNavigateCatalog,
}: ProductDetailProps) => {
  const { id: paramId } = useParams<{ id: string }>();
  const productId = useMemo(() => id || paramId, [id, paramId]);

  const { addToCart, isInCart } = useCart();
  const { product, isLoading, error, refetch } = useProductFetch(productId);

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  useViewportHeight();

  const inCart = useMemo(() => {
    return product ? isInCart(product.id) : false;
  }, [product, isInCart]);

  const handleBack = useCallback(() => {
    if (onNavigateBack) {
      onNavigateBack();
    } else if (onNavigateCatalog) {
      onNavigateCatalog();
    } else {
      window.history.back();
    }
  }, [onNavigateBack, onNavigateCatalog]);

  const handleOpenModal = useCallback(() => {
    if (!product?.image) return;
    setIsImageModalOpen(true);
  }, [product]);

  const handleCloseModal = useCallback(() => {
    setIsImageModalOpen(false);
  }, []);

  const handleAddToCart = useCallback(
    (prod: Product) => {
      addToCart(prod);
    },
    [addToCart]
  );

  useKeyboardShortcuts({
    onEscape: isImageModalOpen ? handleCloseModal : undefined,
    onBack: handleBack,
  });

  useEffect(() => {
    if (product?.image) {
      const img = new Image();
      img.src = product.image;
    }
  }, [product]);

  return (
    <div 
      className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 relative overflow-hidden"
      style={{
        ...getSafeAreaStyle(),
        minHeight: "100dvh",
      }}
    >
      {/* Enhanced background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Primary gradient orb */}
        <motion.div
          className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-500/8 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
            opacity: [0.4, 0.6, 0.4]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Secondary gradient orb */}
        <motion.div
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-fuchsia-500/8 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.3, 1],
            x: [0, -50, 0],
            y: [0, -30, 0],
            opacity: [0.4, 0.6, 0.4]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Accent orb */}
        <motion.div
          className="absolute top-1/2 right-1/3 w-[350px] h-[350px] bg-cyan-500/6 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
      </div>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <motion.button
          onClick={handleBack}
          className="mb-6 sm:mb-8 flex items-center gap-2.5 px-5 py-3 bg-slate-800/40 backdrop-blur-xl border border-slate-700/40 hover:bg-slate-800/60 hover:border-violet-500/30 rounded-xl text-white font-semibold transition-all duration-300 group shadow-lg hover:shadow-violet-500/10"
          aria-label="Volver atrás"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -5 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" strokeWidth={2.5} />
          Volver
        </motion.button>

        {isLoading && <ProductSkeleton />}

        {!isLoading && error && (
          <ErrorState
            title="Error al cargar"
            message={error}
            onRetry={refetch}
          />
        )}

        {!isLoading && !error && !product && (
          <ErrorState
            title="Producto no encontrado"
            message="Este producto no existe o fue eliminado del catálogo."
          />
        )}

        {!isLoading && !error && product && (
          <motion.div
            className="grid lg:grid-cols-2 gap-8 lg:gap-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, staggerChildren: 0.1 }}
          >
            {/* Image Section */}
            <div className="relative">
              {product.image ? (
                <ProductImage
                  src={product.image}
                  alt={product.name}
                  onClick={handleOpenModal}
                />
              ) : (
                <motion.div 
                  className="w-full h-[350px] sm:h-[450px] lg:h-[550px] flex flex-col items-center justify-center text-slate-400 bg-slate-800/30 rounded-3xl border border-dashed border-slate-700/50 backdrop-blur-xl relative overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-700/5 via-transparent to-slate-600/5" />
                  <ImageOff className="w-16 h-16 mb-3 relative z-10" strokeWidth={1.5} />
                  <p className="text-lg font-medium relative z-10">Sin imagen disponible</p>
                </motion.div>
              )}
            </div>

            {/* Product Info Section */}
            <div className="space-y-6">
              {/* Title & Stock */}
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight">
                  {product.name}
                </h1>

                <StockBadge inStock={product.inStock} />
              </motion.div>

              {/* Description */}
              {product.description && (
                <motion.div 
                  className="relative bg-slate-800/30 backdrop-blur-xl border border-slate-700/40 rounded-2xl p-6 overflow-hidden group hover:border-slate-600/50 transition-all duration-500"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {/* Subtle hover glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 via-transparent to-fuchsia-500/0 group-hover:from-violet-500/5 group-hover:to-fuchsia-500/5 transition-all duration-500 pointer-events-none" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-violet-400" strokeWidth={2} />
                      <h2 className="text-base font-semibold text-white">
                        Descripción
                      </h2>
                    </div>
                    <p className="text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                      {product.description}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Add to Cart Button */}
              <AddToCartButton
                product={product}
                inCart={inCart}
                onAdd={handleAddToCart}
              />

              {/* Image hint */}
              {product.image && (
                <motion.p 
                  className="text-slate-400 text-center text-sm bg-slate-800/20 backdrop-blur-xl rounded-xl py-3 px-4 border border-slate-700/30"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  💡 Toca la imagen para verla en tamaño completo
                </motion.p>
              )}

              {/* Out of stock notice */}
              {!product.inStock && (
                <motion.div 
                  className="relative bg-amber-500/10 border border-amber-500/30 backdrop-blur-xl p-5 rounded-2xl overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 to-transparent pointer-events-none" />
                  <p className="text-amber-200 text-sm font-medium leading-relaxed relative z-10">
                    ⚠️ Este producto no está disponible actualmente. Puedes agregarlo
                    a tu consulta para recibir notificaciones cuando vuelva a estar
                    en stock.
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </main>

      {product && (
        <ImageModal
          isOpen={isImageModalOpen}
          imageSrc={product.image || ""}
          imageAlt={product.name}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default ProductDetail;