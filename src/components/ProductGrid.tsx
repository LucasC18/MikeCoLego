import { motion, AnimatePresence } from "framer-motion"
import ProductCard from "@/components/ProductCard"
import { Product } from "@/types/product"
import { PackageX } from "lucide-react"
import { memo } from "react"

interface ProductGridProps {
  products: Product[]
  onClearFilters?: () => void
  onNavigate?: (id: string) => void
}

const emptyStateVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
}

const gridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04
    }
  }
}

const ProductGrid = ({ products, onClearFilters, onNavigate }: ProductGridProps) => {
  return (
    <AnimatePresence mode="wait">
      {!products.length ? (
        <motion.div
          key="empty"
          variants={emptyStateVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="flex flex-col items-center justify-center py-20 sm:py-24 space-y-5 text-center"
        >
          <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
            <PackageX className="w-14 h-14 text-slate-500" />
          </div>

          <div className="space-y-1">
            <p className="text-white text-lg font-semibold">
              No encontramos productos
            </p>
            <p className="text-slate-400 text-sm max-w-xs">
              Probá ajustando los filtros para ampliar los resultados
            </p>
          </div>

          {onClearFilters && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onClearFilters}
              className="mt-2 px-6 py-2.5 rounded-lg 
                         bg-violet-600 hover:bg-violet-500 
                         text-white font-semibold 
                         transition-colors duration-200 
                         focus-visible:outline-none 
                         focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              Limpiar filtros
            </motion.button>
          )}
        </motion.div>
      ) : (
        <motion.div
          key="grid"
          variants={gridVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ duration: 0.25 }}
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
      )}
    </AnimatePresence>
  )
}

export default memo(ProductGrid)
