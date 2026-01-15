import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Plus,
  Check,
  PackageX,
  CheckCircle2,
  ImageOff,
  Sparkles,
  ShoppingCart,
  Loader2,
} from "lucide-react";

import { Product } from "@/types/product";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

/* ================================
   TYPES & INTERFACES
================================= */
interface ProductCardProps {
  product: Product;
  index: number;
  onNavigate?: (productId: string) => void;
}

interface ImageState {
  isLoaded: boolean;
  hasError: boolean;
  isLoading: boolean;
}

/* ================================
   CONSTANTS
================================= */
const ANIMATION_DELAY_MULTIPLIER = 0.05;
const ANIMATION_DURATION = 0.4;
const TOAST_DURATION = 2000;
const FEATURED_THRESHOLD = 4;

/* ================================
   HELPERS
================================= */
const getFeaturedBadgeStyle = (): React.CSSProperties => {
  return {
    background: "linear-gradient(135deg, #f59e0b, #f97316)",
    color: "white",
  };
};

/* ================================
   SUB-COMPONENTS
================================= */
const FeaturedBadge = React.memo(() => (
  <div
    className="absolute top-3 left-3 z-20 flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-full shadow-lg"
    style={getFeaturedBadgeStyle()}
  >
    <Sparkles className="w-3 h-3" />
    DESTACADO
  </div>
));

FeaturedBadge.displayName = "FeaturedBadge";

const ImageSkeleton = React.memo(() => (
  <div className="absolute inset-0 bg-purple-100 animate-pulse" />
));

ImageSkeleton.displayName = "ImageSkeleton";

const ImagePlaceholder = React.memo(() => (
  <div className="flex items-center justify-center w-full h-full text-purple-300 bg-gradient-to-br from-purple-50 to-pink-50">
    <ImageOff className="w-10 h-10 sm:w-12 sm:h-12" />
  </div>
));

ImagePlaceholder.displayName = "ImagePlaceholder";

const ProductImage = React.memo(
  ({
    src,
    alt,
    imageState,
    onLoad,
    onError,
  }: {
    src: string | undefined;
    alt: string;
    imageState: ImageState;
    onLoad: () => void;
    onError: () => void;
  }) => {
    if (!src || imageState.hasError) {
      return <ImagePlaceholder />;
    }

    return (
      <>
        {!imageState.isLoaded && <ImageSkeleton />}
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageState.isLoaded ? "opacity-100" : "opacity-0"
          }`}
          loading="lazy"
          decoding="async"
          onLoad={onLoad}
          onError={onError}
        />
      </>
    );
  }
);

ProductImage.displayName = "ProductImage";

const StockBadge = React.memo(({ inStock }: { inStock: boolean }) => (
  <div className="absolute bottom-3 left-3 z-20">
    <Badge
      className={`px-2.5 py-1.5 text-xs sm:text-sm font-bold shadow-lg ${
        inStock
          ? "bg-emerald-500 hover:bg-emerald-600"
          : "bg-red-500 hover:bg-red-600"
      } text-white`}
    >
      {inStock ? "✓ Disponible" : "✕ Agotado"}
    </Badge>
  </div>
));

StockBadge.displayName = "StockBadge";

const ProductTitle = React.memo(({ name }: { name: string }) => (
  <h3 className="font-bold text-sm sm:text-base line-clamp-2 text-slate-900 group-hover:text-primary transition-colors">
    {name}
  </h3>
));

ProductTitle.displayName = "ProductTitle";

const ProductDescription = React.memo(
  ({ description }: { description?: string }) => {
    if (!description) return null;

    return (
      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
        {description}
      </p>
    );
  }
);

ProductDescription.displayName = "ProductDescription";

const AddToCartButton = React.memo(
  ({
    inCart,
    inStock,
    onClick,
    isAdding,
  }: {
    inCart: boolean;
    inStock: boolean;
    onClick: (e: React.MouseEvent) => void;
    isAdding: boolean;
  }) => {
    if (inCart) {
      return (
        <Button
          disabled
          variant="outline"
          size="sm"
          className="w-full min-h-[44px] text-sm sm:text-base font-semibold touch-manipulation"
        >
          <Check className="w-4 h-4 mr-2" />
          En consulta
        </Button>
      );
    }

    return (
      <Button
        onClick={onClick}
        disabled={!inStock || isAdding}
        size="sm"
        className="w-full min-h-[44px] text-sm sm:text-base font-semibold touch-manipulation hover:scale-105 active:scale-95 transition-transform"
      >
        {isAdding ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Agregando...
          </>
        ) : (
          <>
            <ShoppingCart className="w-4 h-4 mr-2" />
            Agregar
          </>
        )}
      </Button>
    );
  }
);

AddToCartButton.displayName = "AddToCartButton";

/* ================================
   MAIN COMPONENT
================================= */
const ProductCard = React.forwardRef<HTMLElement, ProductCardProps>(
  ({ product, index, onNavigate }, ref) => {
    const { addToCart, isInCart } = useCart();
    const { toast } = useToast();
    const prefersReducedMotion = useReducedMotion();

    const [imageState, setImageState] = React.useState<ImageState>({
      isLoaded: false,
      hasError: false,
      isLoading: true,
    });
    const [isAdding, setIsAdding] = React.useState(false);

    const inCart = React.useMemo(() => isInCart(product.id), [isInCart, product.id]);
    const isFeatured = React.useMemo(
      () => product.inStock && index < FEATURED_THRESHOLD,
      [product.inStock, index]
    );

    const handleImageLoad = React.useCallback(() => {
      setImageState({
        isLoaded: true,
        hasError: false,
        isLoading: false,
      });
    }, []);

    const handleImageError = React.useCallback(() => {
      setImageState({
        isLoaded: false,
        hasError: true,
        isLoading: false,
      });
    }, []);

    const handleAddToCart = React.useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();

        if (inCart || !product.inStock || isAdding) return;

        setIsAdding(true);
        addToCart(product);

        toast({
          duration: TOAST_DURATION,
          className:
            "toast-neon border border-emerald-500/40 bg-black/85 backdrop-blur-md",
          description: (
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-sm font-semibold text-emerald-300">
                  Agregado a la consulta
                </p>
                <p className="text-xs text-muted-foreground">{product.name}</p>
              </div>
            </div>
          ),
        });

        setTimeout(() => {
          setIsAdding(false);
        }, 600);
      },
      [inCart, product, isAdding, addToCart, toast]
    );

    const handleCardClick = React.useCallback(() => {
      if (onNavigate) {
        onNavigate(product.id);
      }
    }, [onNavigate, product.id]);

    return (
      <motion.article
        ref={ref}
        initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={
          prefersReducedMotion
            ? undefined
            : {
                delay: index * ANIMATION_DELAY_MULTIPLIER,
                duration: ANIMATION_DURATION,
              }
        }
        onClick={handleCardClick}
        className="group relative glass-card-neon card-neon-border rounded-xl overflow-hidden flex flex-col h-full cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-lg hover:shadow-xl"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleCardClick();
          }
        }}
        aria-label={`Ver detalles de ${product.name}`}
      >
        {/* DESTACADO BADGE */}
        {isFeatured && <FeaturedBadge />}

        {/* IMAGE CONTAINER */}
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50">
          <ProductImage
            src={product.image}
            alt={product.name}
            imageState={imageState}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />

          {/* Overlay hover effect */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />

          {/* STOCK BADGE */}
          <StockBadge inStock={product.inStock} />
        </div>

        {/* CONTENT */}
        <div className="p-4 sm:p-5 flex flex-col gap-2 sm:gap-3 flex-1">
          <ProductTitle name={product.name} />

          <ProductDescription description={product.description} />

          {/* Spacer */}
          <div className="flex-1 min-h-[8px]" />

          {/* ACTION BUTTON */}
          <div className="mt-auto">
            <AddToCartButton
              inCart={inCart}
              inStock={product.inStock}
              onClick={handleAddToCart}
              isAdding={isAdding}
            />
          </div>
        </div>

        {/* Click hint overlay - solo visible en hover en desktop */}
        <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex items-center justify-center bg-black/0">
          <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
            <p className="text-xs font-semibold text-slate-700">
              Click para ver detalles
            </p>
          </div>
        </div>
      </motion.article>
    );
  }
);

ProductCard.displayName = "ProductCard";
export default ProductCard;