export type BusinessType = 'CLOTHING' | 'RESTAURANT' | 'SALON' | 'GROCERY_RETAIL' | 'ELECTRONICS' | 'OTHER'

export interface User {
  id: string
  name: string
  email: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  businessIds: string[]
  createdAt: string
}

export interface Business {
  _id: string
  ownerId: string
  name: string
  businessType: BusinessType
  description: string
  location: { address: string; city: string; state: string; country: string }
  currency: string
  timezone: string
  logoUrl: string
  settings: { lowStockThreshold: number; aiEnabled: boolean; notificationsEnabled: boolean }
}

export interface Product {
  _id: string
  businessId: string
  name: string
  sku: string
  category: string
  description: string
  price: number
  costPrice: number
  unit: string
  status: 'ACTIVE' | 'INACTIVE'
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface SaleItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Sale {
  _id: string
  businessId: string
  customerId: string | null
  items: SaleItem[]
  subtotal: number
  discount: number
  tax: number
  totalAmount: number
  paymentMethod: 'CASH' | 'CARD' | 'UPI' | 'ONLINE' | 'OTHER'
  status: 'COMPLETED' | 'CANCELLED' | 'REFUNDED'
  soldAt: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export interface Analytics {
  period: { startDate: string; endDate: string }
  revenue: number
  salesCount: number
  averageOrderValue: number
  growthPercent: number
  topProducts: Array<{ _id: string; name: string; revenue: number; quantitySold: number }>
  slowProducts: Array<{ _id: string; name: string; revenue: number; quantitySold: number }>
  lowStockProducts: Array<{ productId: string; name: string; quantity: number; reorderLevel: number }>
  expenseSummary: { total: number; byCategory: Record<string, number> }
  customerSummary: { newCustomers: number; growthPercent: number }
}

export interface AIResponse {
  answer: string
  insights: Array<{ title: string; description: string; metric?: string; value?: number }>
  recommendations: Array<{ title: string; description: string; priority: 'HIGH' | 'MEDIUM' | 'LOW' }>
}