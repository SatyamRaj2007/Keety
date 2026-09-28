# KEETY --- Backend Architecture & API Specification (MVP)

> **Source of truth:** This backend specification follows the approved
> KEETY architecture and the `database.md` structure.
>
> **Architecture:** React + TailwindCSS → Node.js + Express.js →
> Analytics / AI Modules → MongoDB Atlas + Google Gemini API.
>
> The backend is a modular REST API for a multi-business AI Business
> Intelligence platform.

------------------------------------------------------------------------

# 1. Backend Purpose

KEETY's backend is the central application layer between the frontend,
MongoDB Atlas, Analytics, and Google Gemini.

The backend is responsible for:

-   Authentication
-   Authorization
-   Business profile management
-   Product CRUD
-   Sales CRUD
-   Customer management
-   Expense management
-   Inventory management
-   Business analytics
-   AI context construction
-   Gemini integration
-   AI-generated insights and recommendations
-   Reports
-   AI interaction logs
-   Business data isolation

KEETY must support different business types without creating separate
backend applications.

Supported business types:

``` text
CLOTHING
RESTAURANT
SALON
GROCERY_RETAIL
ELECTRONICS
OTHER
```

------------------------------------------------------------------------

# 2. Approved Technology Stack

## Backend

``` text
Node.js
Express.js
MongoDB Atlas
Mongoose
JWT
Google Gemini API
```

## Frontend Communication

``` text
REST API
JSON
HTTP / HTTPS
```

## Optional Services

``` text
Cloud Storage
Email / Notifications
```

Optional services are not required for the core MVP.

------------------------------------------------------------------------

# 3. Approved Architecture

``` text
                    KEETY WEB APP
                 React + TailwindCSS
                         │
                         │ REST / JSON
                         ↓
              ┌──────────────────────┐
              │ Node.js + Express.js │
              │       Backend        │
              └──────────┬───────────┘
                         │
       ┌─────────────────┼──────────────────┐
       ↓                 ↓                  ↓
    MongoDB          Analytics            AI Module
    Atlas             Module                │
       │                 │                  ↓
       │                 │          Google Gemini
       │                 │                  │
       │                 └──────→ Context ─┘
       │
       ├── Users
       ├── Businesses
       ├── Products
       ├── Sales
       ├── Customers
       ├── Expenses
       ├── Inventory
       ├── AI Logs
       └── Reports
```

------------------------------------------------------------------------

# 4. Core Backend Principle

KEETY follows this flow:

``` text
MongoDB
   ↓
Backend Services
   ↓
Analytics Module
   ↓
Verified Business Metrics
   ↓
AI Module
   ↓
Google Gemini
   ↓
Insights / Recommendations / Strategies
   ↓
Frontend
```

### Critical rule

Gemini must **not** have direct unrestricted access to MongoDB.

The backend decides:

-   Which business the user can access
-   Which data is relevant
-   Which calculations are required
-   What context can be sent to Gemini
-   What AI response is safe to return

------------------------------------------------------------------------

# 5. Backend Modules

The backend should be organized into these modules:

``` text
Auth Module
Business Module
Product Module
Sales Module
Customer Module
Expense Module
Inventory Module
Analytics Module
AI Module
Report Module
```

The core architecture requires:

``` text
Auth
Business
Product
Sales
Analytics
AI
```

The additional modules support the approved database model and MVP
workflow.

------------------------------------------------------------------------

# 6. Module Responsibilities

## Auth Module

Responsible for:

-   User registration
-   Login
-   JWT generation
-   Authentication middleware
-   User identity
-   Role checks

------------------------------------------------------------------------

## Business Module

Responsible for:

-   Creating business
-   Reading business profile
-   Updating business profile
-   Business type
-   Business settings
-   Currency
-   Timezone
-   Business ownership

------------------------------------------------------------------------

## Product Module

Responsible for:

-   Product creation
-   Product retrieval
-   Product update
-   Product status
-   Product categories
-   Product metadata
-   Product pricing

------------------------------------------------------------------------

## Sales Module

Responsible for:

-   Recording sales
-   Reading sales
-   Updating valid sales records
-   Sales status
-   Payment method
-   Historical product price snapshots
-   Inventory synchronization

------------------------------------------------------------------------

## Customer Module

Responsible for:

-   Customer creation
-   Customer retrieval
-   Customer update
-   Customer statistics

------------------------------------------------------------------------

## Expense Module

Responsible for:

-   Recording expenses
-   Reading expenses
-   Updating expenses
-   Expense categories
-   Expense trends

------------------------------------------------------------------------

## Inventory Module

Responsible for:

-   Current stock
-   Stock threshold
-   Inventory updates
-   Low-stock detection
-   Inventory-related insights

------------------------------------------------------------------------

## Analytics Module

Responsible for calculating trusted business metrics.

Examples:

``` text
Revenue
Total Sales
Average Order Value
Sales Growth
Top Products
Slow Products
Customer Growth
Inventory Risk
Expense Trends
```

Analytics must calculate business facts from MongoDB rather than asking
Gemini to calculate raw numbers.

------------------------------------------------------------------------

## AI Module

Responsible for:

-   Ask KEETY
-   Business analysis
-   Growth strategy
-   Product recommendations
-   Business recommendations
-   Natural-language business Q&A
-   Report generation
-   Business-specific advice
-   Gemini request construction
-   Gemini response validation
-   AI logging

------------------------------------------------------------------------

## Report Module

Responsible for:

-   Generated reports
-   Business insights
-   Recommendations
-   Report history
-   Report retrieval

------------------------------------------------------------------------

# 7. Recommended Project Structure

``` text
backend/
│
├── src/
│   ├── app.js
│   ├── server.js
│   │
│   ├── config/
│   │   ├── db.js
│   │   ├── env.js
│   │   └── gemini.js
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── business.middleware.js
│   │   ├── error.middleware.js
│   │   └── validate.middleware.js
│   │
│   ├── modules/
│   │   ├── auth/
│   │   ├── business/
│   │   ├── products/
│   │   ├── sales/
│   │   ├── customers/
│   │   ├── expenses/
│   │   ├── inventory/
│   │   ├── analytics/
│   │   ├── ai/
│   │   └── reports/
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Business.js
│   │   ├── Product.js
│   │   ├── Sale.js
│   │   ├── Customer.js
│   │   ├── Expense.js
│   │   ├── Inventory.js
│   │   ├── AILog.js
│   │   └── Report.js
│   │
│   ├── utils/
│   │   ├── jwt.js
│   │   ├── errors.js
│   │   ├── pagination.js
│   │   └── dates.js
│   │
│   └── routes/
│       └── index.js
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── api/
│
├── .env
├── .env.example
├── package.json
└── README.md
```

Use this structure as the target architecture, but do not create
unnecessary files or abstractions before they are needed.

------------------------------------------------------------------------

# 8. Request Lifecycle

Protected business requests should follow:

``` text
Frontend
   ↓
Express Router
   ↓
JWT Authentication
   ↓
Business Authorization
   ↓
Input Validation
   ↓
Controller
   ↓
Service
   ↓
MongoDB / Analytics / AI
   ↓
JSON Response
```

------------------------------------------------------------------------

# 9. Authentication

KEETY uses JWT authentication.

## Register

``` http
POST /api/auth/register
```

### Request

``` json
{
  "name": "Business Owner",
  "email": "owner@example.com",
  "password": "password"
}
```

### Flow

``` text
Validate
   ↓
Check duplicate email
   ↓
Hash password
   ↓
Create user
   ↓
Create/associate business when required
   ↓
Generate JWT
   ↓
Return safe user data
```

Never return:

``` text
passwordHash
```

------------------------------------------------------------------------

# 10. JWT

Protected requests use:

``` http
Authorization: Bearer <JWT>
```

JWT should identify the authenticated user.

Conceptually:

``` json
{
  "userId": "...",
  "role": "OWNER"
}
```

Do not treat a client-supplied `businessId` as proof of access.

The backend must resolve and verify business membership/ownership.

------------------------------------------------------------------------

# 11. Authentication Middleware

`auth.middleware.js` should:

1.  Read the Authorization header.
2.  Validate Bearer token.
3.  Verify JWT.
4.  Identify the user.
5.  Attach authenticated user context to `req`.
6.  Reject invalid authentication.

Conceptually:

``` js
req.user = {
  id: userId,
  role: role
};
```

------------------------------------------------------------------------

# 12. Business Authorization

After authentication:

``` text
JWT
 ↓
User
 ↓
Authorized Business
 ↓
businessId
```

All business queries must use the authorized business ID.

Example:

``` js
Product.find({
  businessId: req.businessId
});
```

Never:

``` js
Product.find({});
```

for a business-scoped endpoint.

------------------------------------------------------------------------

# 13. Multi-Business Isolation

KEETY is multi-business.

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

A user authorized for Business A must never receive Business B data.

This must be enforced on the backend, not only in the frontend.

------------------------------------------------------------------------

# 14. Business API

## Create

``` http
POST /api/business
```

### Request

``` json
{
  "name": "My Clothing Store",
  "businessType": "CLOTHING",
  "description": "Local clothing shop",
  "currency": "INR",
  "timezone": "Asia/Kolkata"
}
```

The backend must attach ownership from the authenticated user.

------------------------------------------------------------------------

## Get

``` http
GET /api/business/:id
```

The backend must verify that the authenticated user can access the
requested business.

------------------------------------------------------------------------

# 15. Product API

Product Module supports CRUD.

``` http
POST   /api/products
GET    /api/products
GET    /api/products/:id
PATCH  /api/products/:id
DELETE /api/products/:id
```

All routes are business-scoped.

------------------------------------------------------------------------

# 16. Create Product

Example:

``` json
{
  "name": "Black Hoodie",
  "sku": "HD-BLK-001",
  "category": "Hoodies",
  "description": "Black cotton hoodie",
  "price": 1499,
  "costPrice": 800,
  "unit": "piece",
  "metadata": {
    "size": "XL",
    "color": "Black"
  }
}
```

The backend determines:

``` text
businessId
```

from authenticated business context.

------------------------------------------------------------------------

# 17. Product Business-Type Flexibility

Do not create separate product APIs for each business.

Use:

``` text
Product
+
Business Type
+
Metadata
```

Example:

``` json
{
  "businessType": "RESTAURANT",
  "name": "Paneer Pizza",
  "metadata": {
    "cuisine": "Indian"
  }
}
```

And:

``` json
{
  "businessType": "ELECTRONICS",
  "name": "Wireless Headphones",
  "metadata": {
    "brand": "Example",
    "warrantyMonths": 12
  }
}
```

------------------------------------------------------------------------

# 18. Sales API

Sales Module supports:

``` http
POST  /api/sales
GET   /api/sales
GET   /api/sales/:id
PATCH /api/sales/:id
```

Sales are always business-scoped.

------------------------------------------------------------------------

# 19. Create Sale Flow

``` text
POST /api/sales
       ↓
Validate request
       ↓
Resolve business
       ↓
Validate products
       ↓
Calculate totals
       ↓
Create sale
       ↓
Update inventory when applicable
       ↓
Return sale
```

The backend must calculate trusted totals instead of blindly trusting
client-calculated totals.

------------------------------------------------------------------------

# 20. Sale Data Integrity

Each sold item should preserve:

``` text
productId
productName
quantity
unitPrice
total
```

Historical price must not depend on the current product price.

Example:

``` text
Current Product Price = ₹1499
Historical Sale Price = ₹999
```

The historical sale must remain:

``` text
unitPrice = 999
```

------------------------------------------------------------------------

# 21. Sale Status

Recommended values:

``` text
COMPLETED
CANCELLED
REFUNDED
```

Only appropriate completed sales should contribute to revenue.

------------------------------------------------------------------------

# 22. Inventory Synchronization

For inventory-tracked products:

``` text
Sale Completed
      ↓
Decrease Inventory
      ↓
Check Low Stock
      ↓
Analytics sees updated data
```

When sale + inventory changes must be atomic, use a MongoDB
transaction/session.

------------------------------------------------------------------------

# 23. Customer API

``` http
POST  /api/customers
GET   /api/customers
GET   /api/customers/:id
PATCH /api/customers/:id
```

Customer information supports:

``` text
Total Orders
Total Spent
Last Purchase
Repeat Customer Analysis
Customer Growth
```

------------------------------------------------------------------------

# 24. Expense API

``` http
POST   /api/expenses
GET    /api/expenses
GET    /api/expenses/:id
PATCH  /api/expenses/:id
DELETE /api/expenses/:id
```

Example:

``` json
{
  "category": "MARKETING",
  "description": "Instagram promotion",
  "amount": 5000,
  "expenseDate": "2026-09-20"
}
```

------------------------------------------------------------------------

# 25. Inventory API

``` http
GET   /api/inventory
GET   /api/inventory/:productId
PATCH /api/inventory/:productId
```

Example rule:

``` text
quantity = 4
reorderLevel = 5

→ LOW STOCK
```

The frontend must not directly manipulate inventory without backend
validation.

------------------------------------------------------------------------

# 26. Analytics API

The architecture requires:

``` http
GET /api/analytics
```

Possible query parameters:

``` text
period
startDate
endDate
```

Example:

``` http
GET /api/analytics?period=monthly
```

------------------------------------------------------------------------

# 27. Analytics Response

Example:

``` json
{
  "success": true,
  "data": {
    "revenue": 120000,
    "salesCount": 340,
    "averageOrderValue": 352.94,
    "growthPercent": 20,
    "topProducts": [],
    "slowProducts": [],
    "lowStockProducts": [],
    "expenseSummary": {},
    "customerSummary": {}
  }
}
```

The response may evolve with frontend requirements.

------------------------------------------------------------------------

# 28. Analytics Responsibilities

Analytics should calculate:

``` text
Revenue
Total Sales
Average Order Value
Sales Growth
Top Products
Slow Products
Customer Growth
Inventory Risk
Expense Trends
```

The Analytics Module is the source of truth for numerical business
metrics.

------------------------------------------------------------------------

# 29. Revenue Calculation

Use valid completed sales.

Conceptually:

``` text
Revenue =
SUM(completed sale totalAmount)
```

Cancelled/refunded transactions must not incorrectly increase revenue.

------------------------------------------------------------------------

# 30. Sales Growth

``` text
Growth %
=
(Current Period - Previous Period)
/
Previous Period
× 100
```

If the previous period is zero, handle that case explicitly.

Never return `Infinity`, `NaN`, or an invalid business metric.

------------------------------------------------------------------------

# 31. AI API

The core AI routes are:

``` http
POST /api/ai/ask
POST /api/ai/growth-strategy
```

Canonical route:

``` text
/api/ai/ask
```

------------------------------------------------------------------------

# 32. Ask KEETY

``` http
POST /api/ai/ask
```

### Request

``` json
{
  "question": "Which products should I restock?"
}
```

### Flow

``` text
User Question
      ↓
JWT Authentication
      ↓
Business Authorization
      ↓
Validate Question
      ↓
Analytics Module
      ↓
Business Context
      ↓
AI Module
      ↓
Google Gemini
      ↓
Validate Response
      ↓
Store AI Log
      ↓
Return Response
```

------------------------------------------------------------------------

# 33. AI Business Context

The backend may combine:

``` text
Business Profile
+
Products
+
Sales
+
Customers
+
Expenses
+
Inventory
+
Analytics
+
User Question
```

Only relevant information should be sent to Gemini.

Do not send the entire database blindly.

------------------------------------------------------------------------

# 34. Example AI Context

``` json
{
  "business": {
    "type": "CLOTHING",
    "name": "My Clothing Store"
  },

  "analytics": {
    "revenue": 482000,
    "orders": 1248,
    "salesGrowthPercent": 14.2
  },

  "topProducts": [
    {
      "name": "Black Hoodie",
      "revenue": 45000,
      "quantitySold": 120
    }
  ],

  "inventory": {
    "lowStockProducts": [
      "Black Hoodie"
    ]
  },

  "question": "Which products should I restock?"
}
```

------------------------------------------------------------------------

# 35. AI Prompt Rules

Gemini should be instructed to:

-   Use only supplied business facts.
-   Never invent business metrics.
-   Give practical recommendations.
-   Clearly distinguish facts from interpretations.
-   Clearly distinguish recommendations from facts.
-   Respect the business type.
-   State when data is insufficient.
-   Avoid pretending that missing data exists.

------------------------------------------------------------------------

# 36. AI Hallucination Protection

KEETY separates:

``` text
DATABASE FACT
AI INTERPRETATION
AI RECOMMENDATION
```

Example:

``` text
Fact:
Revenue increased 20%.

Interpretation:
Sales momentum improved during the selected period.

Recommendation:
Consider increasing focus on the strongest-performing category.
```

The AI must not invent numbers.

------------------------------------------------------------------------

# 37. Growth Strategy API

``` http
POST /api/ai/growth-strategy
```

### Request

``` json
{
  "goal": "Increase monthly revenue"
}
```

### Flow

``` text
Request
 ↓
Authentication
 ↓
Business Authorization
 ↓
Analytics
 ↓
Business Context
 ↓
AI Module
 ↓
Gemini
 ↓
Growth Strategy
 ↓
AI Log
 ↓
Response
```

------------------------------------------------------------------------

# 38. AI Response Structure

Prefer structured output:

``` json
{
  "answer": "Your sales are growing, but several high-performing products are close to their stock threshold.",

  "insights": [
    {
      "title": "Revenue Growth",
      "description": "Revenue increased during the selected period.",
      "metric": "revenueGrowth",
      "value": 20
    }
  ],

  "recommendations": [
    {
      "title": "Restock Black Hoodie",
      "description": "Demand is strong and inventory is low.",
      "priority": "HIGH"
    }
  ]
}
```

Validate the response before returning it to the frontend.

------------------------------------------------------------------------

# 39. AI Logs

AI interactions should be logged using the `ai_logs` collection.

Example:

``` js
{
  businessId,
  userId,
  requestType,
  userPrompt,
  context,
  response,
  model,
  status,
  createdAt
}
```

Do not store:

``` text
API keys
JWT secrets
passwords
```

------------------------------------------------------------------------

# 40. Reports API

Recommended:

``` http
GET  /api/reports
GET  /api/reports/:id
POST /api/reports
```

Reports support the Reports & Insights section of the product.

------------------------------------------------------------------------

# 41. Report Generation

``` text
MongoDB
   ↓
Analytics Module
   ↓
Processed Business Data
   ↓
AI Module
   ↓
Gemini
   ↓
Insights + Recommendations
   ↓
reports collection
   ↓
Frontend
```

Reports can contain:

``` text
Summary
Insights
Metrics
Recommendations
Reporting Period
```

------------------------------------------------------------------------

# 42. Report Types

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

# 43. Business-Specific Intelligence

Do not create:

``` text
restaurantBackend
clothingBackend
salonBackend
```

Use:

``` text
Business Type
      ↓
Generic Data Model
      ↓
Analytics
      ↓
Business-Specific Context
      ↓
Gemini
```

Examples:

### Clothing

``` text
Product demand
Category performance
Inventory
Sales trends
```

### Restaurant

``` text
Menu item performance
Sales trends
Inventory
Expenses
```

### Salon

``` text
Service performance
Customer trends
Revenue
Repeat customer insights
```

### Grocery/Retail

``` text
Fast-moving products
Low stock
Sales trends
Inventory risk
```

### Electronics

``` text
Product performance
Inventory
Revenue
Product metadata
```

------------------------------------------------------------------------

# 44. Validation

Every write endpoint must validate:

``` text
Required fields
Data types
Numbers
Dates
ObjectIds
Enum values
String lengths
```

Examples:

``` text
price >= 0
quantity >= 0
amount >= 0
```

Frontend validation is not sufficient.

------------------------------------------------------------------------

# 45. Error Handling

Use centralized Express error handling.

Flow:

``` text
Controller
   ↓
Service
   ↓
Error
   ↓
Error Middleware
   ↓
Standard JSON Response
```

Example:

``` json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Product price must be greater than or equal to 0"
  }
}
```

Do not expose internal stack traces in production.

------------------------------------------------------------------------

# 46. HTTP Status Codes

Use consistently:

``` text
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
429 Too Many Requests
500 Internal Server Error
502 Bad Gateway
503 Service Unavailable
```

------------------------------------------------------------------------

# 47. Pagination

List endpoints must not return unlimited records.

Example:

``` http
GET /api/products?page=1&limit=20
```

Recommended:

``` text
Default limit = 20
Maximum limit = 100
```

Apply pagination to:

``` text
products
sales
customers
expenses
inventory
reports
```

where appropriate.

------------------------------------------------------------------------

# 48. Filtering

Supported filters can include:

``` text
category
status
startDate
endDate
search
page
limit
sort
```

Example:

``` http
GET /api/products?category=Hoodies&status=ACTIVE
```

Every filter remains inside the authenticated business scope.

------------------------------------------------------------------------

# 49. Security

The backend must:

-   Hash passwords.
-   Verify JWTs.
-   Enforce business authorization.
-   Scope all business queries.
-   Validate input.
-   Validate ObjectIds.
-   Keep Gemini credentials server-side.
-   Keep MongoDB credentials server-side.
-   Avoid exposing sensitive fields.
-   Avoid exposing internal errors.
-   Apply reasonable request limits.
-   Never trust client ownership fields.

------------------------------------------------------------------------

# 50. Environment Variables

Example:

``` env
NODE_ENV=development

PORT=5000

MONGODB_URI=mongodb+srv://...

JWT_SECRET=...

JWT_EXPIRES_IN=7d

GEMINI_API_KEY=...

GEMINI_MODEL=...
```

Optional:

``` env
CLOUD_STORAGE_URL=...
EMAIL_SERVICE_URL=...
```

Never commit `.env`.

Provide:

``` text
.env.example
```

------------------------------------------------------------------------

# 51. Gemini Security

The frontend must never receive:

``` text
GEMINI_API_KEY
```

Correct:

``` text
React
  ↓
Express
  ↓
Gemini
```

Incorrect:

``` text
React
  ↓
Gemini directly
```

------------------------------------------------------------------------

# 52. Gemini Failure Handling

Handle:

``` text
Timeout
Rate limit
Invalid response
Provider unavailable
Network error
Model error
```

Return a controlled response.

Example:

``` json
{
  "success": false,
  "error": {
    "code": "AI_SERVICE_UNAVAILABLE",
    "message": "KEETY AI is temporarily unavailable. Please try again."
  }
}
```

Do not expose provider secrets or raw internal errors.

------------------------------------------------------------------------

# 53. AI Response Validation

When a structured AI response is expected:

``` text
Gemini
 ↓
Parse
 ↓
Validate
 ↓
Normalize
 ↓
Return
```

If validation fails:

``` text
Log failure
 ↓
Return safe error
```

Do not treat arbitrary model output as trusted database data.

------------------------------------------------------------------------

# 54. AI Cost Control

For MVP:

-   Send only relevant context.
-   Avoid sending the complete database.
-   Limit question length.
-   Limit context size.
-   Track usage where available.
-   Avoid repeated unnecessary AI calls.

Do not introduce Redis or complex queues unless an actual requirement
appears.

------------------------------------------------------------------------

# 55. MongoDB Access Pattern

Use:

``` text
Controller
   ↓
Service
   ↓
Mongoose Model
```

Avoid putting large business logic directly into routes.

Bad:

``` js
router.post("/products", async (req, res) => {
  // huge business logic
});
```

Better:

``` text
Route
 ↓
Controller
 ↓
Product Service
 ↓
Product Model
```

------------------------------------------------------------------------

# 56. MongoDB Connection

Startup flow:

``` text
server.js
   ↓
Load environment
   ↓
Connect MongoDB Atlas
   ↓
Start Express
```

If MongoDB cannot connect, the backend should fail clearly rather than
start as if it were healthy.

------------------------------------------------------------------------

# 57. Mongoose Models

Required models:

``` text
User
Business
Product
Sale
Customer
Expense
Inventory
AILog
Report
```

These map directly to the approved MongoDB collections.

------------------------------------------------------------------------

# 58. Model Ownership

Business-scoped models must contain:

``` text
businessId
```

At minimum:

``` text
Product
Sale
Customer
Expense
Inventory
AILog
Report
```

------------------------------------------------------------------------

# 59. ObjectId Validation

Before querying by an ID:

``` text
Validate ObjectId
```

Example:

``` http
GET /api/products/not-an-object-id
```

must return a controlled validation error.

------------------------------------------------------------------------

# 60. MongoDB Transactions

Use transactions when multiple writes must remain consistent.

Primary MVP example:

``` text
Create Completed Sale
+
Update Inventory
```

Flow:

``` text
START TRANSACTION
   ↓
Validate sale
   ↓
Create sale
   ↓
Update inventory
   ↓
COMMIT
```

On failure:

``` text
ROLLBACK
```

Do not use transactions for every simple read.

------------------------------------------------------------------------

# 61. Analytics Performance

Use:

``` text
MongoDB aggregation
Indexes
Business filters
Date filters
```

Important query patterns:

``` text
businessId + soldAt
businessId + expenseDate
businessId + createdAt
```

Do not introduce a separate analytics database for the MVP.

------------------------------------------------------------------------

# 62. Dashboard API

The dashboard should avoid making many unnecessary requests.

Primary analytics endpoint:

``` http
GET /api/analytics
```

It can return:

``` text
Revenue
Sales
Growth
Top Products
Slow Products
Low Stock
Customer Summary
Expense Summary
```

This gives the frontend a single business analytics source.

------------------------------------------------------------------------

# 63. Dashboard Flow

``` text
React Dashboard
      ↓
GET /api/analytics
      ↓
Analytics Service
      ↓
MongoDB
      ↓
Metrics
      ↓
JSON
      ↓
React Dashboard
```

------------------------------------------------------------------------

# 64. Ask KEETY Flow

``` text
React
 ↓
POST /api/ai/ask
 ↓
Auth
 ↓
Business Authorization
 ↓
Validation
 ↓
Analytics
 ↓
Business Context
 ↓
AI Service
 ↓
Gemini
 ↓
Response Validation
 ↓
AI Log
 ↓
JSON
 ↓
React
```

------------------------------------------------------------------------

# 65. Growth Strategy Flow

``` text
React
 ↓
POST /api/ai/growth-strategy
 ↓
Auth
 ↓
Business Authorization
 ↓
Analytics
 ↓
Business Context
 ↓
Gemini
 ↓
Strategy
 ↓
Report
 ↓
AI Log
 ↓
JSON
```

------------------------------------------------------------------------

# 66. Controller vs Service

## Controller

Responsible for:

``` text
HTTP request
Input extraction
Calling service
HTTP response
```

## Service

Responsible for:

``` text
Business logic
Database operations
Calculations
AI context construction
External API calls
```

## Model

Responsible for:

``` text
MongoDB schema
Validation
Indexes
Database representation
```

------------------------------------------------------------------------

# 67. Testing Strategy

## Unit Tests

Test:

``` text
Revenue calculation
Growth calculation
Analytics
Validation
AI context construction
Business logic
```

## Integration Tests

Test:

``` text
MongoDB + Services
Sales + Inventory
Business isolation
AI logs
```

## API Tests

Test:

``` text
Registration
Business creation
Product CRUD
Sales CRUD
Analytics
Ask KEETY
Growth Strategy
```

## Security Tests

Test:

``` text
Invalid JWT
Missing JWT
Unauthorized business
Cross-business access
Invalid ObjectIds
```

------------------------------------------------------------------------

# 68. Critical Security Test

This must never happen:

``` text
User A
  ↓
GET /api/products
  ↓
Business B products
```

Expected:

``` text
User A
  ↓
GET /api/products
  ↓
Only authorized business data
```

------------------------------------------------------------------------

# 69. Critical AI Test

Question:

``` text
Which products should I restock?
```

Backend must:

``` text
1. Identify business.
2. Retrieve inventory.
3. Retrieve relevant sales.
4. Calculate demand/performance.
5. Build business context.
6. Send context to Gemini.
7. Return grounded recommendation.
```

Gemini must not invent inventory numbers.

------------------------------------------------------------------------

# 70. Critical Sales Test

Before:

``` text
Inventory = 10
```

Sale:

``` text
Quantity = 2
```

After:

``` text
Inventory = 8
```

The sale and inventory state must remain consistent.

------------------------------------------------------------------------

# 71. MVP Priorities

## P0 --- Required

``` text
JWT Authentication
Business Module
Product Module
Sales Module
MongoDB Atlas
Analytics Module
AI Module
Gemini Integration
Business Isolation
```

## P1 --- Strong MVP

``` text
Customers
Expenses
Inventory
Reports
AI Logs
```

## Optional

``` text
Cloud Storage
Email
Notifications
```

------------------------------------------------------------------------

# 72. Not Required in MVP

Do not introduce unless an actual requirement appears:

``` text
Redis
Kafka
Microservices
Kubernetes
GraphQL
WebSockets
Dedicated data warehouse
Separate vector database
Complex job queues
Separate backend per business type
```

The approved architecture is modular but intentionally simple.

------------------------------------------------------------------------

# 73. Final API Summary

## Authentication

``` http
POST /api/auth/register
```

## Business

``` http
POST /api/business
GET  /api/business/:id
```

## Products

``` http
POST   /api/products
GET    /api/products
GET    /api/products/:id
PATCH  /api/products/:id
DELETE /api/products/:id
```

## Sales

``` http
POST  /api/sales
GET   /api/sales
GET   /api/sales/:id
PATCH /api/sales/:id
```

## Customers

``` http
POST  /api/customers
GET   /api/customers
GET   /api/customers/:id
PATCH /api/customers/:id
```

## Expenses

``` http
POST   /api/expenses
GET    /api/expenses
GET    /api/expenses/:id
PATCH  /api/expenses/:id
DELETE /api/expenses/:id
```

## Inventory

``` http
GET   /api/inventory
GET   /api/inventory/:productId
PATCH /api/inventory/:productId
```

## Analytics

``` http
GET /api/analytics
```

## AI

``` http
POST /api/ai/ask
POST /api/ai/growth-strategy
```

## Reports

``` http
GET  /api/reports
GET  /api/reports/:id
POST /api/reports
```

------------------------------------------------------------------------

# 74. API-to-Database Mapping

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

POST /api/sales
        ↓
sales
        ↓
inventory

GET /api/analytics
        ↓
sales
products
customers
inventory
expenses

POST /api/ai/ask
        ↓
business data
        ↓
analytics
        ↓
AI context
        ↓
Gemini
        ↓
ai_logs

POST /api/ai/growth-strategy
        ↓
analytics
        ↓
AI context
        ↓
Gemini
        ↓
reports
        ↓
ai_logs
```

------------------------------------------------------------------------

# 75. Final Backend Architecture

``` text
                         KEETY WEB APP
                     React + TailwindCSS
                              │
                              │ REST / JSON
                              ↓
                  ┌────────────────────────┐
                  │   NODE + EXPRESS API   │
                  └────────────┬───────────┘
                               │
          ┌────────────────────┼─────────────────────┐
          │                    │                     │
          ↓                    ↓                     ↓
   AUTH MODULE          BUSINESS MODULE       PRODUCT MODULE
          │                    │                     │
          └────────────────────┼─────────────────────┘
                               ↓
                         SALES MODULE
                               │
             ┌─────────────────┼─────────────────┐
             ↓                 ↓                 ↓
       CUSTOMERS          EXPENSES          INVENTORY
             │                 │                 │
             └─────────────────┼─────────────────┘
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
                      GOOGLE GEMINI API
                               │
                               ↓
              ┌────────────────────────────────┐
              │ Insights                       │
              │ Recommendations                │
              │ Growth Strategies              │
              │ Natural Language Answers       │
              │ Business-Specific Advice       │
              └────────────────────────────────┘
                               │
                               ↓
                       MONGODB ATLAS
                               │
              ┌────────────────┼─────────────────┐
              ↓                ↓                 ↓
           users          businesses          products
              ↓                ↓                 ↓
          customers          sales           inventory
              ↓                ↓                 ↓
          expenses          ai_logs            reports
```

------------------------------------------------------------------------

# 76. Final Rules

### Rule 1

> Node.js + Express.js is the primary backend.

### Rule 2

> MongoDB Atlas is the primary application database.

### Rule 3

> JWT is used for authentication.

### Rule 4

> Every business-owned request must be authorized against the
> authenticated user.

### Rule 5

> Every business-owned database query must be scoped by `businessId`.

### Rule 6

> The frontend never communicates directly with MongoDB.

### Rule 7

> The frontend never receives the Gemini API key.

### Rule 8

> Analytics calculates trusted business numbers.

### Rule 9

> Gemini receives processed, relevant business context rather than
> unrestricted database access.

### Rule 10

> AI recommendations must be grounded in available business data.

### Rule 11

> Sales and inventory must remain consistent.

### Rule 12

> Historical sales must preserve historical product information.

### Rule 13

> Business types share the same backend architecture.

### Rule 14

> Business-specific behavior should primarily be handled through
> business profile, metadata, analytics, and AI context.

### Rule 15

> The MVP should remain modular without unnecessary infrastructure.

------------------------------------------------------------------------

# 77. Final KEETY Backend Principle

``` text
              BUSINESS DATA
                   ↓
             NODE + EXPRESS
                   ↓
          ┌────────┴────────┐
          ↓                 ↓
       ANALYTICS          CRUD APIs
          ↓                 ↓
   VERIFIED METRICS      MONGODB
          ↓
       AI MODULE
          ↓
      GOOGLE GEMINI
          ↓
  INSIGHTS + STRATEGIES
          ↓
        KEETY
```

> **KEETY backend ka main kaam sirf API banana nahi hai. Backend ko
> business data ka trusted control layer banna hai --- MongoDB se
> correct data lena, Analytics se reliable metrics calculate karna,
> Gemini ko relevant context dena, aur business owner ko actionable
> insights aur growth recommendations safely return karna.**
