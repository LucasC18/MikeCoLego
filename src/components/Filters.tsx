import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { categories } from "@/data/products";
import { Category } from "@/types/product";

interface FiltersProps {
  selectedCategories: Category[];
  onCategoryToggle: (category: Category) => void;
  showOnlyInStock: boolean;
  onStockFilterChange: (value: boolean) => void;
}

const Filters = ({
  selectedCategories,
  onCategoryToggle,
  showOnlyInStock,
  onStockFilterChange,
}: FiltersProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-6"
    >
      {/* Category filters */}
      <div className="space-y-3">
        <h3 className="font-display text-sm font-semibold text-primary uppercase tracking-wider">
          Categorías
        </h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((category, index) => {
            const isSelected = selectedCategories.includes(category);
            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <Badge
                  variant={isSelected ? "default" : "outline"}
                  className={`cursor-pointer transition-all duration-300 px-4 py-2 text-sm font-medium ${
                    isSelected
                      ? "bg-primary text-primary-foreground neon-glow"
                      : "bg-card/50 border-primary/30 text-foreground hover:border-primary hover:bg-primary/10"
                  }`}
                  onClick={() => onCategoryToggle(category)}
                >
                  {category}
                </Badge>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Stock filter */}
      <div className="flex items-center gap-3 p-4 glass-card rounded-lg">
        <Switch
          id="stock-filter"
          checked={showOnlyInStock}
          onCheckedChange={onStockFilterChange}
          className="data-[state=checked]:bg-neon-green"
        />
        <Label
          htmlFor="stock-filter"
          className="text-sm font-medium cursor-pointer"
        >
          Mostrar solo disponibles
        </Label>
      </div>
    </motion.div>
  );
};

export default Filters;
