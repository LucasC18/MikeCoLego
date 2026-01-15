import { motion } from "framer-motion"
import ProductCard from "@/components/ProductCard"
import { Product } from "@/types/product"

interface ProductGridProps {
  products: Product[]
  onClearFilters: () => void
  onNavigate: (id: string) => void
}

const ProductGrid = ({ products, onClearFilters, onNavigate }: ProductGridProps) => {
  if (!products.length) {
    return (
      <div className="text-center py-24 space-y-4">
        <p className="text-muted-foreground text-lg">
          No se encontraron productos con los filtros seleccionados.
        </p>
        <button
          onClick={onClearFilters}
          className="text-primary underline hover:text-primary/80 transition"
        >
          Limpiar filtros
        </button>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
    >
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          index={index}
          onNavigate={onNavigate}
        />
      ))}
    </motion.div>
  )
}

export default ProductGrid
