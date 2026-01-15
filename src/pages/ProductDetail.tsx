import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "react-router-dom";

import { useCart } from "@/context/CartContext";
import { apiFetch } from "@/config/api";
import { Product } from "@/types/product";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, PackageX, X, ImageOff, ZoomIn } from "lucide-react";

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

const formatPrice = (price: number | undefined): string => {
  if (!price) return "Consultar precio";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(price);
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

    // Guardar posición actual
    scrollPositionRef.current = {
      x: window.scrollX || window.pageXOffset,
      y: window.scrollY || window.pageYOffset,
    };

    // Aplicar estilos para bloquear scroll
    const scrollbarWidth = getScrollbarWidth();
    
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollPositionRef.current.y}px`;
    document.body.style.left = `-${scrollPositionRef.current.x}px`;
    document.body.style.right = "0";
    document.body.style.width = "100%";
    
    // Compensar scrollbar en desktop
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // Prevenir scroll en iOS Safari
    const html = document.documentElement;
    html.style.overflow = "hidden";
    html.style.position = "fixed";
    html.style.width = "100%";
    html.style.height = "100%";

    isLockedRef.current = true;
  }, []);

  const unlockScroll = useCallback(() => {
    if (!isLockedRef.current) return;

    // Remover estilos del body
    document.body.style.overflow = "";
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    document.body.style.paddingRight = "";

    // Remover estilos del html
    const html = document.documentElement;
    html.style.overflow = "";
    html.style.position = "";
    html.style.width = "";
    html.style.height = "";

    // Restaurar posición
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
    
    // Auto-focus en el primer elemento
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

    // Cancelar request anterior si existe
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
      // Si es un AbortError, ignorar (request cancelado)
      if (isAbortError(err)) {
        return;
      }
      
      // Extraer mensaje de error de forma segura
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
  <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 animate-pulse">
    <div className="bg-white rounded-2xl shadow-xl h-[300px] sm:h-[400px] lg:h-[500px]" />
    <div className="space-y-6">
      <div className="h-12 bg-slate-200 rounded-lg w-3/4" />
      <div className="h-8 bg-slate-200 rounded-lg w-1/4" />
      <div className="h-32 bg-slate-200 rounded-xl" />
      <div className="h-16 bg-slate-200 rounded-xl" />
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
  <div className="text-center py-20 sm:py-32">
    <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 max-w-md mx-auto">
      <PackageX className="w-20 h-20 sm:w-24 sm:h-24 mx-auto text-red-500 mb-6" />
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-4 leading-tight">
        {title}
      </h2>
      <p className="text-slate-600 text-lg sm:text-xl leading-relaxed mb-6">
        {message}
      </p>
      {onRetry && (
        <Button
          onClick={onRetry}
          size="lg"
          className="min-h-[52px] px-8 text-lg font-semibold rounded-xl touch-manipulation"
        >
          Reintentar
        </Button>
      )}
    </div>
  </div>
);

const StockBadge = ({ inStock }: { inStock: boolean }) => {
  if (inStock) {
    return (
      <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 text-base sm:text-lg font-semibold rounded-lg shadow-md">
        ✓ Disponible en stock
      </Badge>
    );
  }

  return (
    <Badge className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 text-base sm:text-lg font-semibold rounded-lg shadow-md">
      ✕ Sin stock
    </Badge>
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

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  if (imageState.isLoading && !imageError) {
    return (
      <div className="w-full h-[300px] sm:h-[400px] lg:h-[500px] flex items-center justify-center bg-slate-100 rounded-2xl">
        <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 animate-spin text-slate-400" />
      </div>
    );
  }

  if (imageState.hasError || imageError) {
    return (
      <div className="w-full h-[300px] sm:h-[400px] lg:h-[500px] flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
        <ImageOff className="w-16 h-16 sm:w-20 sm:h-20 mb-4" />
        <p className="text-lg sm:text-xl font-medium">Sin imagen disponible</p>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className="relative w-full group cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2 active:scale-[0.98] transition-all rounded-2xl overflow-hidden bg-white shadow-xl"
      aria-label="Ver imagen en tamaño completo"
      type="button"
    >
      <img
        src={src}
        alt={alt}
        onError={handleImageError}
        className="w-full h-[300px] sm:h-[400px] lg:h-[500px] object-contain p-6 sm:p-8"
        loading="lazy"
        decoding="async"
      />
      
      {/* Overlay con icono de zoom */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 group-active:bg-black/10 transition-colors flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded-full p-3 sm:p-4 shadow-lg">
          <ZoomIn className="w-6 h-6 sm:w-8 sm:h-8 text-slate-700" />
        </div>
      </div>
    </button>
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

  // Prevenir scroll con touch
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
        className="fixed inset-0 bg-black/95 flex items-center justify-center z-[9999] p-4 sm:p-6"
        style={{
          ...getSafeAreaStyle(),
          height: "100dvh",
        }}
        onClick={handleBackdropClick}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        role="dialog"
        aria-modal="true"
        aria-label="Vista ampliada de imagen"
      >
        <motion.div
          className="relative max-h-[85vh] max-w-[90vw] flex items-center justify-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <img
            src={imageSrc}
            alt={imageAlt}
            className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />
        </motion.div>

        {/* Close button - Touch optimizado */}
        <Button
          className="fixed top-4 right-4 sm:top-6 sm:right-6 min-h-[52px] min-w-[52px] sm:min-h-[56px] sm:min-w-[56px] rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 backdrop-blur-md text-white shadow-2xl border-2 border-white/30 transition-all z-10 touch-manipulation"
          onClick={onClose}
          aria-label="Cerrar vista ampliada"
          type="button"
        >
          <X className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.5} />
        </Button>

        {/* Hint para cerrar */}
        <div className="fixed bottom-6 left-0 right-0 text-center px-4 sm:bottom-8 pointer-events-none">
          <motion.p
            className="text-white/90 text-sm sm:text-base font-medium bg-black/40 backdrop-blur-sm rounded-full px-6 py-3 inline-block"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {isTouchDevice()
              ? "Toca fuera de la imagen para cerrar"
              : "Presiona ESC o haz clic fuera para cerrar"}
          </motion.p>
        </div>
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

  const handleClick = useCallback(() => {
    if (isAdding || inCart || !product.inStock) return;

    setIsAdding(true);
    onAdd(product);

    // Feedback visual
    setTimeout(() => {
      setIsAdding(false);
    }, 600);
  }, [isAdding, inCart, product, onAdd]);

  const isDisabled = !product.inStock || inCart || isAdding;

  return (
    <Button
      size="lg"
      disabled={isDisabled}
      onClick={handleClick}
      className="w-full min-h-[56px] sm:min-h-[64px] text-lg sm:text-xl font-bold rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed touch-manipulation"
      aria-label={inCart ? "Producto agregado" : "Agregar producto a consulta"}
    >
      {isAdding && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
      {inCart ? "✓ Agregado a consulta" : "Agregar a consulta"}
    </Button>
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

  // Precargar imagen en background
  useEffect(() => {
    if (product?.image) {
      const img = new Image();
      img.src = product.image;
    }
  }, [product]);

  /* ================================
     RENDER
  ================================= */
  return (
    <div 
      className="bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50"
      style={{
        ...getSafeAreaStyle(),
        minHeight: "100dvh",
      }}
    >
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* BACK BUTTON - Touch Friendly */}
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-6 sm:mb-8 gap-2 min-h-[52px] px-5 text-base sm:text-lg font-semibold hover:bg-slate-200 active:bg-slate-300 transition-all rounded-xl shadow-sm hover:shadow-md touch-manipulation"
          aria-label="Volver atrás"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
          Volver
        </Button>

        {/* LOADING STATE */}
        {isLoading && <ProductSkeleton />}

        {/* ERROR STATE */}
        {!isLoading && error && (
          <ErrorState
            title="Error al cargar"
            message={error}
            onRetry={refetch}
          />
        )}

        {/* NOT FOUND STATE */}
        {!isLoading && !error && !product && (
          <ErrorState
            title="Producto no encontrado"
            message="Este producto no existe o fue eliminado del catálogo."
          />
        )}

        {/* PRODUCT CONTENT */}
        {!isLoading && !error && product && (
          <motion.div
            className="grid lg:grid-cols-2 gap-8 lg:gap-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {/* IMAGE SECTION */}
            <div className="relative">
              {product.image ? (
                <ProductImage
                  src={product.image}
                  alt={product.name}
                  onClick={handleOpenModal}
                />
              ) : (
                <div className="w-full h-[300px] sm:h-[400px] lg:h-[500px] flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 shadow-xl">
                  <ImageOff className="w-16 h-16 sm:w-20 sm:h-20 mb-4" />
                  <p className="text-lg sm:text-xl font-medium">
                    Sin imagen disponible
                  </p>
                </div>
              )}
            </div>

            {/* INFO SECTION */}
            <div className="space-y-6 sm:space-y-8">
              {/* Title & Stock */}
              <div className="space-y-4">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight tracking-tight">
                  {product.name}
                </h1>

                <StockBadge inStock={product.inStock} />
              </div>

              {/* Description */}
              {product.description && (
                <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-md">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-3">
                    Descripción
                  </h2>
                  <p className="text-slate-700 text-base sm:text-lg leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}

              {/* CTA Button */}
              <AddToCartButton
                product={product}
                inCart={inCart}
                onAdd={handleAddToCart}
              />

              {/* Hint text */}
              {product.image && (
                <p className="text-slate-500 text-center text-sm sm:text-base leading-relaxed">
                  💡 Toca la imagen para verla en tamaño completo
                </p>
              )}

              {/* Additional info */}
              {!product.inStock && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-lg">
                  <p className="text-amber-800 text-sm sm:text-base font-medium">
                    ⚠️ Este producto no está disponible actualmente. Puedes agregarlo
                    a tu consulta para recibir notificaciones cuando vuelva a estar
                    en stock.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </main>

      {/* IMAGE MODAL */}
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