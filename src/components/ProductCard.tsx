import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Check,
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
const ANIMATION_DURATION = 0.3;
const TOAST_DURATION = 2000;
const FEATURED_THRESHOLD = 4;

/* ================================
   SUB-COMPONENTS
================================= */
const FeaturedBadge = React.memo(() => (
  <motion.div
    initial={{ scale: 0.9, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ delay: 0.2 }}
    className="absolute top-3 left-3 z-20"
  >
    <div className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white border border-amber-400/40">
      <Sparkles className="w-3 h-3" />
      DESTACADO
    </div>
  </motion.div>
));

FeaturedBadge.displayName = "FeaturedBadge";

const ImageSkeleton = React.memo(() => (
  <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-800 animate-pulse" />
));

ImageSkeleton.displayName = "ImageSkeleton";

const ImagePlaceholder = React.memo(() => (
  <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-slate-700 to-slate-800">
    <ImageOff className="w-10 h-10 sm:w-12 sm:h-12 text-slate-600" />
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
          className={`w-full h-full object-cover transition-opacity duration-400 ${
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
  <motion.div
    initial={{ scale: 0.9, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ delay: 0.15 }}
    className="absolute bottom-3 left-3 z-20"
  >
    <Badge
      className={`px-3 py-1.5 text-xs sm:text-sm font-semibold shadow-lg border ${
        inStock
          ? "bg-gradient-to-r from-emerald-500 to-emerald-600 border-emerald-400/40 text-white"
          : "bg-gradient-to-r from-rose-500 to-red-600 border-rose-400/40 text-white"
      }`}
    >
      {inStock ? (
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Disponible
        </span>
      ) : (
        "Agotado"
      )}
    </Badge>
  </motion.div>
));

StockBadge.displayName = "StockBadge";

const ProductTitle = React.memo(({ name }: { name: string }) => (
  <h3 className="font-semibold text-sm sm:text-base line-clamp-2 text-white group-hover:text-violet-300 transition-colors">
    {name}
  </h3>
));

ProductTitle.displayName = "ProductTitle";

const ProductDescription = React.memo(
  ({ description }: { description?: string }) => {
    if (!description) return null;

    return (
      <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 leading-relaxed">
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
    prefersReducedMotion: boolean;
  }) => {
    if (inCart) {
      return (
        <Button
          disabled
          variant="outline"
          size="sm"
          className="w-full h-11 text-sm sm:text-base font-semibold bg-slate-800/40 border-slate-700/50 text-white hover:bg-slate-800/60 transition-all touch-manipulation"
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
        className="relative w-full h-11 text-sm sm:text-base font-semibold overflow-hidden shadow-lg touch-manipulation disabled:opacity-50 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-0 transition-all duration-200"
      >
        <span className="relative z-10 flex items-center justify-center">
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
        </span>
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
    const prefersReducedMotion = useReducedMotion() || false;

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
            "border border-emerald-500/40 bg-slate-900/95 backdrop-blur-md",
          description: (
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/20 p-2 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-300">
                  Agregado a la consulta
                </p>
                <p className="text-xs text-slate-400">{product.name}</p>
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
        initial={prefersReducedMotion ? undefined : { opacity: 0, y: 15 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={
          prefersReducedMotion
            ? undefined
            : {
                delay: index * ANIMATION_DELAY_MULTIPLIER,
                duration: ANIMATION_DURATION,
                ease: "easeOut",
              }
        }
        whileHover={prefersReducedMotion ? undefined : { y: -4 }}
        onClick={handleCardClick}
        className="group relative bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden flex flex-col h-full cursor-pointer transition-all duration-200 hover:bg-slate-800/40 hover:border-slate-600/60 hover:shadow-xl"
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
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800">
          <ProductImage
            src={product.image}
            alt={product.name}
            imageState={imageState}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />

          {/* Overlay hover effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />

          {/* STOCK BADGE */}
          <StockBadge inStock={product.inStock} />
        </div>

        {/* CONTENT */}
        <div className="relative p-4 sm:p-4 flex flex-col gap-2 sm:gap-2.5 flex-1">
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
              prefersReducedMotion={prefersReducedMotion}
            />
          </div>
        </div>

        {/* Click hint overlay - solo visible en hover en desktop */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 pointer-events-none hidden sm:flex items-center justify-center"
        >
          <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-xl border border-white/20">
            <p className="text-xs font-semibold text-slate-700">
              Click para ver detalles
            </p>
          </div>
        </motion.div>
      </motion.article>
    );
  }
);

ProductCard.displayName = "ProductCard";
export default ProductCard;