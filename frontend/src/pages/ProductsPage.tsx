import { useEffect, useState, type FormEvent } from 'react'
import { Check, ChevronLeft, ChevronRight, Edit3, Package, Plus, Search, ToggleLeft, ToggleRight } from 'lucide-react'
import { ApiError } from '../api/client'
import { productsApi, type ProductInput } from '../api/products.api'
import { Button, Currency, EmptyState, Field, FormActions, LoadingBlock, Modal, Notice, PageHeader, StatusBadge, TextareaField } from '../components/ui'
import { useAuth } from '../contexts/useAuth'
import type { Pagination, Product } from '../types'

const emptyPagination: Pagination = { page: 1, limit: 20, total: 0, pages: 0 }

function ProductForm({ product, currency, onSave, onCancel }: {
  product: Product | null
  currency: string
  onSave: (input: ProductInput) => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState(product?.name || '')
  const [sku, setSku] = useState(product?.sku || '')
  const [category, setCategory] = useState(product?.category || '')
  const [description, setDescription] = useState(product?.description || '')
  const [price, setPrice] = useState(product?.price === undefined ? '' : String(product.price))
  const [costPrice, setCostPrice] = useState(product?.costPrice ? String(product.costPrice) : '')
  const [unit, setUnit] = useState(product?.unit || 'unit')
  const [metadata, setMetadata] = useState(JSON.stringify(product?.metadata || {}, null, 2))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    let parsedMetadata: Record<string, unknown> = {}
    try {
      parsedMetadata = JSON.parse(metadata || '{}') as Record<string, unknown>
      if (!parsedMetadata || Array.isArray(parsedMetadata) || typeof parsedMetadata !== 'object') throw new Error('Metadata must be a JSON object.')
    } catch {
      setError('Metadata must be a valid JSON object, for example { "color": "Black" }.')
      return
    }

    setSaving(true)
    try {
      await onSave({
        name: name.trim(), sku: sku.trim(), category: category.trim(), description: description.trim(),
        price: Number(price), costPrice: costPrice === '' ? 0 : Number(costPrice), unit: unit.trim() || 'unit', metadata: parsedMetadata,
      })
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'We could not save this product.')
    } finally {
      setSaving(false)
    }
  }

  return <form className="stack-form" onSubmit={submit}>
    {error && <Notice tone="error">{error}</Notice>}
    <Field label="Product name" name="productName" required maxLength={160} value={name} onChange={(event) => setName(event.target.value)} />
    <div className="form-grid-two"><Field label="SKU" name="sku" maxLength={80} value={sku} onChange={(event) => setSku(event.target.value)} /><Field label="Category" name="category" maxLength={100} value={category} onChange={(event) => setCategory(event.target.value)} /></div>
    <TextareaField label="Description" name="description" rows={2} maxLength={1000} value={description} onChange={(event) => setDescription(event.target.value)} />
    <div className="form-grid-two"><Field label={`Price (${currency})`} name="price" type="number" min="0" step="0.01" required value={price} onChange={(event) => setPrice(event.target.value)} /><Field label={`Cost price (${currency})`} name="costPrice" type="number" min="0" step="0.01" value={costPrice} onChange={(event) => setCostPrice(event.target.value)} /></div>
    <Field label="Unit" name="unit" maxLength={40} value={unit} onChange={(event) => setUnit(event.target.value)} hint="For example, piece, plate, service" />
    <TextareaField label="Business-specific details (JSON)" name="metadata" rows={3} value={metadata} onChange={(event) => setMetadata(event.target.value)} />
    <FormActions><Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={saving} icon={<Check size={16} />}>{saving ? 'Saving…' : product ? 'Save changes' : 'Add product'}</Button></FormActions>
  </form>
}

export function ProductsPage() {
  const { activeBusiness } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [pagination, setPagination] = useState(emptyPagination)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      setLoading(true)
      setError('')
      productsApi.list({ page, limit: 20, search, status: status ? status as Product['status'] : undefined })
        .then((result) => {
          if (active) { setProducts(result.products); setPagination(result.pagination) }
        })
        .catch((cause) => { if (active) setError(cause instanceof ApiError ? cause.message : 'We could not load products.') })
        .finally(() => { if (active) setLoading(false) })
    }, 220)
    return () => { active = false; window.clearTimeout(timer) }
  }, [activeBusiness?._id, page, search, status])

  const openCreate = () => { setEditing(null); setModalOpen(true) }
  const openEdit = (product: Product) => { setEditing(product); setModalOpen(true) }
  const save = async (input: ProductInput) => {
    if (editing) await productsApi.update(editing._id, input)
    else await productsApi.create(input)
    setModalOpen(false)
    setToast(editing ? 'Product details saved.' : 'Product added to your catalog.')
    setPage(1)
    const result = await productsApi.list({ page: 1, limit: 20, search, status: status ? status as Product['status'] : undefined })
    setProducts(result.products)
    setPagination(result.pagination)
  }

  const toggleStatus = async (product: Product) => {
    setError('')
    try {
      const updated = await productsApi.update(product._id, { status: product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })
      setProducts((current) => current.map((item) => item._id === updated._id ? updated : item))
      setToast(updated.status === 'ACTIVE' ? 'Product activated.' : 'Product deactivated.')
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'We could not update this product.')
    }
  }

  return <div className="page-content">
    <PageHeader eyebrow="CATALOG" title="Products" description="Keep your catalog current. KEETY uses it to understand what’s performing." action={<Button onClick={openCreate} icon={<Plus size={17} />}>Add product</Button>} />
    {error && <Notice tone="error">{error}</Notice>}
    <section className="data-toolbar" aria-label="Product filters">
      <label className="search-field"><Search size={17} /><input aria-label="Search products" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search products…" /></label>
      <label className="filter-select"><span className="sr-only">Filter by status</span><select aria-label="Filter by status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}><option value="">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
      <span className="toolbar-count">{pagination.total} {pagination.total === 1 ? 'product' : 'products'}</span>
    </section>
    <div className="table-panel">
      {loading ? <div className="table-loading"><LoadingBlock rows={6} /></div> : products.length ? <div className="responsive-table"><table>
        <thead><tr><th>Product</th><th>SKU / Category</th><th>Price</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
        <tbody>{products.map((product) => <tr key={product._id}>
          <td><div className="table-product"><span className="product-swatch"><Package size={17} /></span><span><strong>{product.name}</strong><small>{product.description || `${product.unit || 'unit'} · ${product.metadata && Object.keys(product.metadata).length ? `${Object.keys(product.metadata).length} details` : 'Standard item'}`}</small></span></div></td>
          <td><span className="table-secondary">{product.sku || '—'}</span><small className="table-cell-sub">{product.category || 'Uncategorized'}</small></td>
          <td className="table-number"><Currency amount={product.price} code={activeBusiness?.currency} /></td>
          <td><StatusBadge tone={product.status === 'ACTIVE' ? 'success' : 'neutral'}>{product.status === 'ACTIVE' ? 'Active' : 'Inactive'}</StatusBadge></td>
          <td><div className="row-actions"><button className="icon-button" title="Edit product" aria-label={`Edit ${product.name}`} onClick={() => openEdit(product)}><Edit3 size={16} /></button><button className="icon-button" title={product.status === 'ACTIVE' ? 'Deactivate product' : 'Activate product'} aria-label={product.status === 'ACTIVE' ? `Deactivate ${product.name}` : `Activate ${product.name}`} onClick={() => void toggleStatus(product)}>{product.status === 'ACTIVE' ? <ToggleRight size={19} /> : <ToggleLeft size={19} />}</button></div></td>
        </tr>)}</tbody>
      </table></div> : <EmptyState icon={<Package size={22} />} title={search ? 'No products match that search.' : 'Your catalog is ready for its first product.'} detail={search ? 'Try a different name or clear your filters.' : 'Add a product so KEETY can start understanding your business.'} action={!search && <Button onClick={openCreate} icon={<Plus size={16} />}>Add product</Button>} />}
      {!loading && products.length > 0 && <div className="pagination-bar"><span>Page {pagination.page} of {Math.max(pagination.pages, 1)}</span><div><button className="icon-button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} aria-label="Previous page"><ChevronLeft size={18} /></button><button className="icon-button" disabled={page >= pagination.pages} onClick={() => setPage((value) => value + 1)} aria-label="Next page"><ChevronRight size={18} /></button></div></div>}
    </div>
    <Modal open={modalOpen} title={editing ? 'Edit product' : 'Add a product'} description="Product details are scoped to the active business." onClose={() => setModalOpen(false)} size="large">
      <ProductForm key={editing?._id || 'new'} product={editing} currency={activeBusiness?.currency || 'INR'} onSave={save} onCancel={() => setModalOpen(false)} />
    </Modal>
    {toast && <div className="toast" role="status"><Check size={16} />{toast}<button onClick={() => setToast('')} aria-label="Dismiss"><span className="sr-only">Dismiss</span>×</button></div>}
  </div>
}