import { Product } from "@/types/product"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, PackageX, Plus, Check, X, Expand, Loader2 } from "lucide-react"
import { useCart } from "@/context/CartContext"
import { memo, useCallback, useEffect, useState } from "react"

interface Props {
  product: Product | null
  open: boolean
  onClose: () => void
}

const ProductDetailModal = memo(({ product, open, onClose }: Props) => {
  const { addToCart, isInCart } = useCart()

  // Estados para manejo de imagen y UI
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  // Efecto para manejar el overflow del body cuando el lightbox está abierto
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

  // Efecto para manejar la tecla Escape en el lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showFullImage) {
        setShowFullImage(false)
      }
    }

    if (showFullImage) {
      window.addEventListener("keydown", handleKeyDown)
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [showFullImage])

  // Handler para cambios en el estado abierto del dialog
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        onClose()
        // Resetear estados después de un pequeño delay para animaciones
        setTimeout(() => {
          setImageLoaded(false)
          setImageError(false)
          setShowFullImage(false)
          setIsAddingToCart(false)
        }, 300)
      }
    },
    [onClose]
  )

  // Handler para agregar al carrito con feedback visual
  const handleAddToCart = useCallback(async () => {
    if (product && !isAddingToCart) {
      setIsAddingToCart(true)
      try {
        await addToCart(product)
      } finally {
        setIsAddingToCart(false)
      }
    }
  }, [product, addToCart, isAddingToCart])

  // Handler para abrir el lightbox
  const handleShowFullImage = useCallback(() => {
    setShowFullImage(true)
  }, [])

  // Handler para cerrar el lightbox
  const handleCloseFullImage = useCallback(() => {
    setShowFullImage(false)
  }, [])

  // Si no hay producto, no renderizar nada
  if (!product) return null

  const inCart = isInCart(product.id)
  const canAddToCart = product.inStock && !inCart && !isAddingToCart

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
            animate-in fade-in-0 zoom-in-95 duration-200
          "
          aria-describedby="product-description"
        >
          <DialogTitle className="sr-only">{product.name}</DialogTitle>

          {/* Botón de cerrar */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-50 bg-black/70 rounded-full p-2 text-white hover:bg-black transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col lg:grid lg:grid-cols-2 h-full">
            {/* Sección de imagen */}
            <div className="relative h-[40vh] lg:h-full bg-neutral-900 flex items-center justify-center">
              {!imageError ? (
                <>
                  {!imageLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-neutral-600 animate-spin" />
                    </div>
                  )}
                  <img
                    src={product.image}
                    alt={`Imagen de ${product.name}`}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                      imageLoaded ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-neutral-600">
                  <PackageX className="w-16 h-16" />
                  <span className="text-sm">Imagen no disponible</span>
                </div>
              )}

              {/* Botón para ver imagen completa */}
              {imageLoaded && !imageError && (
                <button
                  onClick={handleShowFullImage}
                  className="
                    absolute bottom-4 left-1/2 -translate-x-1/2
                    flex items-center gap-2
                    bg-black/80 backdrop-blur-sm
                    text-white px-4 py-2 rounded-full
                    text-sm font-semibold
                    hover:bg-black transition-colors
                    focus:outline-none focus:ring-2 focus:ring-white/50
                  "
                  aria-label="Ver imagen completa"
                >
                  <Expand className="w-4 h-4" />
                  Ver imagen completa
                </button>
              )}
            </div>

            {/* Sección de información */}
            <div className="flex flex-col flex-1">
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
                <h2 className="text-3xl font-bold text-white" id="product-name">
                  {product.name}
                </h2>

                <div className="flex gap-2 flex-wrap">
                  <Badge
                    className={
                      product.inStock
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        : "bg-red-500/20 text-red-400 border-red-500/30"
                    }
                  >
                    {product.inStock ? "Disponible" : "No disponible"}
                  </Badge>

                  <Badge variant="outline" className="border-white/20 text-white">
                    {product.category}
                  </Badge>
                </div>

                <p
                  className="text-gray-300 leading-relaxed"
                  id="product-description"
                >
                  {product.description}
                </p>
              </div>

              <div className="border-t border-white/10 p-5">
                <Button
                  disabled={!canAddToCart}
                  onClick={handleAddToCart}
                  className="w-full h-12 font-semibold disabled:opacity-50"
                  aria-label={
                    inCart
                      ? "Producto ya agregado a la consulta"
                      : "Agregar producto a la consulta"
                  }
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

      {/* Lightbox para imagen completa */}
      {showFullImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4 animate-in fade-in-0 duration-200"
          onClick={handleCloseFullImage}
          role="dialog"
          aria-modal="true"
          aria-labelledby="lightbox-title"
        >
          <button
            onClick={handleCloseFullImage}
            className="absolute top-4 right-4 bg-black/70 rounded-full p-3 text-white hover:bg-black transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Cerrar imagen completa"
          >
            <X className="w-6 h-6" />
          </button>

          <img
            src={product.image}
            alt={`Imagen completa de ${product.name}`}
            className="max-w-full max-h-full object-contain animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            id="lightbox-title"
          />
        </div>
      )}
    </>
  )
})

ProductDetailModal.displayName = "ProductDetailModal"
export default ProductDetailModal