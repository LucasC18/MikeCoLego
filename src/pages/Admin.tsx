import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ImageDropzone } from "@/components/ImageDropzone";
import { apiFetch } from "@/config/api";
import { Product } from "@/types/product";

import {
  Plus,
  Pencil,
  Trash2,
  LogOut,
  Package,
  AlertCircle,
  CheckCircle,
  Search,
  Filter,
  X,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

/* ======================= TYPES ======================= */
interface Category {
  id: string;
  name: string;
}

interface ProductApiDTO {
  id: string;
  name: string;
  image?: string | null;
  imageUrl?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  description?: string | null;
  inStock: boolean;
  stockQty?: number | null;
  collection?: string; // ⬅️ NUEVO
}

interface ApiError {
  message?: string;
  error?: string;
}

interface AdminProduct extends Product {
  categoryId?: string;
}

interface ProductFormState {
  name: string;
  categoryId: string;
  description: string;
  imageFile: File | null;
  imagePreview: string;
  inStock: boolean;
  stockQty: number;
  collection: string; // ⬅️ NUEVO
}

const EMPTY_FORM: ProductFormState = {
  name: "",
  categoryId: "",
  description: "",
  imageFile: null,
  imagePreview: "",
  inStock: true,
  stockQty: 0,
  collection: "Figuras", // ⬅️ default
};

function mapAdminProducts(
  items: ProductApiDTO[],
  categories: Category[]
): AdminProduct[] {
  return items.map((p) => {
    console.log("Product from API:", {
      id: p.id,
      name: p.name,
      categoryId: p.categoryId,
      categoryName: p.categoryName,
      collection: p.collection,
    });

    let category = p.categoryName ?? undefined;

    if (!category && p.categoryId) {
      category = categories.find((c) => c.id === p.categoryId)?.name;
    }

    if (!category) {
      category = "Sin categoría";
    }

    return {
      id: p.id,
      name: p.name,
      image: p.image ?? p.imageUrl ?? "",
      category,
      categoryId: p.categoryId ?? undefined,
      description: p.description ?? "",
      inStock: p.inStock,
      stockQty: p.stockQty ?? 0,
      collection: p.collection ?? "Figuras", // ⬅️ NUEVO
    };
  });
}

function getErrorMessage(err: unknown): string {
  if (err && typeof err === "object") {
    const e = err as ApiError;
    return e.message ?? e.error ?? "Error inesperado";
  }
  if (typeof err === "string") return err;
  return "Error inesperado";
}

async function fetchAllAdminProducts(): Promise<ProductApiDTO[]> {
  const all: ProductApiDTO[] = [];
  let page = 1;
  const limit = 50;

  while (true) {
    const res = await apiFetch<{ items: ProductApiDTO[] }>(
      `/api/v1/admin/products?page=${page}&limit=${limit}`,
      { auth: true }
    );

    all.push(...res.items);

    if (res.items.length < limit) break;

    page++;
  }

  return all;
}

const Admin = () => {
  const { isAuthenticated, logout } = useAuth();
  const { toast } = useToast();

  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] =
    useState<AdminProduct | null>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [activeCollection, setActiveCollection] = useState<string>("Figuras"); // ⬅️ NUEVO

  const totalProducts = products.length;
  const inStockProducts = products.filter((p) => p.inStock).length;
  const outOfStockProducts = products.filter((p) => !p.inStock).length;

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();

    return products.filter((p) => {
      const matchesSearch =
        q.length === 0 ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.category ?? "").toLowerCase().includes(q) ||
        (p.collection ?? "").toLowerCase().includes(q);

      const matchesCategory =
        categoryFilter === "all" || p.category === categoryFilter;

      const matchesCollection = p.collection === activeCollection; // ⬅️ NUEVO

      return matchesSearch && matchesCategory && matchesCollection;
    });
  }, [products, search, categoryFilter, activeCollection]);

  /* ======================= LOAD ======================= */
  useEffect(() => {
    if (!isAuthenticated) return;

    async function loadData() {
      try {
        const categoriesRes = await apiFetch<Category[]>("/api/v1/categories");
        setCategories(categoriesRes);

        const items = await fetchAllAdminProducts();
        setProducts(mapAdminProducts(items, categoriesRes));
      } catch (error: unknown) {
        toast({
          title: "Error",
          description: getErrorMessage(error),
          variant: "destructive",
        });
      }
    }

    loadData();
  }, [isAuthenticated, toast]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      collection: activeCollection, // ⬅️ hereda la colección actual
    });
    setDialogOpen(true);
  };

  const openEdit = (p: AdminProduct) => {
    setEditing(p);
    const categoryId =
      p.categoryId ?? categories.find((c) => c.name === p.category)?.id ?? "";

    setForm({
      name: p.name,
      categoryId,
      description: p.description,
      imageFile: null,
      imagePreview: p.image,
      inStock: p.inStock,
      stockQty: p.stockQty ?? 0,
      collection: p.collection ?? "Figuras", // ⬅️ NUEVO
    });
    setDialogOpen(true);
  };

  const openDelete = (p: AdminProduct) => {
    setProductToDelete(p);
    setDeleteDialogOpen(true);
  };

  const toggleStock = async (product: AdminProduct) => {
    try {
      const newInStock = !product.inStock;

      await apiFetch(`/api/v1/admin/products/${product.id}`, {
        method: "PUT",
        auth: true,
        body: JSON.stringify({ inStock: newInStock }),
      });

      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, inStock: newInStock } : p
        )
      );

      toast({
        title: "Actualizado",
        description: `${product.name} ahora está ${
          newInStock ? "disponible" : "sin stock"
        }`,
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;

    try {
      await apiFetch(`/api/v1/admin/products/${productToDelete.id}`, {
        method: "DELETE",
        auth: true,
      });

      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
      setDeleteDialogOpen(false);
      setProductToDelete(null);

      toast({
        title: "Éxito",
        description: "Producto eliminado correctamente",
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.categoryId || !form.description) {
      toast({
        title: "Error",
        description: "Nombre, categoría y descripción son obligatorios",
        variant: "destructive",
      });
      return;
    }

    try {
      let productId: string;

      if (editing) {
        const updated = await apiFetch<ProductApiDTO>(
          `/api/v1/admin/products/${editing.id}`,
          {
            method: "PUT",
            auth: true,
            body: JSON.stringify({
              name: form.name,
              description: form.description,
              categoryId: form.categoryId,
              inStock: form.inStock,
              stockQty: form.stockQty,
              collection: form.collection, // ⬅️ NUEVO
            }),
          }
        );
        productId = updated.id;
      } else {
        const created = await apiFetch<ProductApiDTO>("/api/v1/admin/products", {
          method: "POST",
          auth: true,
          body: JSON.stringify({
            name: form.name,
            description: form.description,
            categoryId: form.categoryId,
            inStock: form.inStock,
            stockQty: form.stockQty,
            collection: form.collection, // ⬅️ NUEVO
          }),
        });
        productId = created.id;
      }

      if (form.imageFile) {
        const fd = new FormData();
        fd.append("image", form.imageFile);

        await apiFetch(`/api/v1/admin/products/${productId}/image`, {
          method: "POST",
          auth: true,
          body: fd,
        });
      }

      setDialogOpen(false);
      setForm(EMPTY_FORM);

      const items = await fetchAllAdminProducts();
      setProducts(mapAdminProducts(items, categories));

      toast({
        title: "Éxito",
        description: editing
          ? "Producto actualizado correctamente"
          : "Producto creado correctamente",
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="sticky top-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <Package className="w-6 h-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Panel Admin
            </span>
          </h1>
          <Button variant="ghost" onClick={logout} className="hover:bg-white/10">
            <LogOut className="w-4 h-4 mr-2" />
            Salir
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-purple-200">
                Total de Productos
              </CardTitle>
              <Package className="w-5 h-5 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{totalProducts}</div>
              <p className="text-xs text-purple-300 mt-1">En tu catálogo</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border-emerald-500/20 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-emerald-200">
                En Stock
              </CardTitle>
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{inStockProducts}</div>
              <p className="text-xs text-emerald-300 mt-1">Disponibles para venta</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rose-500/10 to-rose-600/10 border-rose-500/20 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-rose-200">
                Sin Stock
              </CardTitle>
              <AlertCircle className="w-5 h-5 text-rose-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{outOfStockProducts}</div>
              <p className="text-xs text-rose-300 mt-1">Requieren atención</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Gestión de Productos</h2>
            <p className="text-sm text-gray-400 mt-1">
              Administra tu inventario completo
            </p>
          </div>
          <Button
            onClick={openCreate}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo producto
          </Button>
        </div>

        {/* ⬅️ NUEVO: Selector de colecciones */}
        <div className="flex justify-center gap-3">
          {["Bloques", "Personajes"].map((c) => (
            <button
              key={c}
              onClick={() => setActiveCollection(c)}
              className={`px-6 py-3 rounded-xl border text-sm font-medium transition-all ${
                activeCollection === c
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30 shadow-lg shadow-cyan-500/20"
                  : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Buscar por nombre, categoría o descripción..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-500 w-full sm:w-[380px]"
              />
              {search.trim().length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearch("")}
                  className="absolute right-1 top-1/2 -translate-y-1/2 hover:bg-white/10"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-white/40" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white w-full sm:w-64">
                  <SelectValue placeholder="Filtrar categoría" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10">
                  <SelectItem value="all" className="text-white">
                    Todas
                  </SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.name} className="text-white">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-sm text-gray-400">
            Mostrando{" "}
            <span className="text-white/80 font-medium">
              {filteredProducts.length}
            </span>{" "}
            de{" "}
            <span className="text-white/80 font-medium">{products.length}</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 backdrop-blur overflow-hidden shadow-2xl">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-white/5">
                <TableHead className="text-gray-300">Imagen</TableHead>
                <TableHead className="text-gray-300">Nombre</TableHead>
                <TableHead className="text-gray-300">Categoría</TableHead>
                <TableHead className="text-gray-300">Colección</TableHead>
                <TableHead className="text-gray-300">Descripción</TableHead>
                <TableHead className="text-gray-300">Stock</TableHead>
                <TableHead className="text-gray-300">Disponible</TableHead>
                <TableHead className="text-right text-gray-300">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 rounded-full bg-white/5">
                        <Package className="w-12 h-12 text-white/20" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-white/60">
                          {products.length === 0
                            ? "No hay productos aún"
                            : "No hay resultados"}
                        </p>
                        <p className="text-sm text-white/40 mt-1">
                          {products.length === 0
                            ? "Comienza agregando tu primer producto"
                            : "Probá cambiando la búsqueda o el filtro"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow
                    key={product.id}
                    className="border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <TableCell>
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-14 h-14 object-cover rounded-lg ring-2 ring-white/10"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-gradient-to-br from-white/5 to-white/10 rounded-lg flex items-center justify-center ring-2 ring-white/10">
                          <Package className="w-7 h-7 text-white/30" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-white">
                      {product.name}
                    </TableCell>
                    <TableCell>
                      <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-medium border border-purple-500/30">
                        {product.category}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-medium border border-cyan-500/30">
                        {product.collection}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-gray-300">
                      {product.description}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-300">
                        {product.stockQty && product.stockQty > 0
                          ? `${product.stockQty} unidades`
                          : "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={product.inStock}
                          onCheckedChange={() => toggleStock(product)}
                          className="data-[state=checked]:bg-emerald-500"
                        />
                        <span
                          className={`text-xs font-medium ${
                            product.inStock ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {product.inStock ? "Disponible" : "Sin stock"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(product)}
                          className="hover:bg-purple-500/20 hover:text-purple-300"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDelete(product)}
                          className="hover:bg-rose-500/20 hover:text-rose-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {editing ? "Editar producto" : "Nuevo producto"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Nombre</label>
              <Input
                placeholder="Ej: Pizza Margherita"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Descripción
              </label>
              <Textarea
                placeholder="Describe el producto..."
                value={form.description}
                rows={4}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Categoría</label>
                <Select
                  value={form.categoryId}
                  onValueChange={(value) => setForm({ ...form, categoryId: value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10">
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-white">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Colección</label>
                <Select
                  value={form.collection}
                  onValueChange={(value) => setForm({ ...form, collection: value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Seleccionar colección" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10">
                    <SelectItem value="Bloques" className="text-white">Bloques</SelectItem>
                    <SelectItem value="Personajes" className="text-white">Personajes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Imagen</label>
              <ImageDropzone
                preview={form.imagePreview}
                onImageSelect={(file) => setForm({ ...form, imageFile: file })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Disponibilidad
                </label>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                  <Switch
                    checked={form.inStock}
                    onCheckedChange={(checked) =>
                      setForm({ ...form, inStock: checked })
                    }
                    className="data-[state=checked]:bg-emerald-500"
                  />
                  <span className="text-sm text-white">
                    {form.inStock ? "Disponible" : "Sin stock"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Cantidad (opcional)
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.stockQty || ""}
                  onChange={(e) =>
                    setForm({ ...form, stockQty: parseInt(e.target.value) || 0 })
                  }
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDialogOpen(false)}
                className="hover:bg-white/10"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                {editing ? "Guardar cambios" : "Crear producto"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Esta acción no se puede deshacer. Se eliminará permanentemente el producto "
              {productToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 hover:bg-white/10 border-white/10 text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-500 hover:bg-rose-600 text-white"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;