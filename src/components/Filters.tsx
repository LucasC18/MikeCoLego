import { motion, useReducedMotion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tag, Layers, X, Package, Check, Filter, Sparkles } from "lucide-react";
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
        whileTap={reduceMotion ? undefined : { scale: 0.95 }}
        whileHover={reduceMotion ? undefined : { scale: 1.03, y: -2 }}
        onClick={onClick}
        className="group relative"
        aria-pressed={isSelected}
        aria-label={`Filtrar por ${label}`}
        type="button"
      >
        <div
          className={`
            relative min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-bold
            transition-all duration-300 border touch-manipulation overflow-hidden
            ${
              isSelected
                ? "bg-gradient-to-r from-cyan-600/80 via-purple-600/80 to-pink-600/80 text-white border-cyan-500/40 shadow-xl"
                : "bg-slate-800/40 text-slate-300 border-slate-700/40 hover:bg-slate-800/60 hover:border-cyan-500/30"
            }
          `}
        >
          {/* Neon glow effect for selected */}
          {isSelected && (
            <>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-purple-400/20 to-pink-400/20 blur-xl" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </>
          )}
          
          {/* Subtle hover glow for unselected */}
          {!isSelected && (
            <div className="absolute inset-0 bg-cyan-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg" />
          )}
          
          <span className="flex items-center gap-2 relative z-10">
            {label}
            {isSelected && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
              >
                <Check className="w-4 h-4" />
              </motion.div>
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
        <motion.div 
          className="p-3 rounded-xl bg-slate-800/60 border border-cyan-500/30 relative overflow-hidden group"
          whileHover={{ scale: 1.05, rotate: 5 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <Filter className="w-5 h-5 text-cyan-400 relative z-10" />
          <div className="absolute inset-0 bg-cyan-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </motion.div>
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Filtros
          </h2>
          {hasFilters && (
            <motion.p 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xs text-slate-400 mt-0.5 font-medium flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              {activeCount} {activeCount === 1 ? "activo" : "activos"}
            </motion.p>
          )}
        </div>
      </div>

      {hasFilters && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant="ghost"
            size="lg"
            onClick={onClear}
            className="h-11 px-4 text-sm font-bold text-pink-400 hover:text-pink-300 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 hover:border-pink-500/50 transition-all duration-300 touch-manipulation relative overflow-hidden group"
            aria-label="Limpiar todos los filtros"
            type="button"
          >
            <div className="absolute inset-0 bg-pink-400/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <X className="w-4 h-4 mr-2 relative z-10 group-hover:rotate-90 transition-transform duration-300" />
            <span className="relative z-10">Limpiar</span>
          </Button>
        </motion.div>
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
    <div className="flex items-center gap-2.5 mb-4">
      <motion.div 
        className="p-2 rounded-lg bg-purple-500/15 border border-purple-500/30 relative overflow-hidden group"
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        <div className="absolute inset-0 bg-purple-400/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <Icon className="w-4 h-4 text-purple-400 relative z-10" />
      </motion.div>
      <h3 className="text-base font-bold text-slate-200">{title}</h3>
      <div className="flex-1 h-px bg-gradient-to-r from-slate-700/50 to-transparent" />
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
        className="space-y-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <SectionTitle icon={Tag} title="Categorías" />

        <div className="flex flex-wrap gap-2.5">
          <FilterBadge
            label="Todas"
            isSelected={!selectedCategory}
            onClick={() => onCategoryChange(null)}
            reduceMotion={reduceMotion}
          />

          {categories.map((cat, index) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
            >
              <FilterBadge
                label={cat.name}
                isSelected={selectedCategory === cat.slug}
                onClick={() => onCategoryChange(cat.slug)}
                reduceMotion={reduceMotion}
              />
            </motion.div>
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
        className="space-y-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <SectionTitle icon={Layers} title="Colecciones" />

        <div className="flex flex-wrap gap-2.5">
          <FilterBadge
            label="Todas"
            isSelected={!selectedCollection}
            onClick={() => onCollectionChange(null)}
            reduceMotion={reduceMotion}
          />

          {collections.map((col, index) => (
            <motion.div
              key={col.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
            >
              <FilterBadge
                label={col.name}
                isSelected={selectedCollection === col.slug}
                onClick={() => onCollectionChange(col.slug)}
                reduceMotion={reduceMotion}
              />
            </motion.div>
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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="group relative"
        whileHover={{ scale: 1.02 }}
      >
        <div className={`
          relative p-5 rounded-2xl border bg-slate-800/40 border-slate-700/40 
          hover:bg-slate-800/60 hover:border-slate-600/50
          flex items-center justify-between gap-4 min-h-[72px] 
          transition-all duration-300 overflow-hidden
          ${showOnlyInStock ? 'bg-emerald-500/10 border-emerald-500/40' : ''}
        `}>
          {/* Neon glow when active */}
          {showOnlyInStock && (
            <>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-green-400/10 blur-xl" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
            </>
          )}
          
          {/* Subtle hover glow */}
          <div className="absolute inset-0 bg-emerald-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-lg" />

          <div className="flex items-center gap-4 relative z-10">
            <motion.div 
              className="p-3 rounded-xl bg-slate-800/60 border border-emerald-500/30 relative overflow-hidden"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div className="absolute inset-0 bg-emerald-400/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Package className="w-5 h-5 text-emerald-400 relative z-10" />
            </motion.div>
            <div>
              <Label
                htmlFor="stock-filter"
                className="text-sm font-bold text-slate-200 cursor-pointer flex items-center gap-2"
              >
                Solo disponibles
                {showOnlyInStock && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-emerald-400"
                  >
                    <Sparkles className="w-3.5 h-3.5 inline" />
                  </motion.span>
                )}
              </Label>
              <p className="text-xs text-slate-400 mt-1">
                Ocultar productos agotados
              </p>
            </div>
          </div>

          <motion.div
            whileTap={{ scale: 0.95 }}
          >
            <Switch
              id="stock-filter"
              checked={showOnlyInStock}
              onCheckedChange={onStockFilterChange}
              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-emerald-500 data-[state=checked]:to-green-500 touch-manipulation scale-110 shadow-lg data-[state=checked]:shadow-emerald-500/30"
              aria-label="Mostrar solo productos disponibles"
            />
          </motion.div>
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
      className="relative space-y-7 p-6 sm:p-7 rounded-2xl bg-slate-800/30 backdrop-blur-sm border border-slate-700/40 overflow-hidden"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, type: "spring", stiffness: 100 }}
    >
      {/* Ambient background effects */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-br from-cyan-500/3 via-transparent to-pink-500/3 pointer-events-none" />
      
      {/* Neon border glow */}
      <div className="absolute inset-0 rounded-2xl border border-cyan-500/0 group-hover:border-cyan-500/10 transition-all duration-700 pointer-events-none" />

      <div className="relative z-10 space-y-7">
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/40 text-slate-300 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/30 to-transparent" />
            
            <p className="text-sm font-semibold relative z-10">
              Elegí una <span className="text-cyan-400 font-bold">colección</span>{" "}
              para ver sus categorías
            </p>
            <p className="text-xs text-slate-500 mt-1.5 relative z-10">
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