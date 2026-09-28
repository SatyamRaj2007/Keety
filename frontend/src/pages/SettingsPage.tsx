import { useState, type FormEvent } from 'react'
import { Check, Settings2, ShieldCheck, UserRound } from 'lucide-react'
import { ApiError } from '../api/client'
import { Button, Field, Notice, PageHeader, Panel, SelectField, TextareaField } from '../components/ui'
import { useAuth } from '../contexts/useAuth'
import type { BusinessType } from '../types'

const businessTypes: Array<{ value: BusinessType; label: string }> = [
  { value: 'CLOTHING', label: 'Clothing & apparel' }, { value: 'RESTAURANT', label: 'Restaurant or cafe' },
  { value: 'SALON', label: 'Salon or personal care' }, { value: 'GROCERY_RETAIL', label: 'Grocery & retail' },
  { value: 'ELECTRONICS', label: 'Electronics' }, { value: 'OTHER', label: 'Other' },
]

export function SettingsPage() {
  const { activeBusinessId } = useAuth()
  return <SettingsForm key={activeBusinessId} />
}

function SettingsForm() {
  const { activeBusiness, user, updateBusiness } = useAuth()
  const [name, setName] = useState(activeBusiness?.name || '')
  const [businessType, setBusinessType] = useState<BusinessType>(activeBusiness?.businessType || 'OTHER')
  const [description, setDescription] = useState(activeBusiness?.description || '')
  const [currency, setCurrency] = useState(activeBusiness?.currency || 'INR')
  const [timezone, setTimezone] = useState(activeBusiness?.timezone || 'UTC')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)
    try {
      await updateBusiness({ name: name.trim(), businessType, description: description.trim(), currency, timezone })
      setSuccess(true)
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'We could not save your business settings.')
    } finally {
      setLoading(false)
    }
  }

  return <div className="page-content settings-page">
    <PageHeader eyebrow="YOUR WORKSPACE" title="Settings" description="Keep your business profile accurate so KEETY can use the right context." />
    {error && <Notice tone="error">{error}</Notice>}
    {success && <Notice tone="success">Business settings saved.</Notice>}
    <div className="settings-layout">
      <Panel className="settings-form-panel">
        <div className="settings-section-heading"><span className="settings-icon"><Settings2 size={18} /></span><div><h2>Business profile</h2><p>These details inform your business context and currency formatting.</p></div></div>
        <form className="stack-form" onSubmit={submit}>
          <Field label="Business name" name="settingsBusinessName" maxLength={120} required value={name} onChange={(event) => setName(event.target.value)} />
          <SelectField label="Business type" name="settingsBusinessType" value={businessType} onChange={(event) => setBusinessType(event.target.value as BusinessType)}>{businessTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</SelectField>
          <TextareaField label="Description" name="settingsDescription" rows={3} maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} />
          <div className="form-grid-two"><SelectField label="Currency" name="settingsCurrency" value={currency} onChange={(event) => setCurrency(event.target.value)}><option value="INR">INR · Indian Rupee</option><option value="USD">USD · US Dollar</option><option value="EUR">EUR · Euro</option><option value="GBP">GBP · Pound Sterling</option><option value="CAD">CAD · Canadian Dollar</option><option value="AUD">AUD · Australian Dollar</option></SelectField><Field label="Timezone" name="settingsTimezone" maxLength={100} required value={timezone} onChange={(event) => setTimezone(event.target.value)} /></div>
          <div className="settings-save-row"><span>Changes apply to this business only.</span><Button type="submit" disabled={loading} icon={<Check size={16} />}>{loading ? 'Saving…' : 'Save changes'}</Button></div>
        </form>
      </Panel>
      <div className="settings-side-column">
        <Panel className="account-panel"><div className="settings-section-heading"><span className="settings-icon settings-icon-peach"><UserRound size={18} /></span><div><h2>Account</h2><p>Your KEETY sign-in identity.</p></div></div><div className="account-detail"><small>NAME</small><strong>{user?.name}</strong></div><div className="account-detail"><small>EMAIL</small><strong>{user?.email}</strong></div><div className="account-detail"><small>ROLE</small><strong>{user?.role}</strong></div></Panel>
        <Panel className="privacy-panel"><ShieldCheck size={19} /><div><strong>Your business, your data.</strong><p>KEETY sends business context to its server-side AI service only when you ask for an answer or strategy. API keys stay on the server.</p></div></Panel>
      </div>
    </div>
  </div>
}