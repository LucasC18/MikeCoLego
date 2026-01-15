import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Tag,
  Layers,
  X,
  Package,
  Filter,
  Sparkles,
  Check,
} from "lucide-react"

type Category = {
  id: string
  name: string
  slug: string
}

type Collection = {
  id: string
  name: string
  slug: string
}

interface FiltersProps {
  categories: Category[]
  collections: Collection[]

  selectedCategory: string | null
  selectedCollection: string | null

  onCategoryChange: (slug: string | null) => void
  onCollectionChange: (slug: string | null) => void

  showOnlyInStock: boolean
  onStockFilterChange: (value: boolean) => void
  onClearFilters: () => void
}

/* ======================= FILTER BADGE ======================= */

interface FilterBadgeProps {
  label: string
  isSelected: boolean
  onClick: () => void
  icon?: React.ReactNode
}

const FilterBadge = ({ label, isSelected, onClick, icon }: FilterBadgeProps) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -3 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        relative px-5 py-2.5 rounded-full text-sm font-bold
        transition-all duration-300 border-2 overflow-hidden
        ${
          isSelected
            ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-500 shadow-lg"
            : "bg-gradient-to-br from-gray-900/80 to-gray-800/80 text-purple-200 border-purple-500/30 hover:border-purple-400/60"
        }
      `}
    >
      <span className="flex items-center gap-2 relative z-10">
        {icon}
        {label}
        {isSelected && <Check className="w-3.5 h-3.5" />}
      </span>
    </motion.button>
  )
}

/* ======================= MAIN ======================= */

const Filters = ({
  categories,
  collections,
  selectedCategory,
  selectedCollection,
  onCategoryChange,
  onCollectionChange,
  showOnlyInStock,
  onStockFilterChange,
  onClearFilters,
}: FiltersProps) => {
  const hasActiveFilters =
    selectedCategory !== null ||
    selectedCollection !== null ||
    showOnlyInStock

  const activeFiltersCount =
    (selectedCategory ? 1 : 0) +
    (selectedCollection ? 1 : 0) +
    (showOnlyInStock ? 1 : 0)

  return (
    <motion.div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-purple-400">Filtros</h2>
          {hasActiveFilters && (
            <p className="text-xs text-purple-300">
              {activeFiltersCount} activos
            </p>
          )}
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-red-400"
          >
            <X className="w-4 h-4 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      {/* ================= CATEGORIAS ================= */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-purple-400">Categorías</h3>
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterBadge
            label="Todas"
            isSelected={!selectedCategory}
            onClick={() => onCategoryChange(null)}
          />

          {categories.map((cat) => (
            <FilterBadge
              key={cat.id}
              label={cat.name}
              isSelected={selectedCategory === cat.slug}
              onClick={() => onCategoryChange(cat.slug)}
            />
          ))}
        </div>
      </div>

      {/* ================= COLECCIONES ================= */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-pink-400" />
          <h3 className="text-sm font-bold text-pink-400">Colecciones</h3>
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterBadge
            label="Todas"
            isSelected={!selectedCollection}
            onClick={() => onCollectionChange(null)}
          />

          {collections.map((col) => (
            <FilterBadge
              key={col.id}
              label={col.name}
              isSelected={selectedCollection === col.slug}
              onClick={() => onCollectionChange(col.slug)}
            />
          ))}
        </div>
      </div>

      {/* ================= STOCK ================= */}
      <div className="p-4 rounded-xl border border-purple-500/20 bg-black/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5 text-emerald-400" />
          <div>
            <Label className="text-sm font-bold text-white">
              Solo disponibles
            </Label>
            <p className="text-xs text-muted-foreground">
              Ocultar agotados
            </p>
          </div>
        </div>

        <Switch checked={showOnlyInStock} onCheckedChange={onStockFilterChange} />
      </div>
    </motion.div>
  )
}

export default Filters
