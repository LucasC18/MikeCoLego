import { Product } from "@/types/product"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, PackageX, Plus, Check, X } from "lucide-react"
import { useCart } from "@/context/CartContext"
import { motion } from "framer-motion"

interface Props {
  product: Product | null
  open: boolean
  onClose: () => void
}

const ProductDetailModal = ({ product, open, onClose }: Props) => {
  const { addToCart, isInCart } = useCart()
  if (!product) return null

  const inCart = isInCart(product.id)

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="
          max-w-6xl
          w-[95vw]
          sm:w-full
          max-h-[90vh]
          sm:max-h-[95vh]
          p-0
          bg-neutral-950
          border border-white/10
          overflow-hidden
          flex
          flex-col
        "
      >
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-50 lg:hidden bg-black/60 backdrop-blur-sm rounded-full p-2 text-white/80 hover:text-white hover:bg-black/80 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 h-full max-h-[90vh] sm:max-h-[95vh]">

          {/* IMAGE */}
          <div className="relative w-full h-[200px] sm:h-[280px] lg:h-full flex-shrink-0">
            <motion.img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />

            {/* overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>

          {/* INFO */}
          <div className="flex flex-col px-5 py-5 sm:px-8 sm:py-6 lg:px-10 lg:py-8 overflow-y-auto max-h-[calc(90vh-200px)] sm:max-h-[calc(95vh-280px)] lg:max-h-full">

            {/* TOP */}
            <div className="space-y-3 sm:space-y-4 lg:space-y-5 flex-1 pb-4">

              <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold tracking-tight leading-tight pr-8 lg:pr-0">
                {product.name}
              </h2>

              {/* BADGES */}
              <div className="flex flex-wrap gap-2">
                <Badge
                  className={`px-2.5 py-1 text-xs sm:text-sm font-semibold flex items-center ${
                    product.inStock
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                  }`}
                >
                  {product.inStock ? (
                    <>
                      <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                      Disponible
                    </>
                  ) : (
                    <>
                      <PackageX className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                      No disponible
                    </>
                  )}
                </Badge>

                <Badge
                  variant="outline"
                  className="px-2.5 py-1 text-xs sm:text-sm bg-secondary/20 text-secondary border-secondary/50"
                >
                  {product.category}
                </Badge>
              </div>

              {/* DESCRIPTION */}
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* CTA */}
            <div className="pt-4 border-t border-white/10 mt-auto flex-shrink-0">
              <Button
                disabled={!product.inStock || inCart}
                onClick={() => {
                  addToCart(product)
                }}
                size="lg"
                variant={inCart ? "outline" : "default"}
                className={`w-full h-11 sm:h-12 lg:h-14 text-sm sm:text-base font-semibold ${
                  inCart
                    ? "bg-primary/20 text-primary border-primary/50"
                    : product.inStock
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground cursor-not-allowed"
                }`}
              >
                {inCart ? (
                  <>
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Ya en consulta
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Agregar a consulta
                  </>
                )}
              </Button>
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ProductDetailModal