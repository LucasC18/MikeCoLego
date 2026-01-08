import { motion } from "framer-motion"
import { PackageSearch } from "lucide-react"

import { Product } from "@/types/product"
import ProductCard from "./ProductCard"
import { Button } from "@/components/ui/button"

interface ProductGridProps {
  products: Product[]
  onClearFilters?: () => void
}

const ProductGrid = ({ products, onClearFilters }: ProductGridProps) => {
  /* ===============================
     EMPTY STATE
  =============================== */
  if (products.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-24 text-center"
      >
        <PackageSearch className="w-20 h-20 text-muted-foreground mb-6" />

        <h3 className="font-display text-xl font-semibold">
          No se encontraron productos
        </h3>

        <p className="text-muted-foreground mb-6">
          Ajustá los filtros o la búsqueda.
        </p>

        {onClearFilters && (
          <Button variant="outline" onClick={onClearFilters}>
            Limpiar filtros
          </Button>
        )}
      </motion.div>
    )
  }

  /* ===============================
     GRID FINAL (SIN MODAL)
  =============================== */
  return (
    <div
      className="
        grid
        grid-cols-1
        sm:grid-cols-2
        lg:grid-cols-3
        xl:grid-cols-4
        gap-6
        w-full
        px-4
        sm:px-0
        items-stretch
      "
    >
      {products.map((product, index) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.25,
            delay: index * 0.04,
            ease: "easeOut",
          }}
          className="h-full"
        >
          <ProductCard product={product} index={index} />
        </motion.div>
      ))}
    </div>
  )
}

export default ProductGrid
