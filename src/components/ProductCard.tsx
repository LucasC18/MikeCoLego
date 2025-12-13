import { motion } from "framer-motion";
import { Plus, Check, Package, PackageX } from "lucide-react";
import { Product } from "@/types/product";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  product: Product;
  index: number;
}

const ProductCard = ({ product, index }: ProductCardProps) => {
  const { addToCart, isInCart } = useCart();
  const inCart = isInCart(product.id);

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="group relative glass-card rounded-xl overflow-hidden hover-glow"
    >
      {/* Image container */}
      <div className="relative aspect-square overflow-hidden">
        <motion.img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
        
        {/* Stock badge */}
        <Badge
          className={`absolute top-3 right-3 ${
            product.inStock
              ? "bg-neon-green/20 text-neon-green border-neon-green/50"
              : "bg-neon-red/20 text-neon-red border-neon-red/50"
          }`}
        >
          {product.inStock ? (
            <>
              <Package className="w-3 h-3 mr-1" />
              Disponible
            </>
          ) : (
            <>
              <PackageX className="w-3 h-3 mr-1" />
              No disponible
            </>
          )}
        </Badge>

        {/* Category badge */}
        <Badge
          variant="outline"
          className="absolute top-3 left-3 bg-secondary/20 text-secondary border-secondary/50"
        >
          {product.category}
        </Badge>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        <h3 className="font-display font-semibold text-lg text-foreground line-clamp-2 min-h-[3.5rem]">
          {product.name}
        </h3>

        <Button
          onClick={() => addToCart(product)}
          disabled={inCart}
          className={`w-full font-semibold transition-all duration-300 ${
            inCart
              ? "bg-neon-green/20 text-neon-green border border-neon-green/50 hover:bg-neon-green/30"
              : "bg-primary text-primary-foreground hover:bg-primary/80 neon-glow"
          }`}
        >
          {inCart ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              En consulta
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Agregar a consulta
            </>
          )}
        </Button>
      </div>
    </motion.article>
  );
};

export default ProductCard;
