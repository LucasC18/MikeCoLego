import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import Navbar from "@/components/Navbar"
import CartDrawer from "@/components/CartDrawer"

import { useCart } from "@/context/CartContext"
import { apiFetch } from "@/config/api"
import { Product } from "@/types/product"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  ArrowLeft,
  Plus,
  Check,
  PackageX,
  Maximize2,
  X,
  ImageOff,
} from "lucide-react"

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { addToCart, isInCart } = useCart()

  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)

  /* ================================
     LOAD PRODUCT FROM API
  ================================= */
  useEffect(() => {
    if (!id) return

    setIsLoading(true)
    setError(false)

    apiFetch<Product>(`/v1/products/${id}`)
      .then(setProduct)
      .catch(() => setError(true))
      .finally(() => setIsLoading(false))
  }, [id])

  const inCart = product ? isInCart(product.id) : false

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1)
    else navigate("/catalogo")
  }

  /* 🔥 Evitar scroll roto cuando se abre imagen */
  useEffect(() => {
    document.body.style.overflow = isImageModalOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [isImageModalOpen])

  return (
    <div className="bg-background flex flex-col min-h-screen">
      <Navbar onCartClick={() => setIsCartOpen(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1">
        <div className="mb-6">
          <Button variant="outline" onClick={handleBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver al catálogo
          </Button>
        </div>

        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin" />
          </div>
        )}

        {!isLoading && error && (
          <div className="py-20 text-center text-muted-foreground">
            Error cargando producto
          </div>
        )}

        {!isLoading && !error && !product && (
          <div className="py-20 text-center text-muted-foreground">
            Producto no encontrado
          </div>
        )}

        {!isLoading && product && (
          <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
            {/* IMAGE */}
            <div className="relative bg-black/20 rounded-xl p-4">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <ImageOff />
                </div>
              )}

              <Button
                size="icon"
                className="absolute top-4 right-4"
                onClick={() => setIsImageModalOpen(true)}
              >
                <Maximize2 />
              </Button>
            </div>

            {/* INFO */}
            <div className="space-y-4">
              <div className="flex gap-2">
                {product.category && <Badge>{product.category}</Badge>}
                {product.inStock && <Badge className="bg-emerald-500">Disponible</Badge>}
              </div>

              <h1 className="text-3xl font-bold">{product.name}</h1>

              <p>{product.description}</p>

              <Button
                size="lg"
                disabled={!product.inStock || inCart}
                onClick={() => addToCart(product)}
              >
                {!product.inStock
                  ? "Sin stock"
                  : inCart
                  ? "En consulta"
                  : "Agregar"}
              </Button>
            </div>
          </div>
        )}
      </main>

      {isImageModalOpen && product && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center"
          onClick={() => setIsImageModalOpen(false)}
        >
          <img src={product.image} className="max-h-[90vh]" />
          <Button
            className="absolute top-4 right-4"
            onClick={() => setIsImageModalOpen(false)}
          >
            <X />
          </Button>
        </div>
      )}

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  )
}

export default ProductDetail
