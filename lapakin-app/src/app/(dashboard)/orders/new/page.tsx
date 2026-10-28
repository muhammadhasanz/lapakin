'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Receipt,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { toast } from '@/components/ui/toast';

interface CustomerOption {
  id: string;
  customer_name: string;
  customer_address: string;
  phone?: string | null;
}

interface ProductOption {
  id: number;
  product_code: string;
  product_name: string;
  stock: number;
  price: number;
}

interface FormOrderItem {
  key: string;
  productId: number;
  quantity: number;
}

export default function CreateOrderPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [customerId, setCustomerId] = React.useState<string>('');
  const [items, setItems] = React.useState<FormOrderItem[]>([
    { key: 'row-1', productId: 0, quantity: 1 },
  ]);
  const [serverErrors, setServerErrors] = React.useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = React.useState<string | null>(null);

  // Fetch Customers
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['order-customers'],
    queryFn: async () => {
      const res = await apiFetch<CustomerOption[]>('/api/customers?page=1&per_page=100');
      return res.data || [];
    },
  });

  // Fetch Products
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['order-products'],
    queryFn: async () => {
      const res = await apiFetch<ProductOption[]>('/api/products?page=1&per_page=100');
      return res.data || [];
    },
  });

  const productMap = React.useMemo(() => {
    return new Map(products.map((p) => [p.id, p]));
  }, [products]);

  // Base UI Select needs the full items list to render the selected label.
  // A `null` item acts as the placeholder.
  const customerItems = React.useMemo(
    () => [
      {
        label: isLoadingCustomers ? 'Loading customers...' : 'Select a customer...',
        value: null as string | null,
      },
      ...customers.map((c) => ({
        label: `${c.customer_name}${c.phone ? ` (${c.phone})` : ''}`,
        value: c.id as string | null,
      })),
    ],
    [customers, isLoadingCustomers],
  );

  const productItems = React.useMemo(
    () => [
      {
        label: isLoadingProducts ? 'Loading products...' : 'Select catalog product...',
        value: null as string | null,
      },
      ...products.map((p) => ({
        label: `${p.product_name} (${p.product_code}) — Stock: ${p.stock}`,
        value: String(p.id) as string | null,
      })),
    ],
    [products, isLoadingProducts],
  );

  const handleAddRow = () => {
    setItems((prev) => [
      ...prev,
      { key: `row-${Date.now()}-${Math.random()}`, productId: 0, quantity: 1 },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (items.length <= 1) {
      toast.warning('Order must contain at least 1 product line item');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
    setServerErrors({});
  };

  const handleProductChange = (index: number, productIdStr: string) => {
    const prodId = Number(productIdStr);
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index]!, productId: prodId };
      return copy;
    });
    setServerErrors({});
  };

  const handleQuantityChange = (index: number, qtyStr: string) => {
    const qty = parseInt(qtyStr, 10);
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index]!, quantity: isNaN(qty) ? 1 : Math.max(1, qty) };
      return copy;
    });
    setServerErrors({});
  };

  // Real-time client preview total
  const calculatedTotal = React.useMemo(() => {
    return items.reduce((acc, item) => {
      const prod = productMap.get(item.productId);
      if (!prod) return acc;
      return acc + prod.price * item.quantity;
    }, 0);
  }, [items, productMap]);

  // Mutation Create Order
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!customerId) {
        throw new Error('Please select a customer first');
      }

      const invalidItem = items.find((i) => i.productId === 0 || i.quantity <= 0);
      if (invalidItem) {
        throw new Error('Please select a product and valid quantity for all line items');
      }

      const payload = {
        customer_id: customerId,
        items: items.map((i) => ({
          product_id: i.productId,
          quantity: i.quantity,
        })),
      };

      return apiFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (res) => {
      toast.success('Order created successfully!');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      router.push(`/orders/${res.data.id}`);
    },
    onError: (err: any) => {
      if (err.errors) {
        setServerErrors(err.errors);
      }
      setGeneralError(err.message || 'Failed to process transaction');
      toast.error(err.message || 'Failed to create order');
    },
  });

  const selectedCustomer = customers.find((c) => c.id === customerId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link href="/orders">
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Button>
        </Link>
        <span className="text-xs text-slate-500 font-medium">New Sales Order</span>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setGeneralError(null);
          setServerErrors({});
          createOrderMutation.mutate();
        }}
        className="space-y-6"
      >
        {/* Customer Selection Card */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold text-slate-900">
              1. Customer Information
            </CardTitle>
            <CardDescription className="text-xs">
              Select the registered customer for this order.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="max-w-md">
              <Label htmlFor="customer_select" className="mb-1.5 block">
                Customer Name
              </Label>
              <Select
                items={customerItems}
                value={customerId || null}
                onValueChange={(val) => setCustomerId(val ?? '')}
              >
                <SelectTrigger id="customer_select" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {customerItems
                      .filter((item) => item.value !== null)
                      .map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {serverErrors.customer_id && (
                <p className="mt-1 text-xs text-destructive font-medium">
                  {serverErrors.customer_id[0]}
                </p>
              )}
            </div>

            {selectedCustomer && (
              <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200/60 max-w-md">
                <p className="font-semibold text-slate-900">{selectedCustomer.customer_name}</p>
                <p className="mt-0.5">{selectedCustomer.customer_address}</p>
                {selectedCustomer.phone && (
                  <p className="font-mono mt-0.5">{selectedCustomer.phone}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Products Order Lines Card */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                2. Order Items
              </CardTitle>
              <CardDescription className="text-xs">
                Add products, verify stock availability, and adjust quantities.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddRow}
              className="gap-1.5 text-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Product Line
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            {generalError && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm font-semibold text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {generalError}
              </div>
            )}

            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-[50px] text-center">#</TableHead>
                    <TableHead>Product & Available Stock</TableHead>
                    <TableHead className="w-[140px] text-right">Unit Price</TableHead>
                    <TableHead className="w-[120px] text-center">Qty</TableHead>
                    <TableHead className="w-[150px] text-right">Subtotal</TableHead>
                    <TableHead className="w-[60px] text-center"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => {
                    const prod = productMap.get(item.productId);
                    const subtotal = prod ? prod.price * item.quantity : 0;
                    const rowQtyError = serverErrors[`items.${index}.quantity`];
                    const rowProdError = serverErrors[`items.${index}.product_id`];

                    return (
                      <React.Fragment key={item.key}>
                        <TableRow>
                          <TableCell className="text-center font-bold text-slate-400 text-xs">
                            {index + 1}
                          </TableCell>

                          <TableCell>
                            <Select
                              items={productItems}
                              value={item.productId > 0 ? String(item.productId) : null}
                              onValueChange={(val) => handleProductChange(index, val ?? '0')}
                            >
                              <SelectTrigger className="h-9 w-full min-w-[220px] text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  {productItems
                                    .filter((p) => p.value !== null)
                                    .map((p) => (
                                      <SelectItem key={p.value} value={p.value}>
                                        {p.label}
                                      </SelectItem>
                                    ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </TableCell>

                          <TableCell className="text-right text-xs text-slate-700">
                            {prod ? formatCurrency(prod.price) : '-'}
                          </TableCell>

                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              className="h-9 text-center font-bold text-xs"
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(index, e.target.value)}
                              required
                            />
                          </TableCell>

                          <TableCell className="text-right font-bold text-slate-900 text-xs">
                            {formatCurrency(subtotal)}
                          </TableCell>

                          <TableCell className="text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveRow(index)}
                              title="Remove Line"
                              className="h-8 w-8 text-slate-400 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>

                        {/* Row for Server Validation / Insufficient Stock Error */}
                        {(rowQtyError || rowProdError) && (
                          <TableRow className="bg-destructive/5 hover:bg-destructive/5 border-t-0">
                            <TableCell colSpan={6} className="py-2 px-4">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                {rowQtyError ? rowQtyError[0] : rowProdError ? rowProdError[0] : ''}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Total Summary Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRow}
                className="gap-1.5 text-xs font-semibold w-full sm:w-auto"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Another Product Line
              </Button>

              <div className="flex items-center gap-4 text-right w-full sm:w-auto justify-end">
                <span className="text-sm font-semibold text-slate-500">Total Order Amount:</span>
                <span className="text-2xl font-black text-primary">
                  {formatCurrency(calculatedTotal)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Actions */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <Link href="/orders" className="w-full sm:w-auto">
            <Button type="button" variant="outline" disabled={createOrderMutation.isPending} className="w-full sm:w-auto">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={createOrderMutation.isPending || calculatedTotal <= 0}
            className="gap-2 px-8 shadow-xs font-bold w-full sm:w-auto"
          >
            {createOrderMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing Order...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Create Order
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
