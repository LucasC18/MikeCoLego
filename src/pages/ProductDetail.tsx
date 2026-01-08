import { useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import Navbar from "@/components/Navbar"
import CartDrawer from "@/components/CartDrawer"

import { useProducts } from "@/context/ProductContext"
import { useCart } from "@/context/CartContext"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, Plus, Check, PackageX, Maximize2, X } from "lucide-react"

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)

  const { products, isLoading, error } = useProducts()
  const { addToCart, isInCart } = useCart()

  const product = useMemo(() => {
    if (!id) return null
    return products.find((p) => p.id === id) ?? null
  }, [products, id])

  const inCart = product ? isInCart(product.id) : false

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate("/catalogo")
    }
  }

  return (
    <div className="bg-background flex flex-col">
      <Navbar onCartClick={() => setIsCartOpen(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Top bar - Más visible */}
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={handleBack} 
            className="gap-2 border-2 border-primary/50 hover:border-primary hover:bg-primary hover:text-primary-foreground transition-all hover:shadow-[0_0_20px_rgba(var(--primary),0.5)]"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al catálogo
          </Button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Cargando producto...
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <div className="py-20 text-center text-muted-foreground">
            Ocurrió un error cargando el producto.
          </div>
        )}

        {/* Not found */}
        {!isLoading && !error && !product && (
          <div className="py-20 text-center text-muted-foreground">
            Producto no encontrado.
          </div>
        )}

        {/* Product */}
        {!isLoading && !error && product && (
          <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr] lg:gap-10 xl:gap-12">
            {/* Imagen - Más grande */}
            <section className="space-y-4">
              <div className="glass-card rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(var(--primary),0.3)] hover:shadow-[0_0_50px_rgba(var(--primary),0.5)] transition-all duration-300 border border-primary/20">
                <div className="relative aspect-square bg-gradient-to-br from-primary/5 via-muted/20 to-primary/10 p-4 sm:p-6 md:p-10">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(var(--primary),0.4)]"
                    loading="lazy"
                  />
                  {!product.inStock && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
                      <Badge variant="destructive" className="text-base px-4 py-2 shadow-[0_0_20px_rgba(239,68,68,0.6)]">
                        <PackageX className="w-4 h-4 mr-2" />
                        Sin stock
                      </Badge>
                    </div>
                  )}
                  
                  {/* Botón para ver imagen completa */}
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-4 right-4 shadow-lg hover:shadow-[0_0_20px_rgba(var(--primary),0.6)] transition-all border border-primary/30"
                    onClick={() => setIsImageModalOpen(true)}
                  >
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </section>

            {/* Info */}
            <section className="space-y-6">
              {/* Header */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {product.category && (
                    <Badge variant="outline" className="text-xs border-primary/50 shadow-[0_0_10px_rgba(var(--primary),0.3)]">
                      {product.category}
                    </Badge>
                  )}
                  {product.inStock && (
                    <Badge className="text-xs bg-green-500 hover:bg-green-600 shadow-[0_0_15px_rgba(34,197,94,0.5)]">
                      ✓ Disponible
                    </Badge>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(var(--primary),0.3)]">
                  {product.name}
                </h1>
              </div>

              {/* Description */}
              <div className="glass-card rounded-xl p-5 sm:p-6 space-y-3 border border-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.2)]">
                <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">
                  Descripción
                </h2>
                <p className="text-base leading-relaxed text-foreground/90">
                  {product.description}
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  size="lg"
                  className="w-full gap-2 text-base h-12 sm:h-14 shadow-[0_0_30px_rgba(var(--primary),0.4)] hover:shadow-[0_0_50px_rgba(var(--primary),0.7)] transition-all duration-300"
                  disabled={!product.inStock || inCart}
                  onClick={() => addToCart(product)}
                >
                  {!product.inStock ? (
                    <>
                      <PackageX className="w-5 h-5" />
                      Producto no disponible
                    </>
                  ) : inCart ? (
                    <>
                      <Check className="w-5 h-5" />
                      ✓ Agregado al carrito
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Agregar a consulta
                    </>
                  )}
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 border-primary/50 hover:border-primary hover:shadow-[0_0_20px_rgba(var(--primary),0.4)] transition-all"
                    onClick={() => setIsCartOpen(true)}
                  >
                    Ver carrito
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 border-primary/50 hover:border-primary hover:shadow-[0_0_20px_rgba(var(--primary),0.4)] transition-all"
                    onClick={handleBack}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Volver
                  </Button>
                </div>
              </div>

              {/* Info adicional */}
              <div className="pt-4 border-t border-primary/20 space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.8)]"></span>
                  Consulta sin compromiso
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.8)]"></span>
                  Asesoramiento personalizado
                </p>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Modal de imagen completa */}
      {isImageModalOpen && product && (
  <div
    className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
    onClick={() => setIsImageModalOpen(false)}
  >
    <Button
      variant="ghost"
      size="icon"
      className="absolute top-4 right-4 z-10 text-white hover:bg-white/10"
      onClick={() => setIsImageModalOpen(false)}
    >
      <X className="w-6 h-6" />
    </Button>

    <div
      className="relative max-w-[90vw] max-h-[90vh]"
      onClick={(e) => e.stopPropagation()}
    >
      <img
        src={product.image}
        alt={product.name}
        className="max-w-full max-h-[90vh] object-contain"
        draggable={false}
      />
    </div>
  </div>
)}


      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  )
}

export default ProductDetail