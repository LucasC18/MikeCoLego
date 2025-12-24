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
    if (!newOpen) onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="
          w-[96vw] sm:w-[92vw] md:w-[90vw] lg:w-[85vw] xl:w-full
          max-w-6xl
          h-[92vh]
          p-0
          bg-neutral-950
          border border-white/10
          flex flex-col
          overflow-hidden
        "
      >
        {/* CLOSE */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-50 bg-black/60 backdrop-blur-sm rounded-full p-2 text-white/80 hover:text-white hover:bg-black/80 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 h-full min-h-0">

          {/* IMAGE */}
          <div className="relative w-full h-[220px] sm:h-[300px] lg:h-full">
            <motion.img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>

          {/* INFO */}
          <div className="flex flex-col h-full min-h-0">

            {/* SCROLLABLE INFO */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-8 space-y-4">

              <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold tracking-tight pr-10 lg:pr-0">
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
                      <Package className="w-4 h-4 mr-1.5" />
                      Disponible
                    </>
                  ) : (
                    <>
                      <PackageX className="w-4 h-4 mr-1.5" />
                      No disponible
                    </>
                  )}
                </Badge>

                <Badge
                  variant="outline"
                  className="px-2.5 py-1 text-xs sm:text-sm bg-purple-500/20 text-purple-400 border-purple-500/40 font-semibold"
                >
                  {product.category}
                </Badge>
              </div>

              {/* DESCRIPTION */}
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* CTA STICKY */}
            <div
              className="
                sticky
                bottom-0
                z-40
                border-t
                border-white/10
                p-4 sm:p-5
                bg-neutral-950
              "
            >
              <Button
                disabled={!product.inStock || inCart}
                onClick={() => addToCart(product)}
                size="lg"
                variant={inCart ? "outline" : "default"}
                className={`w-full font-semibold transition-all ${
                  inCart
                    ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/50 hover:bg-cyan-500/30"
                    : product.inStock
                    ? "bg-cyan-500 hover:bg-cyan-600 text-white"
                    : "bg-muted/50 text-muted-foreground cursor-not-allowed"
                }`}
              >
                {inCart ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Ya en consulta
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
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
