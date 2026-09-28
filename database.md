# KEETY --- Database Architecture (MVP)

## 1. Purpose

This document defines the database design for **KEETY -- AI Business
Intelligence Platform**.

The database design follows the approved KEETY architecture:

``` text
Frontend
   ↓ REST API
Node.js + Express.js Backend
   ↓
AI Module / Analytics Module
   ↓
MongoDB Atlas
   ↓
Google Gemini API
```

### Approved technology

-   Database: **MongoDB Atlas**
-   Backend: **Node.js + Express.js**
-   Authentication: **JWT**
-   AI: **Google Gemini API**
-   Frontend: **React + TailwindCSS**
-   Storage: Cloud Storage is optional
-   Email/Notifications: Optional

> Important: The architecture diagram specifies **MongoDB Atlas**, so
> this database design does NOT use PostgreSQL or Prisma.

------------------------------------------------------------------------

# 2. Database Responsibilities

MongoDB Atlas is the primary persistent database for KEETY.

It stores:

-   Users
-   Businesses
-   Products
-   Sales
-   Customers
-   Expenses
-   Inventory
-   AI logs
-   Reports
-   Business configuration
-   AI-generated insights and recommendations where required

The database must support businesses of different types:

-   Clothing Store
-   Restaurant
-   Salon
-   Grocery / Retail
-   Electronics
-   Other Businesses

The core schema should remain generic enough to support all of them.

------------------------------------------------------------------------

# 3. High-Level MongoDB Structure

Recommended collections:

``` text
keety
│
├── users
├── businesses
├── products
├── sales
├── customers
├── expenses
├── inventory
├── ai_logs
└── reports
```

For the MVP, these are the main collections.

Additional collections should only be introduced when an actual backend
requirement needs them.

------------------------------------------------------------------------

# 4. Multi-Business / Tenant Model

KEETY supports multiple businesses.

A user can own or access one or more businesses.

Every business-related document must contain:

``` js
businessId
```

Example:

``` text
Business A
 ├── Products
 ├── Sales
 ├── Customers
 ├── Expenses
 ├── Inventory
 ├── Reports
 └── AI Logs

Business B
 ├── Products
 ├── Sales
 ├── Customers
 ├── Expenses
 ├── Inventory
 ├── Reports
 └── AI Logs
```

## Critical rule

Every backend query involving business data must be scoped to the
authenticated user's business.

Never allow:

``` text
GET /api/products
```

to return products from every business.

The backend must resolve the authenticated user's business and apply:

``` js
{ businessId: authenticatedBusinessId }
```

------------------------------------------------------------------------

# 5. Collection: users

## Purpose

Stores KEETY user accounts.

### Document

``` js
{
  _id: ObjectId,

  name: String,

  email: String,

  passwordHash: String,

  role: String,

  businessIds: [ObjectId],

  isActive: Boolean,

  lastLoginAt: Date,

  createdAt: Date,

  updatedAt: Date
}
```

## Role

For MVP:

``` text
OWNER
ADMIN
MEMBER
```

The primary MVP user can simply be the business owner.

## Indexes

``` text
email: unique
```

Recommended:

``` js
{
  email: 1
}
```

with a unique constraint.

## Security

Never store:

``` text
password
```

Store only:

``` text
passwordHash
```

JWT secrets must NOT be stored in MongoDB documents.

They belong in backend environment variables.

------------------------------------------------------------------------

# 6. Collection: businesses

## Purpose

Stores the business profile and business-level configuration.

### Document

``` js
{
  _id: ObjectId,

  ownerId: ObjectId,

  name: String,

  businessType: String,

  description: String,

  location: {
    address: String,
    city: String,
    state: String,
    country: String
  },

  currency: String,

  timezone: String,

  logoUrl: String,

  settings: {
    lowStockThreshold: Number,

    aiEnabled: Boolean,

    notificationsEnabled: Boolean
  },

  createdAt: Date,

  updatedAt: Date
}
```

## businessType

Supported MVP values:

``` text
CLOTHING
RESTAURANT
SALON
GROCERY_RETAIL
ELECTRONICS
OTHER
```

Do not create separate databases for each business type.

------------------------------------------------------------------------

# 7. Collection: products

## Purpose

Stores products or sellable items.

Used by:

-   Product Module
-   Sales Module
-   Analytics Module
-   AI Module
-   Inventory

### Document

``` js
{
  _id: ObjectId,

  businessId: ObjectId,

  name: String,

  sku: String,

  category: String,

  description: String,

  price: Number,

  costPrice: Number,

  unit: String,

  status: String,

  metadata: Object,

  createdAt: Date,

  updatedAt: Date
}
```

## Example --- Clothing

``` js
{
  businessId: "...",

  name: "Black Hoodie",

  sku: "HD-BLK-001",

  category: "Hoodies",

  price: 1499,

  costPrice: 800,

  unit: "piece",

  status: "ACTIVE",

  metadata: {
    size: "XL",
    color: "Black"
  }
}
```

## Example --- Restaurant

``` js
{
  businessId: "...",

  name: "Paneer Pizza",

  category: "Pizza",

  price: 299,

  unit: "plate",

  status: "ACTIVE",

  metadata: {
    cuisine: "Indian"
  }
}
```

## Important

Do not make business-specific fields mandatory.

A restaurant may not need:

``` textsize
color
```

A clothing store may not need:

``` textingredients
```

Use `metadata` for lightweight business-specific attributes.

------------------------------------------------------------------------

# 8. Collection: sales

## Purpose

Stores sales transactions.

The architecture diagram specifically contains a **Sales Module
(CRUD)**.

For the MVP, sales should remain simple and analytics-friendly.

### Document

``` js
{
  _id: ObjectId,

  businessId: ObjectId,

  customerId: ObjectId,

  items: [
    {
      productId: ObjectId,

      productName: String,

      quantity: Number,

      unitPrice: Number,

      total: Number
    }
  ],

  subtotal: Number,

  discount: Number,

  tax: Number,

  totalAmount: Number,

  paymentMethod: String,

  status: String,

  soldAt: Date,

  createdAt: Date,

  updatedAt: Date
}
```

## Why store productName and unitPrice?

Historical sales must not change if the product changes later.

Example:

``` text
Product current price = ₹1,499
Old sale price = ₹999
```

The old sale should still show:

``` text
unitPrice = 999
```

Therefore, sales should contain a historical snapshot of the relevant
product information.

------------------------------------------------------------------------

# 9. Sale Status

Recommended MVP values:

``` text
COMPLETED
CANCELLED
REFUNDED
```

Only appropriate completed transactions should be included in revenue
calculations.

------------------------------------------------------------------------

# 10. Payment Method

Recommended MVP values:

``` text
CASH
CARD
UPI
ONLINE
OTHER
```

Do not assume every business supports every payment method.

------------------------------------------------------------------------

# 11. Collection: customers

## Purpose

Stores customer information.

Used for:

-   Customer analysis
-   Repeat customer analysis
-   Sales analytics
-   AI recommendations

### Document

``` js
{
  _id: ObjectId,

  businessId: ObjectId,

  name: String,

  email: String,

  phone: String,

  externalId: String,

  totalOrders: Number,

  totalSpent: Number,

  lastPurchaseAt: Date,

  createdAt: Date,

  updatedAt: Date
}
```

Customer information may be incomplete.

Therefore:

``` text
email → optional
phone → optional
```

Do not require both.

------------------------------------------------------------------------

# 12. Collection: expenses

## Purpose

Stores business expenses.

This supports better business intelligence because KEETY can analyze
more than revenue.

### Document

``` js
{
  _id: ObjectId,

  businessId: ObjectId,

  category: String,

  description: String,

  amount: Number,

  currency: String,

  expenseDate: Date,

  createdAt: Date,

  updatedAt: Date
}
```

## Expense categories

Recommended MVP values:

``` text
RENT
MARKETING
SUPPLIES
SALARY
UTILITIES
DELIVERY
OPERATIONS
OTHER
```

------------------------------------------------------------------------

# 13. Collection: inventory

## Purpose

Stores current inventory state.

### Document

``` js
{
  _id: ObjectId,

  businessId: ObjectId,

  productId: ObjectId,

  quantity: Number,

  reservedQuantity: Number,

  reorderLevel: Number,

  lastUpdatedAt: Date,

  createdAt: Date,

  updatedAt: Date
}
```

## Example

``` js
{
  businessId: "...",

  productId: "...",

  quantity: 18,

  reservedQuantity: 2,

  reorderLevel: 5
}
```

KEETY can use this to generate:

``` text
Low stock alert
Fast-selling product alert
Restock recommendation
Inventory risk
```

------------------------------------------------------------------------

# 14. Inventory Consistency

Inventory and sales must remain consistent.

When a sale is completed:

``` text
Sale Created
     ↓
Inventory Decreased
     ↓
Analytics Updated
     ↓
AI can use the new data
```

These database updates should be performed safely by the backend.

Do not let the frontend directly modify inventory.

------------------------------------------------------------------------

# 15. Collection: ai_logs

## Purpose

Stores AI requests and responses for:

-   Debugging
-   Usage tracking
-   Analytics
-   AI improvement
-   Auditing

### Document

``` js
{
  _id: ObjectId,

  businessId: ObjectId,

  userId: ObjectId,

  requestType: String,

  userPrompt: String,

  context: Object,

  response: String,

  model: String,

  inputTokens: Number,

  outputTokens: Number,

  latencyMs: Number,

  status: String,

  createdAt: Date
}
```

## requestType

Recommended:

``` text
ASK
BUSINESS_ANALYSIS
GROWTH_STRATEGY
PRODUCT_RECOMMENDATION
REPORT_GENERATION
```

## Important

Do not store secrets inside AI logs.

Never store:

``` text
API keys
JWT secrets
passwords
```

------------------------------------------------------------------------

# 16. AI Context

The `context` field may contain structured business information sent to
Gemini.

Example:

``` js
{
  revenue: {
    currentMonth: 120000,
    previousMonth: 100000,
    growthPercent: 20
  },

  topProducts: [
    {
      name: "Black Hoodie",
      revenue: 32000
    }
  ],

  inventory: {
    lowStockProducts: 4
  }
}
```

The backend should generate this context from trusted database data.

The frontend should not be responsible for constructing authoritative AI
business context.

------------------------------------------------------------------------

# 17. Collection: reports

## Purpose

Stores generated business reports and AI insights.

The architecture diagram includes:

``` text
Reports & Insights
Trends
Growth
Recommendations
```

### Document

``` js
{
  _id: ObjectId,

  businessId: ObjectId,

  type: String,

  title: String,

  summary: String,

  insights: [
    {
      title: String,

      description: String,

      metric: String,

      value: Number,

      changePercent: Number,

      severity: String
    }
  ],

  recommendations: [
    {
      title: String,

      description: String,

      priority: String,

      reason: String
    }
  ],

  period: {
    startDate: Date,

    endDate: Date
  },

  generatedBy: String,

  createdAt: Date,

  updatedAt: Date
}
```

------------------------------------------------------------------------

# 18. Report Types

Recommended:

``` text
DAILY
WEEKLY
MONTHLY
BUSINESS_ANALYSIS
GROWTH_STRATEGY
PRODUCT_ANALYSIS
INVENTORY_ANALYSIS
```

------------------------------------------------------------------------

# 19. Report Generation Flow

``` text
MongoDB
   ↓
Analytics Module
   ↓
Processed Business Data
   ↓
AI Module
   ↓
Google Gemini
   ↓
Insights + Recommendations
   ↓
reports collection
   ↓
Frontend
```

Important:

> Gemini generates explanations and recommendations. The backend remains
> responsible for retrieving and calculating the business facts.

------------------------------------------------------------------------

# 20. Analytics Data Model

The MVP does not need a separate analytics database.

The Analytics Module should calculate metrics from:

``` text
sales
products
customers
inventory
expenses
```

Examples:

``` text
Revenue
Total Sales
Average Order Value
Top Products
Slow Products
Sales Growth
Customer Growth
Inventory Risk
Expense Trends
```

------------------------------------------------------------------------

# 21. Revenue Calculation

Revenue should be calculated from valid completed sales.

Conceptually:

``` text
Revenue =
SUM(
  completed sales totalAmount
)
```

Cancelled/refunded transactions should not incorrectly increase revenue.

------------------------------------------------------------------------

# 22. Sales Growth

KEETY can calculate:

``` text
Growth %
=
(Current Period - Previous Period)
/
Previous Period
× 100
```

Example:

``` text
Previous Month = ₹100,000
Current Month = ₹120,000

Growth = 20%
```

If the previous period is zero, handle the calculation separately
instead of producing an invalid number.

------------------------------------------------------------------------

# 23. Product Performance

Product performance can be calculated from sales.

Example:

``` text
Product
 ↓
Total Quantity Sold
 ↓
Total Revenue
 ↓
Growth
 ↓
Inventory
```

KEETY can then produce:

``` text
Top Selling Products
Slow Moving Products
High Revenue Products
Low Stock + High Demand Products
```

------------------------------------------------------------------------

# 24. Database Query Pattern

Backend services should always follow:

``` text
Request
 ↓
JWT Authentication
 ↓
User Identification
 ↓
Business Identification
 ↓
Authorization
 ↓
MongoDB Query
 ↓
Response
```

Example:

``` js
const products = await Product.find({
  businessId: authenticatedBusinessId
});
```

Not:

``` js
const products = await Product.find({});
```

------------------------------------------------------------------------

# 25. MongoDB Indexes

Indexes are critical for KEETY because most queries are business-scoped.

Recommended indexes:

## users

``` text
email
```

## businesses

``` text
ownerId
```

## products

``` text
businessId
businessId + sku
businessId + category
```

## sales

``` text
businessId
businessId + soldAt
businessId + status
businessId + customerId
```

## customers

``` text
businessId
businessId + email
businessId + phone
```

## expenses

``` text
businessId
businessId + expenseDate
```

## inventory

``` text
businessId
businessId + productId
```

## ai_logs

``` text
businessId
businessId + createdAt
businessId + requestType
```

## reports

``` text
businessId
businessId + createdAt
businessId + type
```

------------------------------------------------------------------------

# 26. Compound Index Priority

The most important pattern is:

``` text
businessId + date
```

For example:

``` js
{
  businessId: 1,
  soldAt: -1
}
```

This supports queries such as:

``` text
Give me this business's sales for the last 30 days.
```

------------------------------------------------------------------------

# 27. Data Isolation

Every business-scoped collection must use:

``` text
businessId
```

Collections:

``` text
products
sales
customers
expenses
inventory
ai_logs
reports
```

The backend must never trust a `businessId` supplied directly by the
frontend without authorization validation.

------------------------------------------------------------------------

# 28. MongoDB Relationships

MongoDB does not require traditional SQL foreign keys.

KEETY should use ObjectId references.

Example:

``` js
Product.businessId → Business._id
Product._id → Sales.items.productId

Sale.customerId → Customer._id

Inventory.productId → Product._id

AI_Log.businessId → Business._id

Report.businessId → Business._id
```

The backend is responsible for validating referenced records.

------------------------------------------------------------------------

# 29. Embedding vs Referencing

## Embed

Use embedding when the data belongs tightly to the parent.

Example:

``` text
Sale
 └── items[]
```

Sale items can be embedded because they represent one transaction.

## Reference

Use references when the entity has an independent lifecycle.

Examples:

``` text
Business → Product
Business → Customer
Business → Inventory
Business → Reports
Business → AI Logs
```

------------------------------------------------------------------------

# 30. Product Metadata

The product schema should remain generic.

Example clothing:

``` js
metadata: {
  size: "L",
  color: "Black"
}
```

Restaurant:

``` js
metadata: {
  cuisine: "Indian",
  vegetarian: true
}
```

Electronics:

``` js
metadata: {
  brand: "Example",
  warrantyMonths: 12
}
```

Do not create separate product collections for each business type in the
MVP.

------------------------------------------------------------------------

# 31. Restaurant Data

For the MVP, restaurants can use the same:

``` text
products
sales
inventory
customers
expenses
```

For example:

``` text
Product = Pizza
Product = Burger
Product = Coffee
```

The future architecture can add restaurant-specific collections if
required.

------------------------------------------------------------------------

# 32. Clothing Data

For the MVP:

``` text
Product
  ↓
metadata
  ├── size
  ├── color
  └── variant information
```

If KEETY later needs advanced variant-level inventory:

``` text
Product
   ↓
ProductVariant
   ↓
Inventory
```

This is a future enhancement, not an MVP requirement.

------------------------------------------------------------------------

# 33. Salon Data

For MVP, salon services can also be represented as products/services.

Example:

``` text
Product
name: Haircut
category: Services
price: 500
```

A dedicated appointment system is outside the current MVP database scope
unless required by the backend specification.

------------------------------------------------------------------------

# 34. Grocery / Retail

Use:

``` text
products
sales
inventory
customers
expenses
```

Inventory becomes especially important.

KEETY can identify:

``` text
Fast moving products
Low stock
Slow moving products
Revenue contributors
```

------------------------------------------------------------------------

# 35. Electronics

Use:

``` text
products
sales
inventory
customers
expenses
```

Product metadata can contain:

``` text
brand
model
warranty
```

without changing the core product structure.

------------------------------------------------------------------------

# 36. AI Database Boundary

The correct flow is:

``` text
MongoDB
   ↓
Analytics Module
   ↓
Structured Business Context
   ↓
AI Module
   ↓
Gemini
   ↓
AI Response
```

Do not give Gemini direct unrestricted MongoDB access.

Bad:

``` text
Gemini
  ↓
MongoDB directly
```

Good:

``` text
Backend
  ↓
Validated query
  ↓
Business context
  ↓
Gemini
```

------------------------------------------------------------------------

# 37. Gemini Integration

The architecture specifies:

``` text
Google Gemini API
```

The API key must be stored in:

``` text
.env
```

Example:

``` env
GEMINI_API_KEY=...
```

Never store:

``` text
GEMINI_API_KEY
```

inside MongoDB.

------------------------------------------------------------------------

# 38. AI Hallucination Protection

KEETY should distinguish:

``` text
DATABASE FACT
AI INTERPRETATION
AI RECOMMENDATION
```

Example:

``` text
Database Fact:
Revenue increased 20%.

AI Interpretation:
Sales momentum has improved.

AI Recommendation:
Consider increasing promotion of the top-performing category.
```

The AI must not invent business numbers.

------------------------------------------------------------------------

# 39. Reports as AI Output

A generated report should preserve both:

``` text
facts
```

and:

``` text
recommendations
```

Example:

``` js
{
  insights: [
    {
      title: "Revenue Growth",
      metric: "revenue",
      value: 120000,
      changePercent: 20
    }
  ],

  recommendations: [
    {
      title: "Increase Stock",
      description: "...",
      priority: "HIGH"
    }
  ]
}
```

This makes AI output easier to display and audit.

------------------------------------------------------------------------

# 40. API-to-Database Mapping

Based on the approved architecture:

``` text
POST /api/auth/register
        ↓
users

POST /api/business
        ↓
businesses

GET /api/business/:id
        ↓
businesses

POST /api/products
        ↓
products

GET /api/analytics
        ↓
sales
products
customers
inventory
expenses

POST /api/ai/ask
        ↓
MongoDB business data
        ↓
AI Module
        ↓
Gemini
        ↓
ai_logs

POST /api/ai/growth-strategy
        ↓
Analytics
        ↓
Gemini
        ↓
reports + ai_logs
```

------------------------------------------------------------------------

# 41. Dashboard Data Flow

The frontend Dashboard should not directly query MongoDB.

Correct:

``` text
React Dashboard
      ↓
GET /api/analytics
      ↓
Analytics Module
      ↓
MongoDB
      ↓
JSON Response
      ↓
React Dashboard
```

Example response:

``` json
{
  "revenue": 120000,
  "sales": 340,
  "growthPercent": 20,
  "topProducts": [],
  "lowStockProducts": [],
  "insights": []
}
```

------------------------------------------------------------------------

# 42. Data Validation

Backend must validate incoming data before MongoDB writes.

Validate:

``` text
name
email
price
quantity
amount
businessId
productId
dates
```

Examples:

``` text
price >= 0
quantity >= 0
amount >= 0
```

Do not rely only on frontend validation.

------------------------------------------------------------------------

# 43. Transactions

MongoDB transactions should be used when multiple related documents must
change atomically.

Example:

``` text
Create Sale
   +
Update Inventory
```

If inventory update fails, the sale should not incorrectly appear as
completed.

For simple single-document writes, a transaction is not necessary.

------------------------------------------------------------------------

# 44. Soft Delete

For MVP, prefer status fields where possible.

Example:

``` text
Product:
ACTIVE
INACTIVE
```

Instead of immediately deleting products.

Historical sales must remain readable even if a product becomes
inactive.

------------------------------------------------------------------------

# 45. Historical Data

KEETY's analytics depend on historical information.

Do not delete completed sales merely because a product is no longer
active.

Example:

``` text
Product:
ACTIVE → INACTIVE
```

Historical sales remain:

``` text
Sale
 └── Product snapshot
```

This protects historical analytics.

------------------------------------------------------------------------

# 46. Date Handling

All backend timestamps should be stored as proper MongoDB `Date` values.

Business timezone should be stored in:

``` text
businesses.timezone
```

Analytics should interpret reporting periods according to the business
timezone.

------------------------------------------------------------------------

# 47. Currency Handling

Business stores:

``` text
currency
```

Example:

``` text
INR
USD
EUR
GBP
```

All monetary fields should use numeric values consistently.

Do not mix:

``` text
₹1000
```

and:

``` text
1000
```

inside numeric database fields.

Currency formatting belongs to the frontend.

------------------------------------------------------------------------

# 48. Database Environment

Development:

``` env
MONGODB_URI=mongodb://localhost:27017/keety
```

Production:

``` env
MONGODB_URI=<MongoDB Atlas connection string>
```

Actual production secrets must be stored securely and never committed to
Git.

------------------------------------------------------------------------

# 49. Database Naming

Recommended database name:

``` text
keety
```

Production may use:

``` text
keety_production
```

depending on deployment strategy.

Collections:

``` text
users
businesses
products
sales
customers
expenses
inventory
ai_logs
reports
```

Use lowercase collection names consistently.

------------------------------------------------------------------------

# 50. Seed Data

Development seed data should include at least:

### Clothing Store

``` text
Black Hoodie
White T-Shirt
Blue Jeans
Oversized T-Shirt
```

### Restaurant

``` text
Burger
Pizza
Pasta
Coffee
```

### Retail

``` text
Rice
Oil
Milk
Snacks
```

### Electronics

``` text
Headphones
Keyboard
Mouse
Monitor
```

The seed data should include multiple dates and sales volumes so
Analytics and AI can demonstrate meaningful insights.

------------------------------------------------------------------------

# 51. Required MVP Database Features

The MVP database is complete when KEETY can:

``` text
1. Register a user
2. Create a business
3. Store business profile
4. Add products
5. Record sales
6. Store customers
7. Store expenses
8. Track inventory
9. Calculate analytics
10. Generate AI context
11. Store AI logs
12. Generate reports
13. Maintain business isolation
```

------------------------------------------------------------------------

# 52. MVP Collection Summary

  Collection   Purpose                    Priority
  ------------ -------------------------- ----------
  users        Authentication/users       P0
  businesses   Business profile           P0
  products     Products/services          P0
  sales        Sales transactions         P0
  customers    Customer data              P1
  expenses     Business expenses          P1
  inventory    Stock tracking             P1
  ai_logs      AI request/response logs   P1
  reports      AI insights/reports        P1

------------------------------------------------------------------------

# 53. What Is NOT Required in MVP

Do not add these unless backend requirements specifically require them:

``` text
orders
order_items
product_variants
appointments
restaurant_tables
suppliers
purchase_orders
marketing_campaigns
subscriptions
payments
vector database
data warehouse
event store
Kafka
Redis
```

The current architecture does not require these for the MVP.

MongoDB Atlas + Express.js is sufficient for the initial product.

------------------------------------------------------------------------

# 54. Final Database Architecture

``` text
                    KEETY WEB APP
                          │
                          │ REST API
                          ↓
                NODE + EXPRESS SERVER
                          │
          ┌───────────────┼────────────────┐
          │               │                │
          ↓               ↓                ↓
      Auth Module    Business Module   Product Module
          │               │                │
          └───────────────┼────────────────┘
                          ↓
                    SALES MODULE
                          │
                          ↓
                   ANALYTICS MODULE
                          │
                          ↓
                     AI MODULE
                          │
                          ↓
                    GEMINI API
                          │
                          ↓
                 AI Response / Insights
                          │
                          ↓
                    MONGODB ATLAS
                          │
       ┌──────────────────┼───────────────────┐
       ↓                  ↓                   ↓
    users             businesses           products
       ↓                  ↓                   ↓
    customers           sales             inventory
       ↓                  ↓                   ↓
    expenses            ai_logs            reports
```

------------------------------------------------------------------------

# 55. Final Rules

The KEETY database must follow these rules:

### Rule 1

> MongoDB Atlas is the single primary database for the MVP.

### Rule 2

> Every business-owned document must be scoped using `businessId`.

### Rule 3

> The frontend never connects directly to MongoDB.

### Rule 4

> Only the Node.js + Express backend communicates with MongoDB.

### Rule 5

> Gemini never gets unrestricted database access.

### Rule 6

> Analytics calculates trusted business metrics.

### Rule 7

> Gemini explains those metrics and generates recommendations.

### Rule 8

> AI logs are stored for traceability and debugging.

### Rule 9

> Historical sales data must remain stable even when product information
> changes.

### Rule 10

> Do not over-engineer the MVP database.

------------------------------------------------------------------------

# 56. Final KEETY Data Flow

``` text
BUSINESS OWNER
      │
      ↓
KEETY WEB APP
      │
      ↓
NODE + EXPRESS
      │
      ├──────────────→ MongoDB Atlas
      │                    │
      │                    ├── Users
      │                    ├── Businesses
      │                    ├── Products
      │                    ├── Sales
      │                    ├── Customers
      │                    ├── Expenses
      │                    ├── Inventory
      │                    ├── AI Logs
      │                    └── Reports
      │
      ↓
ANALYTICS MODULE
      │
      ↓
PROCESSED BUSINESS DATA
      │
      ↓
AI MODULE
      │
      ↓
GOOGLE GEMINI
      │
      ↓
INSIGHTS
RECOMMENDATIONS
GROWTH STRATEGIES
BUSINESS ANSWERS
      │
      ↓
KEETY WEB APP
```

## Core Principle

> **MongoDB stores the business truth. The Analytics Module calculates
> the numbers. The AI Module uses those verified numbers to understand
> the business, explain what is happening, and recommend what the
> business should do next.**
