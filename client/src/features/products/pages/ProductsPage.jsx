import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Search,
  Package,
  Pencil,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { getProductsApi, createProductApi, updateProductApi, deleteProductApi } from '@/api/products.api'
import { useDebounce } from '@/hooks/useDebounce'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/toaster'
import ProductForm from '../components/ProductForm'

const ITEMS_PER_PAGE = 12

const CATEGORIES = [
  'Solar Panels',
  'Inverters',
  'Batteries',
  'Mounting Structures',
  'Cables & Accessories',
  'Monitoring Systems',
  'Other',
]

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function ProductsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [deleteProduct, setDeleteProduct] = useState(null)
  const [formError, setFormError] = useState(null)

  const debouncedSearch = useDebounce(search, 400)

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, debouncedSearch, categoryFilter],
    queryFn: async () => {
      const params = {
        page,
        limit: ITEMS_PER_PAGE,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(categoryFilter && categoryFilter !== 'all' && { category: categoryFilter }),
      }
      const res = await getProductsApi(params)
      return res.data
    },
    keepPreviousData: true,
  })

  const products = data?.data?.products || data?.data || []
  const total = data?.data?.meta?.total || products.length
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE))

  const createMutation = useMutation({
    mutationFn: createProductApi,
    onSuccess: () => {
      queryClient.invalidateQueries(['products'])
      setAddOpen(false)
      setFormError(null)
      toast({ title: 'Product added', description: 'Product has been created successfully.', variant: 'success' })
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to create product')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateProductApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['products'])
      setEditProduct(null)
      setFormError(null)
      toast({ title: 'Product updated', description: 'Product has been updated.', variant: 'success' })
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to update product')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteProductApi,
    onSuccess: () => {
      queryClient.invalidateQueries(['products'])
      setDeleteProduct(null)
      toast({ title: 'Product deleted', description: 'Product has been removed.', variant: 'default' })
    },
    onError: (err) => {
      toast({
        title: 'Delete failed',
        description: err.response?.data?.message || 'Failed to delete product',
        variant: 'destructive',
      })
    },
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Manage your product catalog and pricing</p>
        </div>
        <Button onClick={() => { setFormError(null); setAddOpen(true) }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <Select
          value={categoryFilter}
          onValueChange={(v) => { setCategoryFilter(v); setPage(1) }}
        >
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
              <div className="h-6 bg-muted rounded w-1/3 mt-2" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground">No products found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {search || (categoryFilter && categoryFilter !== 'all')
              ? 'Try adjusting your search or filters.'
              : 'Get started by adding your first product.'}
          </p>
          {!search && (!categoryFilter || categoryFilter === 'all') && (
            <Button className="mt-4" onClick={() => { setFormError(null); setAddOpen(true) }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <div
              key={product._id}
              className="group relative rounded-xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-md transition-all duration-200"
            >
              {/* Status dot */}
              <span
                className={`absolute top-4 right-4 w-2 h-2 rounded-full ${
                  product.isActive !== false ? 'bg-green-500' : 'bg-muted-foreground'
                }`}
              />

              <div className="space-y-2 pr-4">
                <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2">
                  {product.name}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {product.category}
                </Badge>
                {product.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {product.description}
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-lg font-bold text-foreground">
                    {formatCurrency(product.price)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    GST {product.gstPercent}%
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => { setFormError(null); setEditProduct(product) }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteProduct(product)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(page * ITEMS_PER_PAGE, total)} of {total} products
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Add a product to your catalog. It will be available for selection in quotations.
            </DialogDescription>
          </DialogHeader>
          <ProductForm
            onSubmit={(data) => createMutation.mutate(data)}
            onCancel={() => setAddOpen(false)}
            isLoading={createMutation.isPending}
            error={formError}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editProduct} onOpenChange={(open) => !open && setEditProduct(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update product details and pricing.</DialogDescription>
          </DialogHeader>
          {editProduct && (
            <ProductForm
              product={editProduct}
              onSubmit={(data) => updateMutation.mutate({ id: editProduct._id, data })}
              onCancel={() => setEditProduct(null)}
              isLoading={updateMutation.isPending}
              error={formError}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteProduct} onOpenChange={(open) => !open && setDeleteProduct(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Product
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteProduct?.name}</strong>? This action
              cannot be undone and may affect existing quotations.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeleteProduct(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate(deleteProduct._id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Product'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
