import { useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import Navbar from "@/components/Navbar"
import CartDrawer from "@/components/CartDrawer"

import { useProducts } from "@/context/ProductContext"
import { useCart } from "@/context/CartContext"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, Plus, Check, PackageX } from "lucide-react"

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [isCartOpen, setIsCartOpen] = useState(false)

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
    <div className="min-h-screen bg-background">
      <Navbar onCartClick={() => setIsCartOpen(true)} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-12">
        {/* Top bar */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" onClick={handleBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver
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
          <div className="grid gap-10 lg:grid-cols-2">
            {/* Imagen */}
            <section className="glass-card rounded-xl overflow-hidden">
              <div className="relative aspect-square bg-muted/40">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-contain p-6"
                  loading="lazy"
                />
              </div>
            </section>

            {/* Info */}
            <section className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
                  {product.name}
                </h1>

                {product.inStock ? (
                  <Badge className="shrink-0">En stock</Badge>
                ) : (
                  <Badge variant="destructive" className="shrink-0">
                    Sin stock
                  </Badge>
                )}
              </div>

              {product.category && (
                <div className="text-sm text-muted-foreground">
                  Categoría:{" "}
                  <span className="text-foreground">
                    {product.category}
                  </span>
                </div>
              )}

              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="gap-2"
                  disabled={!product.inStock || inCart}
                  onClick={() => addToCart(product)}
                >
                  {!product.inStock ? (
                    <>
                      <PackageX className="w-4 h-4" />
                      No disponible
                    </>
                  ) : inCart ? (
                    <>
                      <Check className="w-4 h-4" />
                      Ya en el carrito
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Agregar a consulta
                    </>
                  )}
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setIsCartOpen(true)}
                >
                  Ver carrito
                </Button>
              </div>
            </section>
          </div>
        )}
      </main>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  )
}

export default ProductDetail
