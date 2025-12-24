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
            <CheckCircle2 className="w-5 h-5 sm:w-7 sm:h-7 text-emerald-400" />
            <div>
              <p className="text-sm sm:text-base font-semibold text-emerald-300">
                Agregado a la consulta
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
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
        className="group relative glass-card rounded-lg sm:rounded-xl overflow-hidden hover-glow cursor-pointer flex flex-col h-full"
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
        <div className="p-3 sm:p-4 md:p-5 flex flex-col gap-2 sm:gap-3 flex-1">
          {/* TITLE + STOCK */}
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <h3 className="font-semibold text-sm sm:text-base leading-snug line-clamp-2">
              {product.name}
            </h3>

            <Badge
              variant="outline"
              className={`shrink-0 text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 ${
                product.inStock
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : "bg-red-500/20 text-red-400 border-red-500/30"
              }`}
            >
              {product.inStock ? (
                <>
                  <Package className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                  <span className="hidden sm:inline">Disponible</span>
                  <span className="sm:hidden">Disp.</span>
                </>
              ) : (
                <>
                  <PackageX className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                  <span className="hidden sm:inline">No disponible</span>
                  <span className="sm:hidden">No disp.</span>
                </>
              )}
            </Badge>
          </div>

          {/* CATEGORY */}
          <Badge
            variant="outline"
            className="w-fit text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 bg-secondary/20 text-secondary border-secondary/50"
          >
            {product.category}
          </Badge>

          {/* DESCRIPTION */}
          {product.description && (
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2 sm:line-clamp-3">
              {product.description}
            </p>
          )}

          {/* ACTION */}
          <motion.div
            animate={inCart ? { scale: [1, 1.05, 1] } : { scale: 1 }}
            transition={{ duration: 0.25 }}
            className="pt-1 sm:pt-2 mt-auto"
          >
            <Button
              onClick={handleAdd}
              disabled={!product.inStock}
              variant={inCart ? "outline" : "default"}
              size="sm"
              className={`w-full h-8 sm:h-9 md:h-10 text-xs sm:text-sm transition-all duration-300 ${
                inCart
                  ? "bg-primary/20 text-primary border-primary/50"
                  : product.inStock
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground neon-glow"
                  : "bg-muted/50 text-muted-foreground cursor-not-allowed"
              }`}
            >
              {inCart ? (
                <>
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">En consulta</span>
                  <span className="xs:hidden">Agregado</span>
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Agregar a consulta</span>
                  <span className="xs:hidden">Agregar</span>
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