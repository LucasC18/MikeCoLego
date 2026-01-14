import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-6"
    >
      {/* Categorías */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider">Categorías</h3>

        <div className="flex flex-wrap gap-2">
          <Badge
            role="button"
            onClick={() => onCategoryChange(null)}
            className={`cursor-pointer px-4 py-2 ${
              !selectedCategory
                ? "bg-primary text-primary-foreground"
                : "bg-card border-primary/30 hover:bg-primary/10"
            }`}
          >
            Todas
          </Badge>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.slug

            return (
              <Badge
                key={cat.id}
                role="button"
                onClick={() => onCategoryChange(cat.slug)}
                className={`cursor-pointer px-4 py-2 ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border-primary/30 hover:bg-primary/10"
                }`}
              >
                {cat.name}
              </Badge>
            )
          })}
        </div>
      </div>

      {/* Colecciones */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider">Colecciones</h3>

        <div className="flex flex-wrap gap-2">
          <Badge
            role="button"
            onClick={() => onCollectionChange(null)}
            className={`cursor-pointer px-4 py-2 ${
              !selectedCollection
                ? "bg-primary text-primary-foreground"
                : "bg-card border-primary/30 hover:bg-primary/10"
            }`}
          >
            Todas
          </Badge>

          {collections.map((col) => {
            const isSelected = selectedCollection === col.slug

            return (
              <Badge
                key={col.id}
                role="button"
                onClick={() => onCollectionChange(col.slug)}
                className={`cursor-pointer px-4 py-2 ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border-primary/30 hover:bg-primary/10"
                }`}
              >
                {col.name}
              </Badge>
            )
          })}
        </div>
      </div>

      {/* Stock */}
      <div className="flex items-center gap-3 p-4 rounded-lg border">
        <Switch
          id="stock-filter"
          checked={showOnlyInStock}
          onCheckedChange={onStockFilterChange}
        />
        <Label htmlFor="stock-filter" className="text-sm font-medium cursor-pointer">
          Mostrar solo disponibles
        </Label>
      </div>

      <button
        onClick={onClearFilters}
        className="text-sm underline text-muted-foreground"
      >
        Limpiar filtros
      </button>
    </motion.div>
  )
}

export default Filters
