import { motion } from "framer-motion"
import ProductCard from "@/components/ProductCard"
import { Product } from "@/types/product"
import { PackageX } from "lucide-react"

interface ProductGridProps {
  products: Product[]
  onClearFilters?: () => void
  onNavigate?: (id: string) => void
}

const ProductGrid = ({ products, onClearFilters, onNavigate }: ProductGridProps) => {
  if (!products.length) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center justify-center py-20 sm:py-24 space-y-5"
      >
        <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
          <PackageX className="w-16 h-16 text-slate-600" />
        </div>
        
        <div className="text-center space-y-2">
          <p className="text-white text-lg font-semibold">
            No encontramos productos
          </p>
          <p className="text-slate-400 text-sm">
            Intenta ajustar los filtros para ver más resultados
          </p>
        </div>

        {onClearFilters && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClearFilters}
            className="mt-2 px-6 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors duration-200 touch-manipulation"
          >
            Limpiar filtros
          </motion.button>
        )}
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
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