import { motion, useReducedMotion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Tag,
  Layers,
  X,
  Package,
  Check,
  Filter,
} from "lucide-react";
import React, { useCallback, useMemo } from "react";

/* ================================
   TYPES & INTERFACES
================================= */
interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Collection {
  id: string;
  name: string;
  slug: string;
}

interface FiltersProps {
  categories: Category[];
  collections: Collection[];
  selectedCategory: string | null;
  selectedCollection: string | null;
  onCategoryChange: (slug: string | null) => void;
  onCollectionChange: (slug: string | null) => void;
  showOnlyInStock: boolean;
  onStockFilterChange: (value: boolean) => void;
  onClearFilters: () => void;
}

interface FilterBadgeProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  reduceMotion?: boolean;
}

/* ================================
   HELPERS
================================= */
const getActiveFiltersCount = (
  selectedCategory: string | null,
  selectedCollection: string | null,
  showOnlyInStock: boolean
): number => {
  let count = 0;
  if (selectedCategory) count++;
  if (selectedCollection) count++;
  if (showOnlyInStock) count++;
  return count;
};

const hasActiveFilters = (
  selectedCategory: string | null,
  selectedCollection: string | null,
  showOnlyInStock: boolean
): boolean => {
  return (
    selectedCategory !== null ||
    selectedCollection !== null ||
    showOnlyInStock
  );
};

/* ================================
   SUB-COMPONENTS
================================= */
const FilterBadge = React.memo<FilterBadgeProps>(
  ({ label, isSelected, onClick, reduceMotion = false }) => {
    return (
      <motion.button
        whileTap={reduceMotion ? undefined : { scale: 0.95 }}
        whileHover={reduceMotion ? undefined : { scale: 1.05 }}
        onClick={onClick}
        className={`
          min-h-[48px] px-6 py-3 rounded-xl text-base font-bold
          transition-all duration-300 border shadow-lg touch-manipulation
          ${
            isSelected
              ? "bg-primary text-primary-foreground border-primary shadow-primary/50 scale-105"
              : "bg-slate-800/60 text-slate-200 border-slate-700 hover:bg-slate-700 hover:border-slate-600"
          }
        `}
        aria-pressed={isSelected}
        aria-label={`Filtrar por ${label}`}
      >
        <span className="flex items-center gap-2">
          {label}
          {isSelected && <Check className="w-5 h-5" />}
        </span>
      </motion.button>
    );
  }
);

FilterBadge.displayName = "FilterBadge";

const FiltersHeader = React.memo(
  ({
    hasFilters,
    activeCount,
    onClear,
  }: {
    hasFilters: boolean;
    activeCount: number;
    onClear: () => void;
  }) => (
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-primary/10 border border-primary/20">
          <Filter className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Filtros</h2>
          {hasFilters && (
            <p className="text-sm text-slate-400 mt-1">
              {activeCount} {activeCount === 1 ? "activo" : "activos"}
            </p>
          )}
        </div>
      </div>

      {hasFilters && (
        <Button
          variant="ghost"
          size="lg"
          onClick={onClear}
          className="min-h-[48px] px-5 text-base text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all duration-300 touch-manipulation"
          aria-label="Limpiar todos los filtros"
        >
          <X className="w-5 h-5 mr-2" />
          Limpiar
        </Button>
      )}
    </div>
  )
);

FiltersHeader.displayName = "FiltersHeader";

const SectionTitle = React.memo(
  ({
    icon: Icon,
    title,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
  }) => (
    <div className="flex items-center gap-3">
      <Icon className="w-6 h-6 text-primary" />
      <h3 className="text-lg font-bold text-slate-200">{title}</h3>
    </div>
  )
);

SectionTitle.displayName = "SectionTitle";

const CategoryFilters = React.memo(
  ({
    categories,
    selectedCategory,
    onCategoryChange,
    reduceMotion,
  }: {
    categories: Category[];
    selectedCategory: string | null;
    onCategoryChange: (slug: string | null) => void;
    reduceMotion: boolean;
  }) => {
    if (categories.length === 0) return null;

    return (
      <div className="space-y-4">
        <SectionTitle icon={Tag} title="Categorías" />

        <div className="flex flex-wrap gap-3">
          <FilterBadge
            label="Todas"
            isSelected={!selectedCategory}
            onClick={() => onCategoryChange(null)}
            reduceMotion={reduceMotion}
          />

          {categories.map((cat) => (
            <FilterBadge
              key={cat.id}
              label={cat.name}
              isSelected={selectedCategory === cat.slug}
              onClick={() => onCategoryChange(cat.slug)}
              reduceMotion={reduceMotion}
            />
          ))}
        </div>
      </div>
    );
  }
);

CategoryFilters.displayName = "CategoryFilters";

const CollectionFilters = React.memo(
  ({
    collections,
    selectedCollection,
    onCollectionChange,
    reduceMotion,
  }: {
    collections: Collection[];
    selectedCollection: string | null;
    onCollectionChange: (slug: string | null) => void;
    reduceMotion: boolean;
  }) => {
    if (collections.length === 0) return null;

    return (
      <div className="space-y-4">
        <SectionTitle icon={Layers} title="Colecciones" />

        <div className="flex flex-wrap gap-3">
          <FilterBadge
            label="Todas"
            isSelected={!selectedCollection}
            onClick={() => onCollectionChange(null)}
            reduceMotion={reduceMotion}
          />

          {collections.map((col) => (
            <FilterBadge
              key={col.id}
              label={col.name}
              isSelected={selectedCollection === col.slug}
              onClick={() => onCollectionChange(col.slug)}
              reduceMotion={reduceMotion}
            />
          ))}
        </div>
      </div>
    );
  }
);

CollectionFilters.displayName = "CollectionFilters";

const StockFilter = React.memo(
  ({
    showOnlyInStock,
    onStockFilterChange,
  }: {
    showOnlyInStock: boolean;
    onStockFilterChange: (value: boolean) => void;
  }) => {
    const handleToggle = useCallback(() => {
      onStockFilterChange(!showOnlyInStock);
    }, [showOnlyInStock, onStockFilterChange]);

    return (
      <div className="p-6 rounded-xl border border-slate-700 bg-slate-800/60 flex items-center justify-between gap-4 min-h-[72px] hover:bg-slate-700/60 hover:border-slate-600 transition-all duration-300">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Package className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <Label
              htmlFor="stock-filter"
              className="text-base font-bold text-slate-100 cursor-pointer"
            >
              Solo disponibles
            </Label>
            <p className="text-sm text-slate-400 mt-1">
              Ocultar productos agotados
            </p>
          </div>
        </div>

        <Switch
          id="stock-filter"
          checked={showOnlyInStock}
          onCheckedChange={onStockFilterChange}
          className="data-[state=checked]:bg-emerald-500 touch-manipulation"
          aria-label="Mostrar solo productos disponibles"
        />
      </div>
    );
  }
);

StockFilter.displayName = "StockFilter";

/* ================================
   MAIN COMPONENT
================================= */
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
  const reduceMotion = useReducedMotion();

  const hasFilters = useMemo(
    () => hasActiveFilters(selectedCategory, selectedCollection, showOnlyInStock),
    [selectedCategory, selectedCollection, showOnlyInStock]
  );

  const activeCount = useMemo(
    () => getActiveFiltersCount(selectedCategory, selectedCollection, showOnlyInStock),
    [selectedCategory, selectedCollection, showOnlyInStock]
  );

  const handleClearFilters = useCallback(() => {
    onClearFilters();
  }, [onClearFilters]);

  return (
    <div className="space-y-8 p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 shadow-xl">
      <FiltersHeader
        hasFilters={hasFilters}
        activeCount={activeCount}
        onClear={handleClearFilters}
      />

      <CategoryFilters
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={onCategoryChange}
        reduceMotion={!!reduceMotion}
      />

      <CollectionFilters
        collections={collections}
        selectedCollection={selectedCollection}
        onCollectionChange={onCollectionChange}
        reduceMotion={!!reduceMotion}
      />

      <StockFilter
        showOnlyInStock={showOnlyInStock}
        onStockFilterChange={onStockFilterChange}
      />
    </div>
  );
};

export default Filters;