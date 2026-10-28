'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Receipt,
  Printer,
  ShoppingBag,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface OrderDetailItem {
  id: number;
  product_id: number;
  product_code?: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface OrderDetail {
  id: number;
  order_number: string;
  customer_id: string;
  customer_name?: string;
  created_by: string;
  created_by_name?: string;
  order_date: string;
  total_amount: number;
  items: OrderDetailItem[];
  created_at?: string;
}

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['order-detail', orderId],
    queryFn: async () => {
      const res = await apiFetch<OrderDetail>(`/api/orders/${orderId}`);
      return res.data;
    },
    enabled: Boolean(orderId),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-slate-500">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="space-y-4">
        <Link href="/orders">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Button>
        </Link>
        <Card className="border-destructive/30 bg-destructive/5 text-center p-8">
          <AlertTriangle className="mx-auto h-8 w-8 text-destructive mb-2" />
          <p className="text-destructive font-semibold">Order not found.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between print:hidden">
        <Link href="/orders">
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          className="gap-2 text-xs font-semibold shadow-2xs"
        >
          <Printer className="h-4 w-4 text-slate-600" />
          Print Order
        </Button>
      </div>

      {/* Order Card */}
      <Card className="border-slate-200 shadow-xs overflow-hidden print:border-none print:shadow-none">
        {/* Order Header Banner */}
        <div className="border-b border-slate-200 bg-slate-50/70 p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Receipt className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                  {order.order_number}
                </h2>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Sales Order — Lapakin
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                Completed & Paid
              </span>
              <p className="mt-2 text-xs text-slate-500">
                Transaction Date:{' '}
                <strong className="text-slate-800">{formatDate(order.order_date)}</strong>
              </p>
            </div>
          </div>
        </div>

        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 border border-slate-200/60">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Customer Information
              </span>
              <p className="text-base font-bold text-slate-900 mt-1">
                {order.customer_name || 'Registered Customer'}
              </p>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                ID: {order.customer_id}
              </p>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Cashier / Issued By
              </span>
              <p className="text-base font-bold text-slate-900 mt-1">
                {order.created_by_name || 'Admin'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                User ID: {order.created_by}
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-slate-500" />
              Purchased Line Items
            </h3>

            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80">
                    <TableHead className="w-[120px]">Code</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead className="text-right w-[140px]">Unit Price</TableHead>
                    <TableHead className="text-center w-[100px]">Qty</TableHead>
                    <TableHead className="text-right w-[160px]">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs font-semibold text-slate-600">
                        {item.product_code || `P#${item.product_id}`}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {item.product_name || `Product #${item.product_id}`}
                      </TableCell>
                      <TableCell className="text-right text-slate-700">
                        {formatCurrency(item.unit_price)}
                      </TableCell>
                      <TableCell className="text-center font-bold text-slate-900">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-900">
                        {formatCurrency(item.subtotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Total Calculation Footer */}
          <div className="flex justify-end pt-4 border-t border-slate-200">
            <div className="w-full sm:w-72 space-y-2">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Total Items</span>
                <span className="font-semibold text-slate-800">
                  {order.items.reduce((acc, i) => acc + i.quantity, 0)} units
                </span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Due</span>
                <span className="text-xl text-primary font-black">
                  {formatCurrency(order.total_amount)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
