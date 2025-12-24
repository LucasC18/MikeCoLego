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
          w-[96vw]
          sm:w-[92vw]
          md:w-[90vw]
          lg:w-[85vw]
          xl:w-full
          max-h-[92vh]
          sm:max-h-[94vh]
          md:max-h-[95vh]
          p-0
          bg-neutral-950
          border border-white/10
          overflow-hidden
          flex
          flex-col
        "
      >
        {/* Close button (visible on all screens but positioned better) */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 z-50 bg-black/60 backdrop-blur-sm rounded-full p-1.5 sm:p-2 text-white/80 hover:text-white hover:bg-black/80 transition-all"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 h-full max-h-[92vh] sm:max-h-[94vh] md:max-h-[95vh]">

          {/* IMAGE */}
          <div className="relative w-full h-[180px] xs:h-[220px] sm:h-[280px] md:h-[320px] lg:h-full flex-shrink-0">
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
          <div className="flex flex-col px-4 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6 lg:px-10 lg:py-8 overflow-y-auto max-h-[calc(92vh-180px)] xs:max-h-[calc(92vh-220px)] sm:max-h-[calc(94vh-280px)] md:max-h-[calc(95vh-320px)] lg:max-h-full">

            {/* TOP */}
            <div className="space-y-2.5 sm:space-y-3 md:space-y-4 flex-1 pb-3 sm:pb-4">

              <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-bold tracking-tight leading-tight pr-8 sm:pr-10 lg:pr-0">
                {product.name}
              </h2>

              {/* BADGES */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <Badge
                  className={`px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] xs:text-xs sm:text-sm font-semibold flex items-center ${
                    product.inStock
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                  }`}
                >
                  {product.inStock ? (
                    <>
                      <Package className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mr-1 sm:mr-1.5" />
                      Disponible
                    </>
                  ) : (
                    <>
                      <PackageX className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mr-1 sm:mr-1.5" />
                      No disponible
                    </>
                  )}
                </Badge>

                <Badge
                  variant="outline"
                  className="px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] xs:text-xs sm:text-sm bg-purple-500/20 text-purple-400 border-purple-500/50 font-semibold"
                >
                  {product.category}
                </Badge>
              </div>

              {/* DESCRIPTION */}
              <p className="text-xs xs:text-sm sm:text-base text-gray-300 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* CTA */}
            <div className="pt-3 sm:pt-4 border-t border-white/10 mt-auto flex-shrink-0">
              <Button
                disabled={!product.inStock || inCart}
                onClick={() => {
                  addToCart(product)
                }}
                size="lg"
                variant={inCart ? "outline" : "default"}
                className={`w-full h-10 xs:h-11 sm:h-12 md:h-13 lg:h-14 text-xs xs:text-sm sm:text-base font-semibold transition-all ${
                  inCart
                    ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/50 hover:bg-cyan-500/30"
                    : product.inStock
                    ? "bg-cyan-500 hover:bg-cyan-600 text-white"
                    : "bg-muted/50 text-muted-foreground cursor-not-allowed"
                }`}
              >
                {inCart ? (
                  <>
                    <Check className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                    Ya en consulta
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
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