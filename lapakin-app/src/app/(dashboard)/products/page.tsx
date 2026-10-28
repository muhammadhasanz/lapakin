'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { apiFetch, type PageMeta } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/toast';

const SORT_OPTIONS = [
  { label: 'Name (A - Z)', value: 'product_name' },
  { label: 'Name (Z - A)', value: '-product_name' },
  { label: 'Lowest Price', value: 'price' },
  { label: 'Highest Price', value: '-price' },
  { label: 'Lowest Stock', value: 'stock' },
  { label: 'Highest Stock', value: '-stock' },
];

interface Product {
  id: number;
  product_code: string;
  product_name: string;
  stock: number;
  price: number;
  created_at?: string;
  updated_at?: string;
}

export default function ProductsPage() {
  const queryClient = useQueryClient();

  // State filtering & pagination
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);
  const [searchInput, setSearchInput] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortField, setSortField] = React.useState<string>('product_name');

  // Dialog State
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);

  // Form Fields
  const [productCode, setProductCode] = React.useState('');
  const [productName, setProductName] = React.useState('');
  const [stock, setStock] = React.useState<number | string>(0);
  const [price, setPrice] = React.useState<number | string>('');
  const [formErrors, setFormErrors] = React.useState<Record<string, string[]>>({});

  // Delete State
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [productToDelete, setProductToDelete] = React.useState<Product | null>(null);

  // Debounced search trigger
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setPage(1);
  };

  // Fetch Products
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['products', page, perPage, searchQuery, sortField],
    queryFn: async () => {
      const q = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
        search: searchQuery,
        sort: sortField,
      });
      const res = await apiFetch<Product[]>(`/api/products?${q.toString()}`);
      return {
        products: res.data || [],
        meta: res.meta || { page: 1, per_page: 10, total: 0, total_pages: 1 },
      };
    },
  });

  // Open Create Dialog
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setProductCode('');
    setProductName('');
    setStock(0);
    setPrice('');
    setFormErrors({});
    setFormDialogOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setProductCode(p.product_code);
    setProductName(p.product_name);
    setStock(p.stock);
    setPrice(p.price);
    setFormErrors({});
    setFormDialogOpen(true);
  };

  // Save Mutation (Create / Update)
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        product_code: productCode.trim(),
        product_name: productName.trim(),
        stock: Number(stock),
        price: Number(price),
      };

      if (editingProduct) {
        return apiFetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        return apiFetch('/api/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
    },
    onSuccess: () => {
      toast.success(
        editingProduct ? 'Product updated successfully!' : 'Product created successfully!',
      );
      setFormDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
    onError: (err: any) => {
      if (err.errors) {
        setFormErrors(err.errors);
      }
      toast.error(err.message || 'Failed to save product');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiFetch(`/api/products/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      toast.success('Product deleted successfully (soft delete)');
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete product');
    },
  });

  const products = data?.products || [];
  const meta: PageMeta = data?.meta || { page: 1, per_page: 10, total: 0, total_pages: 1 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Products Master
          </h2>
          <p className="text-sm text-slate-500">
            Manage product catalog, inventory stock levels, and retail prices.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2 shadow-xs font-semibold">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border-slate-200">
        <CardContent>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search product name or code..."
                  className="pl-9 text-sm"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              <Button type="submit" variant="secondary">
                Search
              </Button>
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSearchInput('');
                    setSearchQuery('');
                    setPage(1);
                  }}
                  className="text-xs text-slate-500"
                >
                  Reset
                </Button>
              )}
            </form>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 whitespace-nowrap">Sort by:</span>
              <Select
                items={SORT_OPTIONS}
                value={sortField}
                onValueChange={(val) => {
                  setSortField(val ?? 'product_name');
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[180px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {SORT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card className="border-slate-200 shadow-xs">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-[120px]">Code</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-center w-[120px]">Stock</TableHead>
                <TableHead className="text-right w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary mb-2" />
                    Loading product catalog...
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                    No products found.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs font-semibold text-slate-700">
                      {p.product_code}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      {p.product_name}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-slate-900">
                      {formatCurrency(p.price)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={p.stock === 0 ? 'destructive' : p.stock < 5 ? 'warning' : 'outline'}
                        className="font-bold"
                      >
                        {p.stock} units
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(p)}
                          title="Edit Product"
                          className="h-8 w-8 text-slate-500 hover:text-primary"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setProductToDelete(p);
                            setDeleteDialogOpen(true);
                          }}
                          title="Delete Product"
                          className="h-8 w-8 text-slate-400 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 px-6 py-4">
            <span className="text-xs text-slate-500">
              Showing {products.length > 0 ? (meta.page - 1) * meta.per_page + 1 : 0} -{' '}
              {Math.min(meta.page * meta.per_page, meta.total)} of{' '}
              <strong className="text-slate-900">{meta.total}</strong> total products
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={meta.page <= 1 || isFetching}
                className="gap-1 text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </Button>
              <span className="text-xs font-medium text-slate-700 px-2">
                Page {meta.page} of {meta.total_pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(meta.total_pages, p + 1))}
                disabled={meta.page >= meta.total_pages || isFetching}
                className="gap-1 text-xs"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Form Tambah / Edit Produk */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate();
            }}
          >
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
              <DialogDescription>
                Fill in product code, name, initial stock, and unit price.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Product Code */}
              <div className="space-y-1.5">
                <Label htmlFor="product_code">Product Code</Label>
                <Input
                  id="product_code"
                  placeholder="e.g. P0001"
                  value={productCode}
                  onChange={(e) => setProductCode(e.target.value.toUpperCase())}
                  required
                />
                {formErrors.product_code && (
                  <p className="text-xs text-destructive">{formErrors.product_code[0]}</p>
                )}
              </div>

              {/* Product Name */}
              <div className="space-y-1.5">
                <Label htmlFor="product_name">Product Name</Label>
                <Input
                  id="product_name"
                  placeholder="e.g. Hydrococo 150ml"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  required
                />
                {formErrors.product_name && (
                  <p className="text-xs text-destructive">{formErrors.product_name[0]}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Stock */}
                <div className="space-y-1.5">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    required
                  />
                  {formErrors.stock && (
                    <p className="text-xs text-destructive">{formErrors.stock[0]}</p>
                  )}
                </div>

                {/* Price */}
                <div className="space-y-1.5">
                  <Label htmlFor="price">Unit Price (IDR)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="1"
                    placeholder="12000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                  {formErrors.price && (
                    <p className="text-xs text-destructive">{formErrors.price[0]}</p>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormDialogOpen(false)}
                disabled={saveMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Product'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog Konfirmasi Soft Delete */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Delete Product?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete product{' '}
              <strong>{productToDelete?.product_name}</strong> (
              <span className="font-mono">{productToDelete?.product_code}</span>)? This product
              will be soft-deleted and cannot be selected for new orders. Historical orders
              containing this product remain safe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (productToDelete) {
                  deleteMutation.mutate(productToDelete.id);
                }
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

