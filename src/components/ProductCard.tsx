import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Check,
  CheckCircle2,
  ImageOff,
  Sparkles,
  ShoppingCart,
  Loader2,
  Eye,
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
    initial={{ scale: 0.8, opacity: 0, y: -10 }}
    animate={{ scale: 1, opacity: 1, y: 0 }}
    transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
    className="absolute top-3 left-3 z-20"
  >
    <div className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-xl shadow-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white border border-amber-400/50 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
      <Sparkles className="w-3 h-3 relative z-10 animate-pulse" />
      <span className="relative z-10">DESTACADO</span>
      <div className="absolute inset-0 bg-amber-300/20 blur-xl" />
    </div>
  </motion.div>
));

FeaturedBadge.displayName = "FeaturedBadge";

const ImageSkeleton = React.memo(() => (
  <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-700 animate-pulse">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-600/20 to-transparent" />
  </div>
));

ImageSkeleton.displayName = "ImageSkeleton";

const ImagePlaceholder = React.memo(() => (
  <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 relative overflow-hidden group">
    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <ImageOff className="w-10 h-10 sm:w-12 sm:h-12 text-slate-600 relative z-10 group-hover:text-slate-500 transition-colors duration-500" />
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
          className={`w-full h-full object-cover transition-all duration-500 ${
            imageState.isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
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
    initial={{ scale: 0.8, opacity: 0, x: -10 }}
    animate={{ scale: 1, opacity: 1, x: 0 }}
    transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
    className="absolute bottom-3 left-3 z-20"
  >
    <Badge
      className={`px-3 py-1.5 text-xs sm:text-sm font-bold shadow-2xl border relative overflow-hidden ${
        inStock
          ? "bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-500 border-emerald-400/50 text-white"
          : "bg-gradient-to-r from-rose-500 via-red-600 to-rose-500 border-rose-400/50 text-white"
      }`}
    >
      {inStock && (
        <div className="absolute inset-0 bg-emerald-300/30 blur-xl" />
      )}
      {!inStock && (
        <div className="absolute inset-0 bg-rose-300/30 blur-xl" />
      )}
      <span className="relative z-10 flex items-center gap-1">
        {inStock ? (
          <>
            <CheckCircle2 className="w-3 h-3" />
            Disponible
          </>
        ) : (
          "Agotado"
        )}
      </span>
    </Badge>
  </motion.div>
));

StockBadge.displayName = "StockBadge";

const ProductTitle = React.memo(({ name }: { name: string }) => (
  <h3 className="font-bold text-sm sm:text-base line-clamp-2 text-slate-100 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all duration-300">
    {name}
  </h3>
));

ProductTitle.displayName = "ProductTitle";

const ProductDescription = React.memo(
  ({ description }: { description?: string }) => {
    if (!description) return null;

    return (
      <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 leading-relaxed group-hover:text-slate-300 transition-colors duration-300">
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
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Button
            disabled
            variant="outline"
            size="sm"
            className="w-full h-11 text-sm sm:text-base font-bold bg-slate-800/60 border-slate-700/50 text-cyan-400 hover:bg-slate-800/60 transition-all touch-manipulation relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-cyan-400/10 blur-lg" />
            <Check className="w-4 h-4 mr-2 relative z-10" />
            <span className="relative z-10">En consulta</span>
          </Button>
        </motion.div>
      );
    }

    return (
      <motion.div
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        <Button
          onClick={onClick}
          disabled={!inStock || isAdding}
          size="sm"
          className="relative w-full h-11 text-sm sm:text-base font-bold overflow-hidden shadow-2xl touch-manipulation disabled:opacity-50 bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 hover:from-cyan-500 hover:to-pink-500 text-white border-0 transition-all duration-300 group/btn"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/30 via-purple-400/30 to-pink-400/30 blur-xl" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000" />
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
      </motion.div>
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
              <div className="bg-emerald-500/20 p-2 rounded-lg border border-emerald-500/30">
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
        initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20, scale: 0.95 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
        transition={
          prefersReducedMotion
            ? undefined
            : {
                delay: index * ANIMATION_DELAY_MULTIPLIER,
                duration: ANIMATION_DURATION,
                type: "spring",
                stiffness: 100,
              }
        }
        whileHover={prefersReducedMotion ? undefined : { y: -6, scale: 1.02 }}
        onClick={handleCardClick}
        className="group relative bg-slate-800/30 backdrop-blur-sm border border-slate-700/40 rounded-2xl overflow-hidden flex flex-col h-full cursor-pointer transition-all duration-300 hover:bg-slate-800/50 hover:border-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-500/10"
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
        {/* Neon glow border effect */}
        <div className="absolute inset-0 rounded-2xl border border-cyan-500/0 group-hover:border-cyan-500/20 transition-all duration-500 pointer-events-none" />
        
        {/* Ambient background glow */}
        <div className="absolute -inset-1 bg-gradient-to-br from-cyan-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-cyan-500/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5 blur-xl transition-all duration-500 opacity-0 group-hover:opacity-100 pointer-events-none" />

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

          {/* Enhanced overlay hover effect with neon gradient */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          />
          
          {/* Neon rim light effect */}
          <div className="absolute inset-0 border-t-2 border-cyan-500/0 group-hover:border-cyan-500/30 transition-all duration-500" />

          {/* STOCK BADGE */}
          <StockBadge inStock={product.inStock} />
        </div>

        {/* CONTENT */}
        <div className="relative p-4 sm:p-5 flex flex-col gap-2.5 sm:gap-3 flex-1">
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

        {/* Click hint overlay - premium neon version */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileHover={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 pointer-events-none hidden sm:flex items-center justify-center"
        >
          <div className="relative bg-slate-900/95 backdrop-blur-xl px-5 py-3 rounded-xl shadow-2xl border border-cyan-500/30 overflow-hidden group/hint">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent translate-x-[-100%] group-hover/hint:translate-x-[100%] transition-transform duration-1000" />
            <p className="text-xs font-bold text-cyan-300 flex items-center gap-2 relative z-10">
              <Eye className="w-3.5 h-3.5" />
              Click para ver detalles
            </p>
          </div>
        </motion.div>

        {/* Top corner accent */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-cyan-500/0 to-transparent group-hover:from-cyan-500/10 transition-all duration-500 pointer-events-none" />
      </motion.article>
    );
  }
);

ProductCard.displayName = "ProductCard";
export default ProductCard;