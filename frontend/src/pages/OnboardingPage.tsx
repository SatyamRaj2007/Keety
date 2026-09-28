import { useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Check, Package, ReceiptText, Store } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { productsApi } from '../api/products.api'
import { salesApi } from '../api/sales.api'
import { Button, Field, Notice, SelectField } from '../components/ui'
import { useAuth } from '../contexts/useAuth'
import type { BusinessType, Product } from '../types'

const businessKinds: Array<{ value: BusinessType; label: string }> = [
  { value: 'CLOTHING', label: 'Clothing & apparel' }, { value: 'RESTAURANT', label: 'Restaurant or cafe' },
  { value: 'SALON', label: 'Salon or personal care' }, { value: 'GROCERY_RETAIL', label: 'Grocery & retail' },
  { value: 'ELECTRONICS', label: 'Electronics' }, { value: 'OTHER', label: 'Something else' },
]

const steps = [
  { title: 'Your business', icon: Store }, { title: 'First product', icon: Package }, { title: 'First sale', icon: ReceiptText },
]

export function OnboardingPage() {
  const { user, createBusiness } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState<BusinessType>('CLOTHING')
  const [currency, setCurrency] = useState('INR')
  const [timezone, setTimezone] = useState('Asia/Kolkata')
  const [productName, setProductName] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState('1')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const complete = () => navigate('/app/dashboard', { replace: true })

  const submitBusiness = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await createBusiness({ name: businessName.trim(), businessType, currency, timezone })
      setStep(1)
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'We could not create your business. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const submitProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const created = await productsApi.create({ name: productName.trim(), price: Number(productPrice), status: 'ACTIVE' })
      setProduct(created)
      setStep(2)
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'We could not add that product. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const submitSale = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!product) return complete()
    setSubmitting(true)
    setError('')
    try {
      await salesApi.create({ items: [{ productId: product._id, quantity: Number(quantity) }], paymentMethod: 'OTHER' })
      complete()
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'We could not record that sale. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return <main className="onboarding-page">
    <header className="onboarding-top"><span className="brand-lockup"><span className="brand-mark"><Store size={17} /></span><span className="brand-name">keety</span></span><span>SET UP YOUR WORKSPACE</span></header>
    <div className="onboarding-layout">
      <aside className="onboarding-aside">
        <p className="eyebrow">A good place to begin</p>
        <h1>Let’s get to know<br /><em>your business.</em></h1>
        <p>Just the essentials to make your first business view useful. You can update these details any time.</p>
        <div className="onboarding-progress">
          {steps.map(({ title, icon: Icon }, index) => <div key={title} className={`onboarding-step ${step === index ? 'step-current' : ''} ${step > index ? 'step-done' : ''}`}>
            <span className="step-icon">{step > index ? <Check size={16} /> : <Icon size={16} />}</span><span>{title}</span><span className="step-number">0{index + 1}</span>
          </div>)}
        </div>
        <div className="onboarding-aside-note"><span className="note-index">A note from KEETY</span><p>We’ll use this to put your products, sales, and business metrics in the right context.</p></div>
      </aside>
      <section className="onboarding-form-panel">
        {error && <Notice tone="error">{error}</Notice>}
        {step === 0 && <form className="onboarding-form" onSubmit={submitBusiness}>
          <div><p className="eyebrow">01 · BUSINESS PROFILE</p><h2>What do you call your business?</h2><p className="form-intro">Your business type helps KEETY use the language and context that fit your work.</p></div>
          <Field label="Business name" name="businessName" autoComplete="organization" maxLength={120} required value={businessName} onChange={(event) => setBusinessName(event.target.value)} placeholder="e.g. Cedar & Thread" />
          <SelectField label="Business type" name="businessType" value={businessType} onChange={(event) => setBusinessType(event.target.value as BusinessType)}>
            {businessKinds.map((kind) => <option key={kind.value} value={kind.value}>{kind.label}</option>)}
          </SelectField>
          <div className="form-grid-two">
            <SelectField label="Currency" name="currency" value={currency} onChange={(event) => setCurrency(event.target.value)}>
              <option value="INR">INR · Indian Rupee</option><option value="USD">USD · US Dollar</option><option value="EUR">EUR · Euro</option><option value="GBP">GBP · Pound Sterling</option><option value="CAD">CAD · Canadian Dollar</option><option value="AUD">AUD · Australian Dollar</option>
            </SelectField>
            <Field label="Timezone" name="timezone" value={timezone} maxLength={100} required onChange={(event) => setTimezone(event.target.value)} hint="For example, Asia/Kolkata" />
          </div>
          <Button type="submit" disabled={submitting} icon={<ArrowRight size={17} />}>{submitting ? 'Creating your business…' : 'Continue'}</Button>
        </form>}

        {step === 1 && <form className="onboarding-form" onSubmit={submitProduct}>
          <div><p className="eyebrow">02 · YOUR CATALOG</p><h2>Add one product to begin.</h2><p className="form-intro">KEETY uses product and sales data to make performance easier to understand. Add one now, or skip this step.</p></div>
          <Field label="Product or item name" name="productName" required maxLength={160} value={productName} onChange={(event) => setProductName(event.target.value)} placeholder="e.g. Everyday tote" />
          <Field label={`Price (${currency})`} name="productPrice" type="number" min="0" step="0.01" required value={productPrice} onChange={(event) => setProductPrice(event.target.value)} />
          <div className="step-footer"><button type="button" className="text-button" onClick={() => setStep(2)}>I’ll do this later <ArrowRight size={15} /></button><Button type="submit" disabled={submitting} icon={<ArrowRight size={17} />}>{submitting ? 'Adding product…' : 'Add product'}</Button></div>
        </form>}

        {step === 2 && <form className="onboarding-form" onSubmit={submitSale}>
          <div><p className="eyebrow">03 · FIRST TRANSACTION</p><h2>Record a first sale.</h2><p className="form-intro">A real sale gives your overview its first useful signal. KEETY confirms totals and saves the sale for you.</p></div>
          {product ? <>
            <div className="onboarding-product-summary"><span className="product-swatch"><Package size={18} /></span><span><strong>{product.name}</strong><small>{new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(product.price)} per {product.unit}</small></span></div>
            <Field label="Quantity sold" name="quantity" type="number" min="1" step="1" required value={quantity} onChange={(event) => setQuantity(event.target.value)} />
            <div className="step-footer"><button type="button" className="text-button" onClick={complete}>I’ll do this later <ArrowRight size={15} /></button><Button type="submit" disabled={submitting} icon={<Check size={17} />}>{submitting ? 'Recording sale…' : 'Record sale & finish'}</Button></div>
          </> : <><Notice tone="info">Add a product later from your workspace before recording a sale.</Notice><div className="step-footer"><button type="button" className="text-button" onClick={() => setStep(1)}><ArrowLeft size={15} /> Back to product</button><Button type="button" onClick={complete}>Go to overview <ArrowRight size={17} /></Button></div></>}
        </form>}
        <p className="onboarding-signed-in">Setting up as <strong>{user?.name}</strong></p>
      </section>
    </div>
  </main>
}