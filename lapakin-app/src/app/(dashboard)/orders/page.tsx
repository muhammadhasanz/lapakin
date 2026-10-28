'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Receipt,
  Plus,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  Filter,
  X,
} from 'lucide-react';
import { apiFetch, type PageMeta } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface OrderItemSummary {
  id: number;
  order_number: string;
  customer_id: string;
  customer_name?: string;
  created_by: string;
  created_by_name?: string;
  order_date: string;
  total_amount: number;
  total_items: number;
  created_at: string;
}

interface CustomerOption {
  id: string;
  customer_name: string;
}

export default function OrdersListPage() {
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);
  const [fromInput, setFromInput] = React.useState('');
  const [toInput, setToInput] = React.useState('');
  const [customerId, setCustomerId] = React.useState('all');

  // Active filter state
  const [activeFilters, setActiveFilters] = React.useState<{
    from?: string;
    to?: string;
    customerId?: string;
  }>({});

  // Fetch Customers for Filter dropdown
  const { data: customerData } = useQuery({
    queryKey: ['filter-customers'],
    queryFn: async () => {
      const res = await apiFetch<CustomerOption[]>('/api/customers?page=1&per_page=100');
      return res.data || [];
    },
  });

  const customerFilterItems = React.useMemo(
    () => [
      { label: 'All Customers', value: 'all' },
      ...(customerData ?? []).map((c) => ({ label: c.customer_name, value: c.id })),
    ],
    [customerData],
  );

  // Fetch Orders
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['orders', page, perPage, activeFilters],
    queryFn: async () => {
      const q = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      });

      if (activeFilters.from) q.set('from', activeFilters.from);
      if (activeFilters.to) q.set('to', activeFilters.to);
      if (activeFilters.customerId && activeFilters.customerId !== 'all') {
        q.set('customer_id', activeFilters.customerId);
      }

      const res = await apiFetch<OrderItemSummary[]>(`/api/orders?${q.toString()}`);
      return {
        orders: res.data || [],
        meta: res.meta || { page: 1, per_page: 10, total: 0, total_pages: 1 },
      };
    },
  });

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveFilters({
      from: fromInput || undefined,
      to: toInput || undefined,
      customerId: customerId !== 'all' ? customerId : undefined,
    });
    setPage(1);
  };

  const handleResetFilter = () => {
    setFromInput('');
    setToInput('');
    setCustomerId('all');
    setActiveFilters({});
    setPage(1);
  };

  const orders = data?.orders || [];
  const meta: PageMeta = data?.meta || { page: 1, per_page: 10, total: 0, total_pages: 1 };
  const hasFilterActive = Boolean(
    activeFilters.from || activeFilters.to || activeFilters.customerId,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Orders
          </h2>
          <p className="text-sm text-slate-500">
            Sales order history with date and customer filters.
          </p>
        </div>
        <Link href="/orders/new">
          <Button className="gap-2 shadow-xs font-semibold">
            <Plus className="h-4 w-4" />
            New Order
          </Button>
        </Link>
      </div>

      {/* Filter Card */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <form onSubmit={handleApplyFilter} className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:flex sm:items-center">
              <div className="space-y-1">
                <Label htmlFor="from" className="text-xs text-slate-500">
                  From Date
                </Label>
                <Input
                  id="from"
                  type="date"
                  className="h-9 text-xs"
                  value={fromInput}
                  onChange={(e) => setFromInput(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="to" className="text-xs text-slate-500">
                  To Date
                </Label>
                <Input
                  id="to"
                  type="date"
                  className="h-9 text-xs"
                  value={toInput}
                  onChange={(e) => setToInput(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 space-y-1 min-w-[200px]">
              <Label className="text-xs text-slate-500">Customer</Label>
              <Select
                items={customerFilterItems}
                value={customerId}
                onValueChange={(val) => setCustomerId(val ?? 'all')}
              >
                <SelectTrigger className="h-9 w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {customerFilterItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 pt-2 md:pt-0">
              <Button type="submit" variant="secondary" size="sm" className="gap-1.5 h-9 text-xs">
                <Filter className="h-3.5 w-3.5" />
                Filter
              </Button>
              {hasFilterActive && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilter}
                  className="gap-1 h-9 text-xs text-slate-500"
                >
                  <X className="h-3.5 w-3.5" />
                  Reset
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card className="border-slate-200 shadow-xs">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-[180px]">Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="w-[180px]">Order Date</TableHead>
                <TableHead className="w-[140px]">Created By</TableHead>
                <TableHead className="text-right w-[160px]">Total Amount</TableHead>
                <TableHead className="text-right w-[90px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary mb-2" />
                    Loading orders...
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                    No orders found.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs font-bold text-slate-900">
                      {inv.order_number}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      {inv.customer_name || 'Customer'}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {formatDate(inv.order_date)}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {inv.created_by_name || 'Admin'}
                    </TableCell>
                    <TableCell className="text-right font-bold text-slate-900">
                      {formatCurrency(inv.total_amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/orders/${inv.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="View Order Details"
                          className="h-8 w-8 text-slate-500 hover:text-primary"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 px-6 py-4">
            <span className="text-xs text-slate-500">
              Showing {orders.length > 0 ? (meta.page - 1) * meta.per_page + 1 : 0} -{' '}
              {Math.min(meta.page * meta.per_page, meta.total)} of{' '}
              <strong className="text-slate-900">{meta.total}</strong> total orders
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
    </div>
  );
}
