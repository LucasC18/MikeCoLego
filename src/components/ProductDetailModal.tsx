import { Product } from "@/types/product"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, PackageX, Plus, Check, X, Expand } from "lucide-react"
import { useCart } from "@/context/CartContext"
import { memo, useCallback, useEffect, useState } from "react"

interface Props {
  product: Product | null
  open: boolean
  onClose: () => void
}

const ProductDetailModal = memo(({ product, open, onClose }: Props) => {
  const { addToCart, isInCart } = useCart()

  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)

  /* ------------------ efectos UX ------------------ */

  useEffect(() => {
    if (showFullImage) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [showFullImage])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showFullImage) {
        setShowFullImage(false)
      }
    }

    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [showFullImage])

  /* ------------------ handlers ------------------ */

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        onClose()
        setTimeout(() => {
          setImageLoaded(false)
          setImageError(false)
          setShowFullImage(false)
        }, 300)
      }
    },
    [onClose]
  )

  const handleAddToCart = useCallback(() => {
    if (product) addToCart(product)
  }, [product, addToCart])

  if (!product) return null

  const inCart = isInCart(product.id)
  const canAddToCart = product.inStock && !inCart

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="
            w-[95vw] sm:w-[90vw] lg:w-[85vw]
            max-w-5xl max-h-[95vh]
            p-0 bg-neutral-950
            border border-white/10
            overflow-hidden
          "
        >
          <DialogTitle className="sr-only">{product.name}</DialogTitle>

          {/* cerrar */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-50 bg-black/70 rounded-full p-2 text-white hover:bg-black"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col lg:grid lg:grid-cols-2 h-full">

            {/* -------- imagen -------- */}
            <div className="relative h-[40vh] lg:h-full bg-neutral-900 flex items-center justify-center">

              {!imageError ? (
                <img
                  src={product.image}
                  alt={product.name}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="w-16 h-16 text-neutral-600" />
              )}

              {/* botón ver imagen completa */}
              {imageLoaded && !imageError && (
                <button
                  onClick={() => setShowFullImage(true)}
                  className="
                    absolute bottom-4 left-1/2 -translate-x-1/2
                    flex items-center gap-2
                    bg-black/80 backdrop-blur-sm
                    text-white px-4 py-2 rounded-full
                    text-sm font-semibold
                    hover:bg-black transition
                  "
                >
                  <Expand className="w-4 h-4" />
                  Ver imagen completa
                </button>
              )}
            </div>

            {/* -------- info -------- */}
            <div className="flex flex-col flex-1">

              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">

                <h2 className="text-3xl font-bold text-white">
                  {product.name}
                </h2>

                <div className="flex gap-2 flex-wrap">
                  <Badge className={product.inStock
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-red-500/20 text-red-400"}>
                    {product.inStock ? "Disponible" : "No disponible"}
                  </Badge>

                  <Badge variant="outline">
                    {product.category}
                  </Badge>
                </div>

                <p className="text-gray-300 leading-relaxed">
                  {product.description}
                </p>

              </div>

              <div className="border-t border-white/10 p-5">
                <Button
                  disabled={!canAddToCart}
                  onClick={handleAddToCart}
                  className="w-full h-12 font-semibold"
                >
                  {inCart ? (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Ya en consulta
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 mr-2" />
                      Agregar a consulta
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* -------- LIGHTBOX FULLSCREEN -------- */}
      {showFullImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setShowFullImage(false)}
        >
          <button
            onClick={() => setShowFullImage(false)}
            className="absolute top-4 right-4 bg-black/70 rounded-full p-3 text-white"
          >
            <X className="w-6 h-6" />
          </button>

          <img
            src={product.image}
            alt={product.name}
            className="max-w-full max-h-full object-contain animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
})

ProductDetailModal.displayName = "ProductDetailModal"
export default ProductDetailModal
