'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
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
import { formatDateOnly } from '@/lib/utils';
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

const GENDER_OPTIONS = [
  { label: 'Male', value: 'Pria' },
  { label: 'Female', value: 'Wanita' },
];

interface Customer {
  id: string;
  customer_name: string;
  customer_address: string;
  gender: 'Pria' | 'Wanita';
  birth_date: string;
  phone?: string | null;
  created_at?: string;
  updated_at?: string;
}

export default function CustomersPage() {
  const queryClient = useQueryClient();

  // State filtering & pagination
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);
  const [searchInput, setSearchInput] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');

  // Dialog State
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [editingCustomer, setEditingCustomer] = React.useState<Customer | null>(null);

  // Form Fields
  const [customerName, setCustomerName] = React.useState('');
  const [customerAddress, setCustomerAddress] = React.useState('');
  const [gender, setGender] = React.useState<'Pria' | 'Wanita'>('Pria');
  const [birthDate, setBirthDate] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [formErrors, setFormErrors] = React.useState<Record<string, string[]>>({});

  // Delete State
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [customerToDelete, setCustomerToDelete] = React.useState<Customer | null>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setPage(1);
  };

  // Fetch Customers
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['customers', page, perPage, searchQuery],
    queryFn: async () => {
      const q = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
        search: searchQuery,
      });
      const res = await apiFetch<Customer[]>(`/api/customers?${q.toString()}`);
      return {
        customers: res.data || [],
        meta: res.meta || { page: 1, per_page: 10, total: 0, total_pages: 1 },
      };
    },
  });

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setCustomerName('');
    setCustomerAddress('');
    setGender('Pria');
    setBirthDate('');
    setPhone('');
    setFormErrors({});
    setFormDialogOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setCustomerName(c.customer_name);
    setCustomerAddress(c.customer_address);
    setGender(c.gender);
    setBirthDate(c.birth_date);
    setPhone(c.phone || '');
    setFormErrors({});
    setFormDialogOpen(true);
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        customer_name: customerName.trim(),
        customer_address: customerAddress.trim(),
        gender,
        birth_date: birthDate,
        phone: phone.trim() || undefined,
      };

      if (editingCustomer) {
        return apiFetch(`/api/customers/${editingCustomer.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        return apiFetch('/api/customers', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
    },
    onSuccess: () => {
      toast.success(
        editingCustomer
          ? 'Customer updated successfully!'
          : 'New customer created successfully!',
      );
      setFormDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (err: any) => {
      if (err.errors) {
        setFormErrors(err.errors);
      }
      toast.error(err.message || 'Failed to save customer data');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiFetch(`/api/customers/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      toast.success('Customer deleted successfully (soft delete)');
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete customer');
    },
  });

  const customers = data?.customers || [];
  const meta: PageMeta = data?.meta || { page: 1, per_page: 10, total: 0, total_pages: 1 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Customers Master
          </h2>
          <p className="text-sm text-slate-500">
            Registered customer profiles for order placement.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2 shadow-xs font-semibold">
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border-slate-200">
        <CardContent>
          <form onSubmit={handleSearchSubmit} className="flex max-w-md items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search customer name..."
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
                size="sm"
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
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card className="border-slate-200 shadow-xs">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Customer Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="w-[100px] text-center">Gender</TableHead>
                <TableHead className="w-[140px]">Date of Birth</TableHead>
                <TableHead className="w-[140px]">Phone Number</TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary mb-2" />
                    Loading customer data...
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                    No customers found.
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-semibold text-slate-900">
                      {c.customer_name}
                    </TableCell>
                    <TableCell className="text-slate-600 max-w-[240px] truncate" title={c.customer_address}>
                      {c.customer_address}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={c.gender === 'Pria' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {c.gender === 'Pria' ? 'Male' : 'Female'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {formatDateOnly(c.birth_date)}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-slate-600">
                      {c.phone || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(c)}
                          title="Edit Customer"
                          className="h-8 w-8 text-slate-500 hover:text-primary"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setCustomerToDelete(c);
                            setDeleteDialogOpen(true);
                          }}
                          title="Delete Customer"
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
              Showing {customers.length > 0 ? (meta.page - 1) * meta.per_page + 1 : 0} -{' '}
              {Math.min(meta.page * meta.per_page, meta.total)} of{' '}
              <strong className="text-slate-900">{meta.total}</strong> total customers
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

      {/* Dialog Tambah / Edit Pelanggan */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate();
            }}
          >
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </DialogTitle>
              <DialogDescription>
                Fill in complete customer profile.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="customer_name">Full Name</Label>
                <Input
                  id="customer_name"
                  placeholder="e.g. Budi Santoso"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
                {formErrors.customer_name && (
                  <p className="text-xs text-destructive">{formErrors.customer_name[0]}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="customer_address">Delivery Address</Label>
                <Input
                  id="customer_address"
                  placeholder="e.g. Jl. Sudirman No. 45, Jakarta Selatan"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  required
                />
                {formErrors.customer_address && (
                  <p className="text-xs text-destructive">{formErrors.customer_address[0]}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    items={GENDER_OPTIONS}
                    value={gender}
                    onValueChange={(val) => setGender((val ?? 'Pria') as Customer['gender'])}
                  >
                    <SelectTrigger id="gender" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {GENDER_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {formErrors.gender && (
                    <p className="text-xs text-destructive">{formErrors.gender[0]}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="birth_date">Date of Birth</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    required
                  />
                  {formErrors.birth_date && (
                    <p className="text-xs text-destructive">{formErrors.birth_date[0]}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone Number (WhatsApp)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="e.g. 081234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                {formErrors.phone && (
                  <p className="text-xs text-destructive">{formErrors.phone[0]}</p>
                )}
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
                  'Save Customer'
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
              Delete Customer?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete customer{' '}
              <strong>{customerToDelete?.customer_name}</strong>? This record will be soft-deleted
              and cannot be used for new orders. Existing transaction history remains intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (customerToDelete) {
                  deleteMutation.mutate(customerToDelete.id);
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

