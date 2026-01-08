import { Product } from "@/types/product"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  PackageX,
  Plus,
  Check,
  X,
  Expand,
  Loader2
} from "lucide-react"
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
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  /* ---------- RESET TOTAL AL CAMBIAR PRODUCTO (CRÍTICO) ---------- */
  useEffect(() => {
    setShowFullImage(false)
    setImageLoaded(false)
    setImageError(false)
    setIsAddingToCart(false)
  }, [product?.id])

  /* ---------- BLOQUEO DE SCROLL (SAFE PARA iOS) ---------- */
  useEffect(() => {
    if (!showFullImage) {
      document.body.style.overflow = ""
      return
    }

    document.body.style.overflow = "hidden"

    const preventTouch = (e: TouchEvent) => e.preventDefault()
    document.addEventListener("touchmove", preventTouch, { passive: false })

    return () => {
      document.body.style.overflow = ""
      document.removeEventListener("touchmove", preventTouch)
    }
  }, [showFullImage])

  /* ---------- ESC PARA DESKTOP ---------- */
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showFullImage) {
        setShowFullImage(false)
      }
    }
    window.addEventListener("keydown", onEsc)
    return () => window.removeEventListener("keydown", onEsc)
  }, [showFullImage])

  /* ---------- NO CERRAR DIALOG SI LIGHTBOX ESTÁ ABIERTO ---------- */
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen && showFullImage) return
      if (!newOpen) onClose()
    },
    [onClose, showFullImage]
  )

  const handleAddToCart = useCallback(async () => {
    if (!product || isAddingToCart) return
    setIsAddingToCart(true)
    try {
      await addToCart(product)
    } finally {
      setIsAddingToCart(false)
    }
  }, [product, addToCart, isAddingToCart])

  if (!product) return null

  const inCart = isInCart(product.id)
  const canAddToCart = product.inStock && !inCart && !isAddingToCart

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange} modal>
        <DialogContent
          /* FIX SAFARI iOS: bloquear eventos externos */
          onPointerDownOutside={(e) => {
            if (showFullImage) e.preventDefault()
          }}
          onInteractOutside={(e) => {
            if (showFullImage) e.preventDefault()
          }}
          className="
            w-[95vw] sm:w-[90vw] lg:w-[85vw]
            max-w-5xl max-h-[95vh]
            p-0 bg-neutral-950
            border border-white/10
            overflow-y-auto
          "
        >
          <DialogTitle className="sr-only">{product.name}</DialogTitle>

          {/* Cerrar modal */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-50 bg-black/70 rounded-full p-2 text-white hover:bg-black"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col lg:grid lg:grid-cols-2 lg:h-full">
            {/* IMAGEN */}
            <div className="relative h-[40vh] lg:h-full bg-neutral-900 flex items-center justify-center">
              {!imageError ? (
                <>
                  {!imageLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-neutral-500 animate-spin" />
                    </div>
                  )}
                  <img
                    src={product.image}
                    alt={product.name}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                    className={`w-full h-full object-cover transition-opacity ${
                      imageLoaded ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </>
              ) : (
                <div className="text-neutral-500 flex flex-col items-center gap-2">
                  <PackageX className="w-16 h-16" />
                  Imagen no disponible
                </div>
              )}

              {imageLoaded && !imageError && (
                <button
                  onPointerDownCapture={(e) => {
                    e.stopPropagation()
                    setShowFullImage(true)
                  }}
                  className="
                    absolute bottom-4 left-1/2 -translate-x-1/2
                    bg-black/80 text-white px-4 py-2 rounded-full
                    flex items-center gap-2 text-sm
                  "
                >
                  <Expand className="w-4 h-4" />
                  Ver imagen completa
                </button>
              )}
            </div>

            {/* INFO */}
            <div className="flex flex-col flex-1">
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
                <h2 className="text-3xl font-bold text-white">
                  {product.name}
                </h2>

                <div className="flex flex-wrap gap-2">
                  <Badge
                    className={
                      product.inStock
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-red-500/20 text-red-400"
                    }
                  >
                    {product.inStock ? "Disponible" : "No disponible"}
                  </Badge>

                  <Badge variant="outline" className="text-white border-white/20">
                    {product.category}
                  </Badge>
                </div>

                <p className="text-gray-300 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* BOTÓN STICKY MOBILE */}
              <div className="
                border-t border-white/10 p-5
                sticky bottom-0 z-20
                bg-neutral-950
              ">
                <Button
                  className="w-full h-12 font-semibold"
                  disabled={!canAddToCart}
                  onClick={handleAddToCart}
                >
                  {isAddingToCart ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Agregando...
                    </>
                  ) : inCart ? (
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

      {/* LIGHTBOX AISLADO — SAFE iOS */}
      {showFullImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4"
          onPointerDownCapture={(e) => {
            e.stopPropagation()
            setShowFullImage(false)
          }}
        >
          <button
            onPointerDownCapture={(e) => {
              e.stopPropagation()
              setShowFullImage(false)
            }}
            className="absolute top-4 right-4 bg-black/70 p-3 rounded-full text-white"
            aria-label="Cerrar imagen completa"
          >
            <X className="w-6 h-6" />
          </button>

          <img
            src={product.image}
            alt={product.name}
            className="max-w-full max-h-full object-contain"
            onPointerDownCapture={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
})

ProductDetailModal.displayName = "ProductDetailModal"
export default ProductDetailModal
