import { Product } from "@/types/product"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, PackageX, Plus, Check, X } from "lucide-react"
import { useCart } from "@/context/CartContext"
import { memo, useCallback, useState } from "react"

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

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen) {
      onClose()
      setTimeout(() => {
        setImageLoaded(false)
        setImageError(false)
        setShowFullImage(false)
      }, 300)
    }
  }, [onClose])

  const handleAddToCart = useCallback(() => {
    if (product) addToCart(product)
  }, [product, addToCart])

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true)
  }, [])

  const handleImageError = useCallback(() => {
    setImageError(true)
    setImageLoaded(true)
  }, [])

  const toggleFullImage = useCallback(() => {
    if (!imageError && imageLoaded) {
      setShowFullImage(prev => !prev)
    }
  }, [imageError, imageLoaded])

  if (!product) return null

  const inCart = isInCart(product.id)
  const canAddToCart = product.inStock && !inCart

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="
          w-[95vw] sm:w-[90vw] lg:w-[85vw] xl:w-full
          max-w-5xl
          max-h-[95vh] sm:max-h-[90vh]
          p-0
          bg-neutral-950
          border border-white/10
          flex flex-col
          overflow-hidden
          gap-0
        "
        aria-describedby="product-description"
      >
        <DialogTitle className="sr-only">{product.name}</DialogTitle>

        {/* Botón de cierre - más grande en móviles */}
        <button
          onClick={onClose}
          aria-label="Cerrar modal"
          className="
            absolute top-2 right-2 sm:top-3 sm:right-3 z-50 
            bg-black/70 backdrop-blur-sm rounded-full 
            p-2.5 sm:p-2
            text-white/90 hover:text-white hover:bg-black/90 
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-cyan-500
            touch-manipulation
          "
        >
          <X className="w-5 h-5 sm:w-4 sm:h-4" />
        </button>

        {/* Layout adaptativo */}
        <div className="flex flex-col lg:grid lg:grid-cols-2 h-full overflow-hidden">

          {/* Imagen - compacta en móviles, más grande en desktop */}
          <div 
            className="
              relative w-full 
              h-[35vh] sm:h-[40vh] lg:h-full
              flex-shrink-0
              overflow-hidden bg-neutral-900
              cursor-pointer group
            "
            onClick={(e) => {
              e.stopPropagation()
              toggleFullImage()
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                toggleFullImage()
              }
            }}
            aria-label="Ver imagen en pantalla completa"
          >
            
            {/* Skeleton loader */}
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 bg-neutral-800 animate-pulse" />
            )}

            {/* Imagen optimizada */}
            {!imageError ? (
              <img
                src={product.image}
                alt={product.name}
                onLoad={handleImageLoad}
                onError={handleImageError}
                loading="eager"
                decoding="async"
                className={`
                  w-full h-full object-cover
                  transition-opacity duration-500
                  ${imageLoaded ? 'opacity-100' : 'opacity-0'}
                `}
                style={{
                  willChange: imageLoaded ? 'auto' : 'opacity',
                  transform: 'translateZ(0)',
                  backfaceVisibility: 'hidden'
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-neutral-800">
                <Package className="w-12 h-12 sm:w-16 sm:h-16 text-neutral-600" />
              </div>
            )}

            {/* Gradiente */}
            {imageLoaded && !imageError && (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                
                {/* Indicador de zoom en hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <div className="bg-black/70 backdrop-blur-sm rounded-full p-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                    </svg>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Panel de información - scroll optimizado */}
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

            {/* Contenido scrollable con mejor spacing */}
            <div 
              className="
                flex-1 overflow-y-auto overflow-x-hidden
                px-5 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8
                space-y-4 sm:space-y-5
              "
              style={{ 
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain'
              }}
            >

              {/* Título - más legible en móviles */}
              <h2 className="
                text-2xl sm:text-3xl lg:text-4xl 
                font-bold tracking-tight 
                text-white
                leading-tight
                pr-8
              ">
                {product.name}
              </h2>

              {/* Badges - más espaciados */}
              <div className="flex flex-wrap gap-2.5">
                <Badge
                  className={`
                    px-3 py-1.5 
                    text-sm font-semibold 
                    flex items-center gap-2
                    ${product.inStock
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }
                  `}
                >
                  {product.inStock ? (
                    <>
                      <Package className="w-4 h-4" />
                      <span>Disponible</span>
                    </>
                  ) : (
                    <>
                      <PackageX className="w-4 h-4" />
                      <span>No disponible</span>
                    </>
                  )}
                </Badge>

                <Badge
                  variant="outline"
                  className="px-3 py-1.5 text-sm bg-purple-500/20 text-purple-400 border-purple-500/40 font-semibold"
                >
                  {product.category}
                </Badge>
              </div>

              {/* Descripción - mejor legibilidad */}
              <div id="product-description" className="pb-2">
                <p className="
                  text-base sm:text-lg
                  text-gray-300 
                  leading-relaxed
                  whitespace-pre-line
                ">
                  {product.description}
                </p>
              </div>

            </div>

            {/* CTA - siempre visible y accesible */}
            <div className="
              border-t border-white/10
              px-5 py-4 sm:px-6 sm:py-5
              bg-neutral-950
              flex-shrink-0
            ">
              <Button
                disabled={!canAddToCart}
                onClick={handleAddToCart}
                size="lg"
                variant={inCart ? "outline" : "default"}
                className={`
                  w-full 
                  h-12 sm:h-11
                  font-semibold 
                  text-base
                  transition-all
                  touch-manipulation
                  ${inCart
                    ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/50 hover:bg-cyan-500/30"
                    : product.inStock
                    ? "bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/20 active:scale-[0.98]"
                    : "bg-neutral-800/50 text-neutral-500 cursor-not-allowed border border-neutral-700/50"
                  }
                `}
              >
                {inCart ? (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Ya en consulta
                  </>
                ) : product.inStock ? (
                  <>
                    <Plus className="w-5 h-5 mr-2" />
                    Agregar a consulta
                  </>
                ) : (
                  <>
                    <PackageX className="w-5 h-5 mr-2" />
                    No disponible
                  </>
                )}
              </Button>
            </div>

          </div>
        </div>

        {/* Lightbox - Imagen en pantalla completa */}
        {showFullImage && !imageError && (
          <div
            className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={toggleFullImage}
            role="dialog"
            aria-label="Imagen en pantalla completa"
          >
            {/* Botón cerrar */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleFullImage()
              }}
              className="absolute top-4 right-4 z-10 bg-black/70 backdrop-blur-sm rounded-full p-3 text-white/90 hover:text-white hover:bg-black/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 touch-manipulation"
              aria-label="Cerrar imagen completa"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Imagen completa */}
            <img
              src={product.image}
              alt={product.name}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
})

ProductDetailModal.displayName = "ProductDetailModal"

export default ProductDetailModal