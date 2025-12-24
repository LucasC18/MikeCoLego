import * as React from "react"
import { motion } from "framer-motion"
import {
  Plus,
  Check,
  Package,
  PackageX,
  CheckCircle2,
} from "lucide-react"
import { Product } from "@/types/product"
import { useCart } from "@/context/CartContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface ProductCardProps {
  product: Product
  index: number
  onOpenDetail?: (product: Product) => void
}

const ProductCard = React.forwardRef<HTMLElement, ProductCardProps>(
  ({ product, index, onOpenDetail }, ref) => {
    const { addToCart, isInCart } = useCart()
    const { toast } = useToast()
    const inCart = isInCart(product.id)

    const handleAdd = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (inCart || !product.inStock) return

      addToCart(product)

      toast({
        duration: 2000,
        className:
          "toast-neon border border-emerald-500/40 bg-black/85 backdrop-blur-md",
        description: (
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            <div>
              <p className="font-semibold text-emerald-300">
                Agregado a la consulta
              </p>
              <p className="text-sm text-muted-foreground">
                {product.name}
              </p>
            </div>
          </div>
        ),
      })
    }

    return (
      <motion.article
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.35 }}
        whileHover={{ y: -6 }}
        onClick={() => onOpenDetail?.(product)}
        className="group relative glass-card rounded-xl overflow-hidden hover-glow cursor-pointer flex flex-col h-full"
      >
        {/* IMAGE */}
        <div className="relative aspect-square overflow-hidden">
          <motion.img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
        </div>

        {/* CONTENT */}
        <div className="p-4 flex flex-col gap-3 flex-1">
          {/* TITLE + STOCK */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-base leading-snug line-clamp-2">
              {product.name}
            </h3>

            <Badge
              variant="outline"
              className={`shrink-0 text-xs ${
                product.inStock
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : "bg-red-500/20 text-red-400 border-red-500/30"
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
          </div>

          {/* CATEGORY */}
          <Badge
            variant="outline"
            className="w-fit bg-secondary/20 text-secondary border-secondary/50"
          >
            {product.category}
          </Badge>

          {/* DESCRIPTION */}
          {product.description && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {product.description}
            </p>
          )}

          {/* ACTION */}
          <motion.div
            animate={inCart ? { scale: [1, 1.05, 1] } : { scale: 1 }}
            transition={{ duration: 0.25 }}
            className="pt-2 mt-auto"
          >
            <Button
              onClick={handleAdd}
              disabled={!product.inStock}
              variant={inCart ? "outline" : "default"}
              className={`w-full transition-all duration-300 ${
                inCart
                  ? "bg-primary/20 text-primary border-primary/50"
                  : product.inStock
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground neon-glow"
                  : "bg-muted/50 text-muted-foreground cursor-not-allowed"
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
          </motion.div>
        </div>
      </motion.article>
    )
  }
)

ProductCard.displayName = "ProductCard"
export default ProductCard