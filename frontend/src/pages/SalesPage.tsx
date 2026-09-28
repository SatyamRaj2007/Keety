import { useEffect, useState, type FormEvent } from 'react'
import { Check, ChevronLeft, ChevronRight, Eye, Plus, ReceiptText, Trash2 } from 'lucide-react'
import { ApiError } from '../api/client'
import { productsApi } from '../api/products.api'
import { salesApi, type SaleInput } from '../api/sales.api'
import { Button, Currency, EmptyState, Field, FormActions, LoadingBlock, Modal, Notice, PageHeader, SelectField, StatusBadge } from '../components/ui'
import { useAuth } from '../contexts/useAuth'
import type { Pagination, Product, Sale } from '../types'

const blankPagination: Pagination = { page: 1, limit: 20, total: 0, pages: 0 }

function SaleForm({ products, currency, onSave, onCancel }: {
  products: Product[]
  currency: string
  onSave: (input: SaleInput) => Promise<void>
  onCancel: () => void
}) {
  const [items, setItems] = useState<Array<{ productId: string; quantity: string }>>(
    products[0] ? [{ productId: products[0]._id, quantity: '1' }] : [],
  )
  const [discount, setDiscount] = useState('0')
  const [tax, setTax] = useState('0')
  const [paymentMethod, setPaymentMethod] = useState<Sale['paymentMethod']>('CASH')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const subtotal = items.reduce((sum, line) => {
    const product = products.find((item) => item._id === line.productId)
    return sum + (product?.price || 0) * Math.max(Number(line.quantity) || 0, 0)
  }, 0)
  const total = subtotal - Math.max(Number(discount) || 0, 0) + Math.max(Number(tax) || 0, 0)

  const addItem = () => {
    const selectedIds = new Set(items.map((item) => item.productId))
    const nextProduct = products.find((item) => !selectedIds.has(item._id))
    if (nextProduct) setItems((current) => [...current, { productId: nextProduct._id, quantity: '1' }])
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!items.length || items.some((item) => !item.productId || Number(item.quantity) < 1)) return setError('Choose a product and quantity for each sale item.')
    setError('')
    setSaving(true)
    try {
      await onSave({ items: items.map((item) => ({ productId: item.productId, quantity: Number(item.quantity) })), discount: Number(discount) || 0, tax: Number(tax) || 0, paymentMethod })
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'We could not record this sale.')
    } finally {
      setSaving(false)
    }
  }

  return <form className="stack-form" onSubmit={submit}>
    {error && <Notice tone="error">{error}</Notice>}
    <div className="sale-lines">
      {items.map((line, index) => {
        const availableProducts = products.filter((item) => item._id === line.productId || !items.some((other, otherIndex) => otherIndex !== index && other.productId === item._id))
        return <div className="sale-line-row" key={index}>
          <SelectField label={`Product ${index + 1}`} name={`saleProduct-${index}`} required value={line.productId} onChange={(event) => setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, productId: event.target.value } : item))}>
            {availableProducts.map((item) => <option key={item._id} value={item._id}>{item.name} · {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(item.price)}</option>)}
          </SelectField>
          <Field label="Qty" name={`saleQuantity-${index}`} type="number" min="1" step="1" required value={line.quantity} onChange={(event) => setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: event.target.value } : item))} />
          <button type="button" className="icon-button sale-remove-line" disabled={items.length <= 1} onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove product ${index + 1}`} title="Remove item"><Trash2 size={16} /></button>
        </div>
      })}
      {items.length < products.length && <button type="button" className="text-button sale-add-line" onClick={addItem}><Plus size={15} /> Add another product</button>}
    </div>
    <div className="form-grid-two"><Field label={`Discount (${currency})`} name="saleDiscount" type="number" min="0" step="0.01" max={subtotal} value={discount} onChange={(event) => setDiscount(event.target.value)} /><Field label={`Tax (${currency})`} name="saleTax" type="number" min="0" step="0.01" value={tax} onChange={(event) => setTax(event.target.value)} /></div>
    <SelectField label="Payment method" name="paymentMethod" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as Sale['paymentMethod'])}>
      <option value="CASH">Cash</option><option value="CARD">Card</option><option value="UPI">UPI</option><option value="ONLINE">Online</option><option value="OTHER">Other</option>
    </SelectField>
    <div className="sale-total-preview"><span><small>Subtotal</small><strong><Currency amount={subtotal} code={currency} /></strong></span><span><small>Total preview</small><strong><Currency amount={total} code={currency} /></strong></span><p>The backend confirms the final total using the saved product price.</p></div>
    <FormActions><Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={saving || !products.length} icon={<Check size={16} />}>{saving ? 'Recording…' : 'Complete sale'}</Button></FormActions>
  </form>
}

export function SalesPage() {
  const { activeBusiness } = useAuth()
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<{
    key: string
    status: 'success' | 'error'
    sales?: Sale[]
    products?: Product[]
    pagination?: Pagination
    error?: string
  } | null>(null)
  const requestKey = `${activeBusiness?._id || ''}:${page}`
  const requestIsCurrent = result?.key === requestKey
  const loading = !requestIsCurrent
  const sales = requestIsCurrent && result?.status === 'success' ? result.sales || [] : []
  const products = requestIsCurrent && result?.status === 'success' ? result.products || [] : []
  const pagination = requestIsCurrent && result?.status === 'success' ? result.pagination || blankPagination : blankPagination
  const error = requestIsCurrent && result?.status === 'error' ? result.error || '' : ''
  const [saleModal, setSaleModal] = useState(false)
  const [detailModal, setDetailModal] = useState(false)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    let active = true
    const key = requestKey
    if (!activeBusiness?._id) return () => { active = false }
    Promise.all([salesApi.list(page, 20), productsApi.list({ page: 1, limit: 100, status: 'ACTIVE' })])
      .then(([saleResult, productResult]) => {
        if (!active) return
        setResult({ key, status: 'success', sales: saleResult.sales, pagination: saleResult.pagination, products: productResult.products })
      })
      .catch((cause) => { if (active) setResult({ key, status: 'error', error: cause instanceof ApiError ? cause.message : 'We could not load sales.' }) })
    return () => { active = false }
  }, [activeBusiness?._id, page, requestKey])

  const recordSale = async (input: SaleInput) => {
    await salesApi.create(input)
    setSaleModal(false)
    setToast('Sale recorded. Your inventory and analytics have been refreshed.')
    const [saleResult, productResult] = await Promise.all([salesApi.list(page, 20), productsApi.list({ page: 1, limit: 100, status: 'ACTIVE' })])
    setResult({ key: requestKey, status: 'success', sales: saleResult.sales, pagination: saleResult.pagination, products: productResult.products })
  }

  const showSale = async (sale: Sale) => {
    setSelectedSale(sale)
    setDetailModal(true)
    setDetailLoading(true)
    setDetailError('')
    try { setSelectedSale(await salesApi.get(sale._id)) }
    catch (cause) { setDetailError(cause instanceof ApiError ? cause.message : 'We could not load sale details.') }
    finally { setDetailLoading(false) }
  }

  return <div className="page-content">
    <PageHeader eyebrow="TRANSACTIONS" title="Sales" description="Record a sale or review what your business has sold." action={<Button onClick={() => setSaleModal(true)} disabled={!products.length} icon={<Plus size={17} />}>Record sale</Button>} />
    {!products.length && !loading && <Notice tone="info">Add an active product before recording a sale. <a href="/app/products">Open products</a></Notice>}
    {error && <Notice tone="error">{error}</Notice>}
    <div className="table-panel sales-table-panel">
      {loading ? <div className="table-loading"><LoadingBlock rows={5} /></div> : sales.length ? <div className="responsive-table"><table>
        <thead><tr><th>Sale</th><th>Items</th><th>Payment</th><th>Total</th><th>Status</th><th><span className="sr-only">Details</span></th></tr></thead>
        <tbody>{sales.map((sale) => <tr key={sale._id}>
          <td><div className="sale-reference"><span className="receipt-glyph"><ReceiptText size={16} /></span><span><strong>#{sale._id.slice(-6).toUpperCase()}</strong><small>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZone: activeBusiness?.timezone || 'UTC' }).format(new Date(sale.soldAt))}</small></span></div></td>
          <td>{sale.items.reduce((sum, item) => sum + item.quantity, 0)} items</td><td><span className="table-secondary">{sale.paymentMethod}</span></td>
          <td className="table-number"><Currency amount={sale.totalAmount} code={activeBusiness?.currency} /></td>
          <td><StatusBadge tone={sale.status === 'COMPLETED' ? 'success' : sale.status === 'REFUNDED' ? 'warning' : 'neutral'}>{sale.status.toLowerCase()}</StatusBadge></td>
          <td><button className="icon-button" onClick={() => void showSale(sale)} aria-label={`View sale ${sale._id.slice(-6)}`} title="View sale"><Eye size={16} /></button></td>
        </tr>)}</tbody>
      </table></div> : <EmptyState icon={<ReceiptText size={22} />} title="No sales recorded yet." detail="Once you record a sale, it will appear here with the price and item details confirmed by KEETY." action={<Button onClick={() => setSaleModal(true)} disabled={!products.length} icon={<Plus size={16} />}>Record sale</Button>} />}
      {!loading && sales.length > 0 && <div className="pagination-bar"><span>{pagination.total} total sales · Page {pagination.page} of {Math.max(pagination.pages, 1)}</span><div><button className="icon-button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} aria-label="Previous page"><ChevronLeft size={18} /></button><button className="icon-button" disabled={page >= pagination.pages} onClick={() => setPage((value) => value + 1)} aria-label="Next page"><ChevronRight size={18} /></button></div></div>}
    </div>
    <Modal open={saleModal} title="Record a sale" description="The backend calculates the total using current product prices." onClose={() => setSaleModal(false)}>
      {products.length ? <SaleForm products={products} currency={activeBusiness?.currency || 'INR'} onSave={recordSale} onCancel={() => setSaleModal(false)} /> : <Notice tone="info">Add an active product before recording a sale.</Notice>}
    </Modal>
    <Modal open={detailModal} title={selectedSale ? `Sale #${selectedSale._id.slice(-6).toUpperCase()}` : 'Sale details'} description="Historical item prices are preserved with each sale." onClose={() => setDetailModal(false)}>
      {detailError && <Notice tone="error">{detailError}</Notice>}
      {detailLoading ? <LoadingBlock rows={3} /> : selectedSale && <div className="sale-detail">
        {selectedSale.items.map((item) => <div className="sale-detail-item" key={item.productId}><span><strong>{item.productName}</strong><small>{item.quantity} × <Currency amount={item.unitPrice} code={activeBusiness?.currency} /></small></span><strong><Currency amount={item.total} code={activeBusiness?.currency} /></strong></div>)}
        <div className="sale-detail-totals"><span>Subtotal <strong><Currency amount={selectedSale.subtotal} code={activeBusiness?.currency} /></strong></span><span>Discount <strong><Currency amount={selectedSale.discount} code={activeBusiness?.currency} /></strong></span><span>Tax <strong><Currency amount={selectedSale.tax} code={activeBusiness?.currency} /></strong></span><span className="sale-detail-grand">Total <strong><Currency amount={selectedSale.totalAmount} code={activeBusiness?.currency} /></strong></span></div>
      </div>}
    </Modal>
    {toast && <div className="toast" role="status"><Check size={16} />{toast}<button onClick={() => setToast('')} aria-label="Dismiss">×</button></div>}
  </div>
}