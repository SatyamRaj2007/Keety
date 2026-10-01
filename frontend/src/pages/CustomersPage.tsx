import { useEffect, useState, type FormEvent } from 'react'
import { Check, ChevronLeft, ChevronRight, Edit3, Mail, Phone, Plus, Search, UserRound, UserSquare2 } from 'lucide-react'
import { ApiError } from '../api/client'
import { customersApi, type CustomerInput } from '../api/customers.api'
import { Button, EmptyState, Field, FormActions, LoadingBlock, Modal, Notice, PageHeader, StatusBadge, TextareaField } from '../components/ui'
import { useAuth } from '../contexts/useAuth'
import type { Customer, Pagination } from '../types'

const emptyPagination: Pagination = { page: 1, limit: 20, total: 0, pages: 0 }

function CustomerForm({ customer, onSave, onCancel }: {
  customer: Customer | null
  onSave: (input: CustomerInput) => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState(customer?.name || '')
  const [email, setEmail] = useState(customer?.email || '')
  const [phone, setPhone] = useState(customer?.phone || '')
  const [externalId, setExternalId] = useState(customer?.externalId || '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      await onSave({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        externalId: externalId.trim(),
      })
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'We could not save this customer.')
    } finally {
      setSaving(false)
    }
  }

  return <form className="stack-form" onSubmit={submit}>
    {error && <Notice tone="error">{error}</Notice>}
    <Field label="Customer name" name="customerName" required maxLength={160} value={name} onChange={(event) => setName(event.target.value)} />
    <div className="form-grid-two">
      <Field label="Email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      <Field label="Phone" name="phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
    </div>
    <TextareaField label="External ID / account number" name="externalId" rows={2} value={externalId} onChange={(event) => setExternalId(event.target.value)} />
    <FormActions>
      <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      <Button type="submit" disabled={saving} icon={<Check size={16} />}>{saving ? 'Saving…' : customer ? 'Save changes' : 'Add customer'}</Button>
    </FormActions>
  </form>
}

export function CustomersPage() {
  const { activeBusiness } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [pagination, setPagination] = useState(emptyPagination)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      setLoading(true)
      setError('')
      customersApi.list({ page, limit: 20, search })
        .then((result) => {
          if (active) {
            setCustomers(result.customers)
            setPagination(result.pagination)
          }
        })
        .catch((cause) => {
          if (active) setError(cause instanceof ApiError ? cause.message : 'We could not load customers.')
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    }, 180)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [activeBusiness?._id, page, search])

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (customer: Customer) => {
    setEditing(customer)
    setModalOpen(true)
  }

  const save = async (input: CustomerInput) => {
    if (editing) await customersApi.update(editing._id, input)
    else await customersApi.create(input)
    setModalOpen(false)
    setToast(editing ? 'Customer updated.' : 'Customer added.')
    setPage(1)
    const result = await customersApi.list({ page: 1, limit: 20, search })
    setCustomers(result.customers)
    setPagination(result.pagination)
  }

  const remove = async (customer: Customer) => {
    setError('')
    try {
      await customersApi.remove(customer._id)
      setCustomers((current) => current.filter((item) => item._id !== customer._id))
      setToast('Customer removed.')
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'We could not delete this customer.')
    }
  }

  return <div className="page-content">
    <PageHeader
      eyebrow="CUSTOMERS"
      title="Customer records"
      description="Track the people behind your sales and keep repeat business context close at hand."
      action={<Button onClick={openCreate} icon={<Plus size={17} />}>Add customer</Button>}
    />
    {error && <Notice tone="error">{error}</Notice>}

    <section className="data-toolbar" aria-label="Customer search">
      <label className="search-field">
        <Search size={17} />
        <input aria-label="Search customers" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search name, email, phone or ID…" />
      </label>
      <span className="toolbar-count">{pagination.total} {pagination.total === 1 ? 'customer' : 'customers'}</span>
    </section>

    <div className="table-panel">
      {loading ? <div className="table-loading"><LoadingBlock rows={6} /></div> : customers.length ? (
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Spend</th>
                <th>Status</th>
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer._id}>
                  <td>
                    <div className="table-product">
                      <span className="product-swatch"><UserRound size={17} /></span>
                      <span>
                        <strong>{customer.name}</strong>
                        <small>{customer.externalId || 'No external ID'}</small>
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="table-secondary"><Mail size={14} /> {customer.email || 'No email'}</span>
                    <small className="table-cell-sub"><Phone size={14} /> {customer.phone || 'No phone'}</small>
                  </td>
                  <td className="table-number">{customer.totalSpent ? `₹${customer.totalSpent.toLocaleString()}` : '₹0'}</td>
                  <td>
                    <StatusBadge tone={customer.totalOrders > 0 ? 'success' : 'neutral'}>
                      {customer.totalOrders > 0 ? `${customer.totalOrders} order${customer.totalOrders === 1 ? '' : 's'}` : 'New'}
                    </StatusBadge>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-button" title="Edit customer" aria-label={`Edit ${customer.name}`} onClick={() => openEdit(customer)}><Edit3 size={16} /></button>
                      <button className="icon-button" title="Delete customer" aria-label={`Delete ${customer.name}`} onClick={() => void remove(customer)}><UserSquare2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={<UserRound size={22} />}
          title={search ? 'No customers match that search.' : 'Add your first customer.'}
          detail={search ? 'Try a different name or clear the search.' : 'Capture customer details so repeat purchases and history stay connected to the business.'}
          action={!search ? <Button onClick={openCreate} icon={<Plus size={16} />}>Add customer</Button> : undefined}
        />
      )}

      {!loading && customers.length > 0 && (
        <div className="pagination-bar">
          <span>Page {pagination.page} of {Math.max(pagination.pages, 1)}</span>
          <div>
            <button className="icon-button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} aria-label="Previous page"><ChevronLeft size={18} /></button>
            <button className="icon-button" disabled={page >= pagination.pages} onClick={() => setPage((value) => value + 1)} aria-label="Next page"><ChevronRight size={18} /></button>
          </div>
        </div>
      )}
    </div>

    <Modal open={modalOpen} title={editing ? 'Edit customer' : 'Add a customer'} description="Customer data is scoped to the active business." onClose={() => setModalOpen(false)} size="large">
      <CustomerForm key={editing?._id || 'new'} customer={editing} onSave={save} onCancel={() => setModalOpen(false)} />
    </Modal>

    {toast && <div className="toast" role="status"><Check size={16} />{toast}<button onClick={() => setToast('')} aria-label="Dismiss"><span className="sr-only">Dismiss</span>×</button></div>}
  </div>
}
