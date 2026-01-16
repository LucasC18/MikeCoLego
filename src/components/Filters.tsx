import { motion, useReducedMotion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tag, Layers, X, Package, Check, Filter } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef } from "react";

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
  if (selectedCollection) count++;
  if (selectedCollection && selectedCategory) count++;
  if (showOnlyInStock) count++;
  return count;
};

const hasActiveFilters = (
  selectedCategory: string | null,
  selectedCollection: string | null,
  showOnlyInStock: boolean
): boolean => {
  return (
    selectedCollection !== null ||
    (selectedCollection !== null && selectedCategory !== null) ||
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
        whileTap={reduceMotion ? undefined : { scale: 0.96 }}
        onClick={onClick}
        className="group relative"
        aria-pressed={isSelected}
        aria-label={`Filtrar por ${label}`}
        type="button"
      >
        <div
          className={`
            relative min-h-[44px] px-5 py-2.5 rounded-lg text-sm font-semibold
            transition-all duration-200 border touch-manipulation
            ${
              isSelected
                ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-violet-500/50 shadow-lg shadow-violet-900/30"
                : "bg-slate-800/40 text-slate-300 border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-600/60"
            }
          `}
        >
          <span className="flex items-center gap-2">
            {label}
            {isSelected && (
              <Check className="w-4 h-4" />
            )}
          </span>
        </div>
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
    reduceMotion: boolean;
  }) => (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20">
          <Filter className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">
            Filtros
          </h2>
          {hasFilters && (
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
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
          className="h-11 px-4 text-sm font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/25 hover:border-rose-500/40 transition-all duration-200 touch-manipulation"
          aria-label="Limpiar todos los filtros"
          type="button"
        >
          <X className="w-4 h-4 mr-2" />
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
    <div className="flex items-center gap-2.5 mb-3.5">
      <div className="p-1.5 rounded-lg bg-violet-500/15 border border-violet-500/25">
        <Icon className="w-4 h-4 text-violet-400" />
      </div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
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
    if (!categories || categories.length === 0) return null;

    return (
      <motion.div
        className="space-y-3.5"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <SectionTitle icon={Tag} title="Categorías" />

        <div className="flex flex-wrap gap-2.5">
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
      </motion.div>
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
      <motion.div
        className="space-y-3.5"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <SectionTitle icon={Layers} title="Colecciones" />

        <div className="flex flex-wrap gap-2.5">
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
      </motion.div>
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
    reduceMotion: boolean;
  }) => {
    const handleToggle = useCallback(() => {
      onStockFilterChange(!showOnlyInStock);
    }, [showOnlyInStock, onStockFilterChange]);

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
        className="group relative"
      >
        <div className={`
          relative p-4 rounded-xl border bg-slate-800/40 border-slate-700/50 
          hover:bg-slate-800/60 hover:border-slate-600/60 
          flex items-center justify-between gap-4 min-h-[68px] 
          transition-all duration-200
          ${showOnlyInStock ? 'bg-emerald-500/5 border-emerald-500/30' : ''}
        `}>
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/15 to-green-500/15 border border-emerald-500/25">
              <Package className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <Label
                htmlFor="stock-filter"
                className="text-sm font-semibold text-white cursor-pointer flex items-center gap-2"
              >
                Solo disponibles
                {showOnlyInStock && (
                  <span className="text-xs">✓</span>
                )}
              </Label>
              <p className="text-xs text-slate-400 mt-0.5">
                Ocultar productos agotados
              </p>
            </div>
          </div>

          <Switch
            id="stock-filter"
            checked={showOnlyInStock}
            onCheckedChange={onStockFilterChange}
            className="data-[state=checked]:bg-emerald-500 touch-manipulation scale-110"
            aria-label="Mostrar solo productos disponibles"
          />
        </div>
      </motion.div>
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
  const reduceMotion = useReducedMotion() || false;

  const prevCollectionRef = useRef<string | null>(null);
  useEffect(() => {
    const prev = prevCollectionRef.current;
    const curr = selectedCollection;

    if (prev === null && curr === null) {
      prevCollectionRef.current = curr;
      return;
    }

    if (prev !== curr) {
      if (selectedCategory !== null) {
        onCategoryChange(null);
      }
      prevCollectionRef.current = curr;
    }
  }, [selectedCollection, selectedCategory, onCategoryChange]);

  const hasFilters = useMemo(
    () => hasActiveFilters(selectedCategory, selectedCollection, showOnlyInStock),
    [selectedCategory, selectedCollection, showOnlyInStock]
  );

  const activeCount = useMemo(
    () =>
      getActiveFiltersCount(selectedCategory, selectedCollection, showOnlyInStock),
    [selectedCategory, selectedCollection, showOnlyInStock]
  );

  const handleClearFilters = useCallback(() => {
    onClearFilters();
  }, [onClearFilters]);

  const shouldShowCategories = !!selectedCollection;

  return (
    <motion.div
      className="relative space-y-6 p-5 sm:p-6 rounded-xl bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 overflow-hidden"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative z-10 space-y-6">
        <FiltersHeader
          hasFilters={hasFilters}
          activeCount={activeCount}
          onClear={handleClearFilters}
          reduceMotion={reduceMotion}
        />

        <CollectionFilters
          collections={collections}
          selectedCollection={selectedCollection}
          onCollectionChange={onCollectionChange}
          reduceMotion={reduceMotion}
        />

        {shouldShowCategories ? (
          <CategoryFilters
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={onCategoryChange}
            reduceMotion={reduceMotion}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/50 text-slate-300"
          >
            <p className="text-sm font-medium">
              Elegí una <span className="text-white font-semibold">colección</span>{" "}
              para ver sus categorías
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Así mantenemos todo más organizado
            </p>
          </motion.div>
        )}

        <StockFilter
          showOnlyInStock={showOnlyInStock}
          onStockFilterChange={onStockFilterChange}
          reduceMotion={reduceMotion}
        />
      </div>
    </motion.div>
  );
};

export default Filters;