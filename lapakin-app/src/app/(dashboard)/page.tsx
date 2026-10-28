'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  ReceiptText,
  AlertTriangle,
  ArrowRight,
  Package,
  ShoppingCart,
  Loader2,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DashboardSummary {
  total_transactions: number;
  total_sales: number;
  top_products: {
    id: number;
    product_code: string;
    product_name: string;
    total_sold: number;
    total_revenue: number;
  }[];
  low_stock_products: {
    id: number;
    product_code: string;
    product_name: string;
    stock: number;
    price: number;
  }[];
}

export default function DashboardPage() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const res = await apiFetch<DashboardSummary>('/api/dashboard/summary');
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="border-destructive/30 bg-destructive/5 text-center p-8">
        <CardContent className="space-y-4">
          <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
          <p className="text-destructive font-semibold">Failed to load dashboard summary.</p>
          <Button variant="outline" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const summary = data || {
    total_transactions: 0,
    total_sales: 0,
    top_products: [],
    low_stock_products: [],
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Sales Dashboard
          </h2>
          <p className="text-sm text-slate-500">
            Summary of transaction metrics, product performance, and inventory health.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/orders/new">
            <Button size="sm" className="gap-1.5 shadow-xs">
              <PlusCircle className="h-4 w-4" />
              New Order
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Sales */}
        <Card className="border-slate-200 shadow-xs hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Total Sales Revenue
            </CardTitle>
            <div className="rounded-md bg-emerald-50 p-2 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-900">
              {formatCurrency(summary.total_sales)}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Accumulated from all completed orders
            </p>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card className="border-slate-200 shadow-xs hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Total Orders
            </CardTitle>
            <div className="rounded-md bg-blue-50 p-2 text-blue-600">
              <ReceiptText className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-900">
              {summary.total_transactions}
              <span className="text-sm font-normal text-slate-400 ml-1.5">orders</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Total recorded sales transactions
            </p>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card className="border-slate-200 shadow-xs hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Low Stock Alerts
            </CardTitle>
            <div className="rounded-md bg-amber-50 p-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-amber-600">
              {summary.low_stock_products.length}
              <span className="text-sm font-normal text-slate-400 ml-1.5">products</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Products with remaining stock &lt; 5 units
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tables Grid: Top 5 Products & Low Stock Warning */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top 5 Products */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Top 5 Best Selling Products
              </CardTitle>
              <CardDescription className="text-xs">
                Ranked by total quantity sold
              </CardDescription>
            </div>
            <Link href="/products">
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-primary">
                View All <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {summary.top_products.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">
                No product sales data recorded yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Code</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead className="text-right">Sold</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.top_products.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs font-semibold text-slate-600">
                        {item.product_code}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {item.product_name}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-slate-900">
                        {item.total_sold} units
                      </TableCell>
                      <TableCell className="text-right text-xs text-emerald-600 font-semibold">
                        {formatCurrency(item.total_revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Warning */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Low Stock Alert (&lt; 5)
              </CardTitle>
              <CardDescription className="text-xs">
                Requires restocking to prevent stock depletion
              </CardDescription>
            </div>
            <Link href="/products">
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-primary">
                Manage Stock <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {summary.low_stock_products.length === 0 ? (
              <div className="py-8 text-center text-sm text-emerald-600 font-medium">
                All product stocks are in safe levels (&ge; 5 units).
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Code</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead className="text-center">Stock</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.low_stock_products.map((prod) => (
                    <TableRow key={prod.id}>
                      <TableCell className="font-mono text-xs font-semibold text-slate-600">
                        {prod.product_code}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {prod.product_name}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={prod.stock === 0 ? 'destructive' : 'warning'}
                          className="font-bold"
                        >
                          {prod.stock} units
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs text-slate-700">
                        {formatCurrency(prod.price)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

