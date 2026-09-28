# KEETY --- Frontend Architecture & Product UI Specification (MVP)

> **Source of truth:** This frontend specification follows the approved
> KEETY architecture, `backend.md`, and `database.md`, while preserving
> the senior frontend engineering standards from the supplied frontend
> specification.
>
> **Frontend architecture:** React + Tailwind CSS → Node.js + Express
> REST API → MongoDB Atlas + Analytics Module + Google Gemini AI.
>
> **Primary goal:** Build a professional, responsive, accessible,
> production-ready frontend for KEETY --- an AI Business Intelligence
> platform that helps businesses understand their data, identify
> opportunities, and take practical growth actions.

------------------------------------------------------------------------

# 1. Frontend Purpose

KEETY is a multi-business AI platform.

A business owner should be able to:

``` text
Connect / enter business data
        ↓
Understand business performance
        ↓
See important metrics
        ↓
Ask KEETY questions
        ↓
Understand what is happening
        ↓
Receive AI insights
        ↓
Receive growth recommendations
        ↓
Take action
```

The frontend must make this flow simple.

The product should not feel like:

``` text
A generic admin dashboard
```

It should feel like:

``` text
An intelligent business assistant
```

The UI should communicate:

> "KEETY understands my business and helps me decide what to do next."

------------------------------------------------------------------------

# 2. Approved Technology

## Core frontend

``` text
React.js
TypeScript
Tailwind CSS
HTML5
CSS3
```

## Recommended routing

If the project uses Next.js:

``` text
Next.js App Router
```

If the existing project is a standard React application:

``` text
React Router
```

Do not introduce Next.js purely for the sake of using it if the existing
architecture does not require it.

The selected framework must remain consistent across the project.

------------------------------------------------------------------------

# 3. Backend Integration

The frontend communicates only with the backend.

``` text
React / Next.js
       ↓
REST API
       ↓
Node.js + Express
       ↓
MongoDB Atlas
```

For AI:

``` text
Frontend
   ↓
POST /api/ai/ask
   ↓
Express
   ↓
Analytics / AI Module
   ↓
Google Gemini
   ↓
Response
   ↓
Frontend
```

The frontend must never communicate directly with:

``` text
MongoDB
Gemini API
```

The Gemini API key must never exist in client-side code.

------------------------------------------------------------------------

# 4. Product Users

The primary user is a:

``` text
Business Owner
```

The product should also support future roles such as:

``` text
OWNER
ADMIN
MEMBER
```

The frontend must respect permissions returned by the backend.

Do not use frontend-only authorization as a security boundary.

------------------------------------------------------------------------

# 5. Supported Business Types

The frontend must support:

``` text
CLOTHING
RESTAURANT
SALON
GROCERY_RETAIL
ELECTRONICS
OTHER
```

Do not build completely separate applications for each business type.

Use:

``` text
Business Type
      ↓
Business Context
      ↓
Relevant UI / Labels / Metadata
      ↓
Shared Components
```

------------------------------------------------------------------------

# 6. Core Product Areas

The MVP frontend should contain:

``` text
Authentication
Business Onboarding
Dashboard
Products
Sales
Customers
Expenses
Inventory
Analytics
Ask KEETY
Growth Strategy
Reports & Insights
Business Settings
```

The navigation should remain simple.

------------------------------------------------------------------------

# 7. Recommended Route Structure

``` text
/
├── login
├── register
├── onboarding
│
└── app
    ├── dashboard
    ├── products
    ├── sales
    ├── customers
    ├── expenses
    ├── inventory
    ├── analytics
    ├── ask-keety
    ├── growth
    ├── reports
    └── settings
```

If using Next.js App Router:

``` text
app/
├── (auth)/
│   ├── login/
│   └── register/
│
├── onboarding/
│
└── (dashboard)/
    ├── layout.tsx
    ├── dashboard/
    ├── products/
    ├── sales/
    ├── customers/
    ├── expenses/
    ├── inventory/
    ├── analytics/
    ├── ask-keety/
    ├── growth/
    ├── reports/
    └── settings/
```

------------------------------------------------------------------------

# 8. Global Application Layout

The authenticated application should use a consistent shell:

``` text
┌────────────────────────────────────────────────────┐
│ Top Bar                                             │
│ Business selector | Search | Notifications | User  │
├───────────────┬────────────────────────────────────┤
│               │                                    │
│ Sidebar       │ Main Content                       │
│               │                                    │
│ Dashboard     │                                    │
│ Products      │                                    │
│ Sales         │                                    │
│ Customers     │                                    │
│ Expenses      │                                    │
│ Inventory     │                                    │
│ Analytics     │                                    │
│ Ask KEETY     │                                    │
│ Growth        │                                    │
│ Reports       │                                    │
│ Settings      │                                    │
│               │                                    │
└───────────────┴────────────────────────────────────┘
```

On mobile:

``` text
Top Bar
   ↓
Main Content
   ↓
Mobile Navigation / Drawer
```

Do not simply shrink the desktop sidebar.

Design mobile navigation intentionally.

------------------------------------------------------------------------

# 9. Design Direction

KEETY should feel:

``` text
Professional
Modern
Intelligent
Trustworthy
Calm
Data-driven
Action-oriented
```

Avoid making it feel:

``` text
Overly futuristic
Overly decorative
Like a gaming dashboard
Like a crypto dashboard
Like a generic admin template
```

The interface should prioritize business clarity.

------------------------------------------------------------------------

# 10. Design System

Create reusable design tokens for:

``` text
Colors
Typography
Spacing
Radius
Shadows
Borders
Transitions
```

Example conceptual tokens:

``` text
Primary
Background
Surface
Muted
Text
Text Secondary
Success
Warning
Danger
Info
```

Do not scatter arbitrary colors throughout components.

------------------------------------------------------------------------

# 11. Typography

Use a consistent typography scale.

Recommended hierarchy:

``` text
Page Title
Section Heading
Card Heading
Body
Secondary Text
Caption
```

Example:

``` text
Page Title      → 28–36px
Section Heading → 20–24px
Card Heading    → 16–18px
Body            → 14–16px
Caption         → 12–14px
```

Exact values may be adjusted to the visual design.

Consistency is more important than individual numbers.

------------------------------------------------------------------------

# 12. Core Reusable Components

Create reusable primitives such as:

``` text
Button
Input
Textarea
Select
DatePicker
Card
MetricCard
Badge
Modal
Dropdown
Tabs
Tooltip
Avatar
Skeleton
Toast
Alert
EmptyState
ErrorState
PageHeader
DataTable
Pagination
SearchInput
ConfirmDialog
```

Do not duplicate these patterns across pages.

------------------------------------------------------------------------

# 13. Business Components

Create reusable business-oriented components:

``` text
RevenueCard
SalesCard
GrowthCard
TopProductsCard
LowStockCard
CustomerSummaryCard
ExpenseSummaryCard
AIInsightCard
RecommendationCard
ReportCard
BusinessProfileCard
```

These components should consume typed data.

------------------------------------------------------------------------

# 14. Dashboard

The Dashboard is the primary business overview.

The goal is:

> Help the owner understand the business within seconds.

Recommended sections:

``` text
Page Header
      ↓
Business Greeting
      ↓
Key Metrics
      ↓
Revenue / Sales Trend
      ↓
Top Products
      ↓
Low Stock
      ↓
Customer / Expense Summary
      ↓
AI Insights
      ↓
Recommended Actions
```

------------------------------------------------------------------------

# 15. Dashboard Metrics

The frontend consumes:

``` http
GET /api/analytics
```

Possible metrics:

``` text
Revenue
Sales Count
Average Order Value
Growth %
Top Products
Slow Products
Low Stock Products
Customer Summary
Expense Summary
```

Example:

``` text
Revenue
₹1,20,000
↑ 20%

Sales
340
↑ 12%

Average Order Value
₹352.94

Low Stock
4 products
```

The frontend must not calculate authoritative business metrics
independently if the backend already provides them.

------------------------------------------------------------------------

# 16. Dashboard Insight Hierarchy

Prioritize information in this order:

``` text
1. What happened?
2. Why does it matter?
3. What should I do?
```

Example:

``` text
Revenue increased 20%.

Why:
Black Hoodie sales increased significantly.

Action:
Review stock and consider increasing availability.
```

This is more useful than displaying numbers without context.

------------------------------------------------------------------------

# 17. Dashboard Loading State

When `/api/analytics` is loading:

Use skeletons for:

``` text
Metric cards
Charts
Product lists
Insight cards
```

Avoid:

``` text
Loading...
```

across the entire dashboard.

Maintain layout stability while data loads.

------------------------------------------------------------------------

# 18. Dashboard Empty State

If the business has no data:

``` text
Your business data is ready.

Add your first product or record your first sale to start seeing insights.
```

Primary action:

``` text
Add Product
```

Secondary action:

``` text
Record Sale
```

Do not display empty charts with misleading zeros unless the UI clearly
communicates that there is no data yet.

------------------------------------------------------------------------

# 19. Dashboard Error State

If analytics fails:

``` text
We couldn't load your business analytics.

Please try again.
```

Actions:

``` text
Retry
```

Do not show a blank dashboard.

------------------------------------------------------------------------

# 20. Products Page

Route:

``` text
/app/products
```

Purpose:

``` text
View products
Create products
Edit products
Deactivate products
Search products
Filter products
```

API:

``` http
POST   /api/products
GET    /api/products
GET    /api/products/:id
PATCH  /api/products/:id
DELETE /api/products/:id
```

------------------------------------------------------------------------

# 21. Products UI

Recommended:

``` text
Products
├── Page Header
│   ├── Search
│   ├── Filters
│   └── Add Product
│
├── Product Table / Cards
│   ├── Name
│   ├── SKU
│   ├── Category
│   ├── Price
│   ├── Status
│   └── Actions
│
└── Pagination
```

On mobile, transform the table into cards or a horizontally scrollable
structure where appropriate.

------------------------------------------------------------------------

# 22. Product Form

Fields:

``` text
Name
SKU
Category
Description
Price
Cost Price
Unit
Metadata
```

The UI may expose business-specific metadata.

Examples:

### Clothing

``` text
Size
Color
```

### Restaurant

``` text
Cuisine
```

### Electronics

``` text
Brand
Warranty
```

Do not make unrelated fields mandatory.

------------------------------------------------------------------------

# 23. Product Validation

Frontend validation should provide immediate feedback.

Examples:

``` text
Name → required
Price → >= 0
Cost Price → >= 0
SKU → valid format when provided
```

But backend validation remains authoritative.

------------------------------------------------------------------------

# 24. Sales Page

Route:

``` text
/app/sales
```

Purpose:

``` text
View sales
Record sale
View sale details
Filter sales
```

API:

``` http
POST  /api/sales
GET   /api/sales
GET   /api/sales/:id
PATCH /api/sales/:id
```

------------------------------------------------------------------------

# 25. Record Sale UI

Example:

``` text
New Sale

Customer
Products
Quantity
Unit Price
Discount
Tax
Payment Method

Subtotal
Total

[Complete Sale]
```

The frontend may display calculated previews, but the backend remains
responsible for authoritative totals.

------------------------------------------------------------------------

# 26. Sales Loading and Submission

While creating a sale:

``` text
Complete Sale → loading
```

Disable duplicate submission.

Example:

``` text
Completing sale...
```

After success:

``` text
Sale recorded successfully.
```

Then refresh relevant:

``` text
Sales
Inventory
Analytics
```

------------------------------------------------------------------------

# 27. Customers Page

Route:

``` text
/app/customers
```

Purpose:

``` text
View customers
Add customer
Edit customer
Understand customer value
```

Display:

``` text
Name
Email
Phone
Total Orders
Total Spent
Last Purchase
```

Do not require email and phone simultaneously.

------------------------------------------------------------------------

# 28. Expenses Page

Route:

``` text
/app/expenses
```

Display:

``` text
Category
Description
Amount
Date
```

Useful summary:

``` text
Total Expenses
Expense Trend
Largest Categories
```

API:

``` http
POST   /api/expenses
GET    /api/expenses
GET    /api/expenses/:id
PATCH  /api/expenses/:id
DELETE /api/expenses/:id
```

------------------------------------------------------------------------

# 29. Inventory Page

Route:

``` text
/app/inventory
```

Display:

``` text
Product
Current Quantity
Reserved Quantity
Reorder Level
Stock Status
```

Statuses:

``` text
IN STOCK
LOW STOCK
OUT OF STOCK
```

Use clear visual indicators but do not rely only on color.

------------------------------------------------------------------------

# 30. Low Stock UI

Example:

``` text
Low Stock

Black Hoodie
4 remaining
Reorder level: 5

[View Product]
```

For high-demand + low-stock products, the UI can connect inventory
information with AI recommendations.

------------------------------------------------------------------------

# 31. Analytics Page

Route:

``` text
/app/analytics
```

Purpose:

``` text
Deep business understanding
```

Recommended sections:

``` text
Revenue
Sales
Growth
Products
Customers
Expenses
Inventory
```

Provide date filtering:

``` text
7 Days
30 Days
90 Days
This Month
Previous Month
Custom
```

The backend remains the source of truth for calculations.

------------------------------------------------------------------------

# 32. Analytics Charts

Potential charts:

``` text
Revenue Trend
Sales Trend
Product Performance
Expense Trend
Customer Trend
```

Charts must:

-   Have meaningful labels.
-   Show empty states.
-   Handle missing data.
-   Be responsive.
-   Provide accessible summaries where appropriate.
-   Avoid visual overload.

Do not add charts simply because a dashboard can contain charts.

Every chart should answer a business question.

------------------------------------------------------------------------

# 33. Ask KEETY

Route:

``` text
/app/ask-keety
```

This is one of the most important parts of the product.

The experience should feel like:

``` text
Business Assistant
```

not:

``` text
Generic AI Chatbot
```

------------------------------------------------------------------------

# 34. Ask KEETY UI

Recommended layout:

``` text
┌─────────────────────────────────────────────┐
│ Ask KEETY                                   │
│ Understand your business with AI            │
├─────────────────────────────────────────────┤
│                                             │
│ Suggested Questions                         │
│                                             │
│ "Which products should I restock?"          │
│ "Why did sales change this month?"          │
│ "How can I improve revenue?"                │
│                                             │
├─────────────────────────────────────────────┤
│ Conversation                                │
│                                             │
│ User question                               │
│ KEETY answer                                │
│ Insights                                    │
│ Recommendations                             │
│                                             │
├─────────────────────────────────────────────┤
│ Ask KEETY...                         [Send] │
└─────────────────────────────────────────────┘
```

------------------------------------------------------------------------

# 35. Ask KEETY API

``` http
POST /api/ai/ask
```

Request:

``` json
{
  "question": "Which products should I restock?"
}
```

The frontend sends only the user question.

The backend constructs authoritative business context.

------------------------------------------------------------------------

# 36. AI Loading State

AI generation needs a special loading state.

Use:

``` text
KEETY is analyzing your business...
```

Optional staged UI:

``` text
Understanding your question
Analyzing business data
Preparing recommendations
```

Do not falsely claim a backend action happened unless the API actually
reports it.

------------------------------------------------------------------------

# 37. AI Response UI

Separate:

``` text
Answer
Insights
Recommendations
```

Example:

``` text
Answer
Your Black Hoodie is currently one of your strongest products.

Insights
• High sales volume
• Inventory is below reorder level

Recommended Action
Restock Black Hoodie

Priority
HIGH
```

This is easier to scan than one large AI paragraph.

------------------------------------------------------------------------

# 38. AI Trust UI

When appropriate, show the data basis:

``` text
Based on:
• Recent sales
• Current inventory
• Selected date range
```

This helps users understand why KEETY produced the recommendation.

Do not expose internal prompts or secrets.

------------------------------------------------------------------------

# 39. AI Error State

If Gemini fails:

``` text
KEETY couldn't generate an answer right now.

Please try again.
```

Actions:

``` text
Try Again
```

Do not show:

``` text
Gemini API error 500
```

to normal users.

------------------------------------------------------------------------

# 40. Growth Strategy Page

Route:

``` text
/app/growth
```

Purpose:

``` text
Help the owner turn business data into practical growth actions.
```

Input:

``` text
What is your goal?
```

Examples:

``` text
Increase monthly revenue
Get more repeat customers
Improve product sales
Reduce inventory risk
Improve profitability
```

API:

``` http
POST /api/ai/growth-strategy
```

------------------------------------------------------------------------

# 41. Growth Strategy UI

Recommended structure:

``` text
Growth Strategy

Goal
[ Increase monthly revenue ]

Current Situation
[ Business summary ]

KEETY's Strategy

1. Opportunity
2. Why it matters
3. Recommended action
4. Expected business area affected
5. Priority

[Save Report]
```

Avoid presenting AI estimates as guaranteed outcomes.

Use language such as:

``` text
Potential opportunity
Recommended action
Based on current data
```

------------------------------------------------------------------------

# 42. Reports & Insights

Route:

``` text
/app/reports
```

Display:

``` text
Report title
Type
Period
Summary
Key insights
Recommendations
Created date
```

API:

``` http
GET  /api/reports
GET  /api/reports/:id
POST /api/reports
```

------------------------------------------------------------------------

# 43. Report Detail

Example:

``` text
Monthly Business Report
September 2026

Summary
...

Key Metrics
Revenue
Sales
Growth
Expenses

Key Insights
...

Recommendations
...

Business Data Period
...
```

Reports should clearly distinguish:

``` text
Measured data
AI interpretation
Recommendations
```

------------------------------------------------------------------------

# 44. Authentication UI

Routes:

``` text
/login
/register
```

Login fields:

``` text
Email
Password
```

Register fields:

``` text
Name
Email
Password
```

States:

``` text
Idle
Submitting
Success
Validation Error
Authentication Error
Network Error
```

------------------------------------------------------------------------

# 45. Session Handling

The frontend should maintain authenticated state.

Possible states:

``` text
CHECKING_SESSION
AUTHENTICATED
UNAUTHENTICATED
```

Protected routes should not flash private UI before authentication state
is known.

------------------------------------------------------------------------

# 46. Logout

Logout should:

``` text
Clear local authentication state
Clear cached business data where appropriate
Return user to login
```

Do not leave sensitive business data visible after logout.

------------------------------------------------------------------------

# 47. Onboarding

First-time users should be guided through:

``` text
Create Business
      ↓
Choose Business Type
      ↓
Business Name
      ↓
Currency
      ↓
Timezone
      ↓
Add First Product
      ↓
Record First Sale
      ↓
See Dashboard
```

Do not overwhelm new users with every optional setting.

------------------------------------------------------------------------

# 48. Business Onboarding by Type

Business type selection:

``` text
What kind of business do you run?
```

Options:

``` text
Clothing
Restaurant
Salon
Grocery / Retail
Electronics
Other
```

After selection, adapt terminology.

Example:

``` text
Clothing → Products
Restaurant → Menu Items
Salon → Services
```

Internally, the backend can still use the generic Product model.

------------------------------------------------------------------------

# 49. Business Selector

If a user can access multiple businesses, the top navigation should
support:

``` text
Business Selector
```

Example:

``` text
My Clothing Store ▼
```

Switching business must:

``` text
Update active business context
Refresh business data
Refresh analytics
Refresh AI context
```

Never mix data from two businesses in the same UI state.

------------------------------------------------------------------------

# 50. API Client Architecture

Do not scatter raw `fetch()` calls throughout components.

Recommended:

``` text
src/
├── api/
│   ├── client.ts
│   ├── auth.api.ts
│   ├── business.api.ts
│   ├── products.api.ts
│   ├── sales.api.ts
│   ├── customers.api.ts
│   ├── expenses.api.ts
│   ├── inventory.api.ts
│   ├── analytics.api.ts
│   ├── ai.api.ts
│   └── reports.api.ts
```

Example:

``` ts
getAnalytics()
getProducts()
createProduct()
createSale()
askKeety()
getGrowthStrategy()
getReports()
```

------------------------------------------------------------------------

# 51. API Response Types

Create shared frontend types for backend responses.

Example:

``` ts
interface ApiResponse<T> {
  success: boolean;
  data: T;
}
```

Error:

``` ts
interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}
```

Do not use:

``` ts
any
```

for core API responses.

------------------------------------------------------------------------

# 52. Frontend Domain Types

Recommended:

``` text
User
Business
Product
Sale
SaleItem
Customer
Expense
InventoryItem
Analytics
AIResponse
Insight
Recommendation
Report
```

Types should correspond closely to the backend/database contracts.

------------------------------------------------------------------------

# 53. State Management

Keep state simple.

Use local component state for:

``` text
Form values
Modal visibility
UI toggles
Temporary filters
```

Use shared/application state for:

``` text
Authenticated user
Active business
Session
Global UI state
```

Use a dedicated server-state solution only if the project actually needs
it.

Do not introduce complex state management simply because it is popular.

------------------------------------------------------------------------

# 54. Server State

API data should be treated as server state.

Examples:

``` text
Products
Sales
Analytics
Customers
Inventory
Reports
```

Avoid duplicating the same server data in multiple unrelated state
stores.

Prefer a consistent data-fetching/cache layer.

------------------------------------------------------------------------

# 55. Loading Architecture

Every API-backed page should have:

``` text
Loading
Success
Empty
Error
```

Minimum state model:

``` text
loading
data
error
```

Do not allow impossible UI states such as:

``` text
loading = false
data = null
error = null
```

without an intentional empty state.

------------------------------------------------------------------------

# 56. Forms Architecture

Forms should have:

``` text
Initial
Editing
Submitting
Success
Error
```

On submit:

``` text
Disable duplicate submit
Show progress
Return validation errors
Show success feedback
Refresh relevant data
```

------------------------------------------------------------------------

# 57. Accessibility

Use semantic HTML.

Prefer:

``` html
<button>
<a>
<form>
<label>
<nav>
<main>
<section>
<header>
```

over generic clickable `div`s.

Every form field needs a meaningful label.

Buttons need understandable accessible names.

------------------------------------------------------------------------

# 58. Keyboard Accessibility

Users should be able to:

``` text
Navigate
Open menus
Close modals
Submit forms
Move through fields
Access tables
Use AI input
```

with a keyboard.

Modal dialogs must manage focus appropriately.

------------------------------------------------------------------------

# 59. Color Accessibility

Do not communicate state only through color.

Bad:

``` text
Red = low stock
```

Better:

``` text
Low Stock
[warning icon] 4 remaining
```

Use:

``` text
Text
Icon
Color
```

together when appropriate.

------------------------------------------------------------------------

# 60. Responsive Design

The frontend must work across:

``` text
Mobile
Tablet
Laptop
Desktop
Large Desktop
```

Important responsive areas:

``` text
Sidebar
Tables
Charts
Cards
Forms
Modals
AI chat
Navigation
```

Mobile is not a smaller desktop.

------------------------------------------------------------------------

# 61. Mobile Dashboard

On mobile:

``` text
Metrics
 ↓
Priority Insight
 ↓
Low Stock
 ↓
Top Products
 ↓
Recommendations
```

Avoid showing too many cards in a single horizontal row.

------------------------------------------------------------------------

# 62. Mobile Tables

For dense data:

``` text
Desktop → Table
Mobile  → Card / Scroll / Priority Columns
```

Do not make every mobile table unusably narrow.

------------------------------------------------------------------------

# 63. Performance

Follow production frontend standards.

Check:

``` text
Bundle size
Unnecessary JavaScript
Unnecessary re-renders
Large dependencies
Images
Fonts
Lazy loading
Dynamic imports
API waterfalls
Caching
```

Relevant metrics:

``` text
LCP
CLS
INP
TTFB
```

Do not optimize without evidence.

------------------------------------------------------------------------

# 64. React Performance

Avoid:

``` text
Unnecessary state
Unnecessary useEffect
Unnecessary useMemo
Unnecessary useCallback
```

Do not use memoization everywhere.

Prefer clean data flow.

Optimize actual bottlenecks.

------------------------------------------------------------------------

# 65. Component Boundaries

A component should have a clear responsibility.

Avoid:

``` text
Dashboard.tsx
```

containing:

``` text
API calls
Analytics calculations
AI prompts
Huge JSX
Form logic
Modal logic
Table logic
```

Instead separate:

``` text
DashboardPage
AnalyticsSummary
MetricCard
RevenueChart
TopProducts
LowStock
AIInsights
```

------------------------------------------------------------------------

# 66. Frontend Business Logic

The frontend can handle:

``` text
Presentation
Interaction
Form validation
UI calculations
Formatting
```

The backend must remain responsible for:

``` text
Authoritative business metrics
Authorization
Business ownership
Sales totals
Inventory updates
AI context
AI calls
```

Do not move backend business rules into the frontend.

------------------------------------------------------------------------

# 67. Money Formatting

The frontend should format money according to:

``` text
business.currency
```

Example:

``` text
INR → ₹1,20,000
USD → $1,200
EUR → €1,200
```

Database/API values remain numeric.

Do not send:

``` text
₹1,20,000
```

as the backend numeric value.

------------------------------------------------------------------------

# 68. Date Formatting

Use the business timezone where appropriate.

Backend provides:

``` text
Date
Business timezone
```

Frontend handles display formatting.

Examples:

``` text
Sep 28, 2026
28 Sep 2026
Today
Yesterday
```

Use one consistent date style across the application.

------------------------------------------------------------------------

# 69. Search

Search UI should:

``` text
Debounce where appropriate
Show loading state
Handle no results
Handle errors
Preserve filters
```

Example:

``` text
Search products...
```

Empty search results:

``` text
No products found.

Try another search or clear your filters.
```

------------------------------------------------------------------------

# 70. Notifications / Toasts

Use toasts for lightweight feedback:

``` text
Product created
Sale recorded
Report generated
Changes saved
```

Do not use toasts for information that requires sustained attention.

For important failures, use inline error states.

------------------------------------------------------------------------

# 71. Confirmation Dialogs

Use confirmation for destructive or consequential actions:

``` text
Delete Product
Delete Expense
Deactivate Product
```

Example:

``` text
Delete "Black Hoodie"?

Historical sales will remain available.

[Cancel] [Delete]
```

Avoid unnecessary confirmation dialogs for harmless actions.

------------------------------------------------------------------------

# 72. Product Deletion UX

Because historical sales must remain stable, the UI should prefer:

``` text
Deactivate Product
```

when appropriate.

A product can become:

``` text
ACTIVE
INACTIVE
```

while historical sales remain available.

------------------------------------------------------------------------

# 73. AI Recommendations UI

Recommendations should contain:

``` text
Title
Why it matters
Priority
Action
```

Example:

``` text
Restock Black Hoodie

Why:
Strong recent sales + low inventory.

Priority:
HIGH

Action:
Review stock and reorder availability.
```

Do not present recommendations as guaranteed outcomes.

------------------------------------------------------------------------

# 74. AI Confidence / Evidence

Avoid fake numeric confidence such as:

``` text
97% confidence
```

unless the backend actually provides a meaningful confidence measure.

Prefer:

``` text
Based on recent sales and current inventory
```

------------------------------------------------------------------------

# 75. AI Conversation History

If the backend later supports persisted conversations, the frontend can
display:

``` text
Recent Questions
```

For the MVP, do not build a complex chat-history system unless required
by the backend.

The current core API is:

``` http
POST /api/ai/ask
```

------------------------------------------------------------------------

# 76. Reports UI

Reports should be easy to scan.

Use:

``` text
Report Summary
Key Metrics
Insights
Recommendations
Period
```

Provide:

``` text
View
```

and, if later supported:

``` text
Export
```

Do not build PDF/export infrastructure unless the backend requirement
exists.

------------------------------------------------------------------------

# 77. Error Boundary

Use application-level error boundaries where supported.

An unexpected UI error should produce:

``` text
Something went wrong.

Try refreshing the page.
```

with:

``` text
Refresh
```

Do not expose stack traces to users.

------------------------------------------------------------------------

# 78. Route-Level Errors

Unknown route:

``` text
Page not found
```

Unauthorized:

``` text
You don't have access to this business.
```

Server error:

``` text
Something went wrong on our side.
```

Keep error messaging human-readable.

------------------------------------------------------------------------

# 79. SEO

KEETY is primarily an authenticated SaaS application.

SEO priority:

``` text
Public marketing pages → High
Authenticated dashboard → Low
```

For public pages, implement:

``` text
Title
Description
Open Graph
Semantic headings
Canonical URL
Robots
Sitemap
```

Do not waste engineering effort optimizing private dashboard pages for
search engines.

------------------------------------------------------------------------

# 80. Security

Never place in frontend code:

``` text
GEMINI_API_KEY
MONGODB_URI
JWT_SECRET
Other server secrets
```

Only public configuration should use client-side environment variables.

Never assume:

``` text
Hidden button = authorization
```

Backend authorization remains authoritative.

------------------------------------------------------------------------

# 81. Frontend Environment Variables

Example:

``` env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

or for React:

``` env
VITE_API_URL=http://localhost:5000/api
```

Only expose values that are genuinely safe for the browser.

------------------------------------------------------------------------

# 82. Suggested Frontend Structure

``` text
frontend/
│
├── src/
│   ├── app/
│   │   ├── routes/
│   │   └── layouts/
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── sales/
│   │   ├── customers/
│   │   ├── expenses/
│   │   ├── inventory/
│   │   ├── analytics/
│   │   ├── ai/
│   │   └── reports/
│   │
│   ├── pages/
│   │   ├── auth/
│   │   ├── onboarding/
│   │   └── app/
│   │
│   ├── api/
│   │   ├── client.ts
│   │   ├── auth.api.ts
│   │   ├── business.api.ts
│   │   ├── products.api.ts
│   │   ├── sales.api.ts
│   │   ├── customers.api.ts
│   │   ├── expenses.api.ts
│   │   ├── inventory.api.ts
│   │   ├── analytics.api.ts
│   │   ├── ai.api.ts
│   │   └── reports.api.ts
│   │
│   ├── hooks/
│   ├── types/
│   ├── lib/
│   ├── utils/
│   └── styles/
│
├── public/
├── .env
├── .env.example
├── package.json
└── README.md
```

Adapt the exact structure to the chosen React/Next.js setup rather than
forcing duplicate concepts.

------------------------------------------------------------------------

# 83. Suggested Hooks

Reusable hooks may include:

``` text
useAuth
useBusiness
useProducts
useSales
useCustomers
useExpenses
useInventory
useAnalytics
useAskKeety
useGrowthStrategy
useReports
```

Hooks should abstract server-state interaction where useful.

Do not create a custom hook for every tiny operation without a real
reuse benefit.

------------------------------------------------------------------------

# 84. API and UI Contract

Frontend types should mirror the backend contracts.

Example:

``` text
GET /api/analytics
       ↓
AnalyticsResponse
       ↓
Dashboard
```

Example:

``` text
POST /api/ai/ask
       ↓
AIResponse
       ↓
AskKEETY UI
```

If backend response structure changes, update the frontend API types and
affected components together.

------------------------------------------------------------------------

# 85. No Direct Database Knowledge in Components

Components should not know:

``` text
MongoDB
Mongoose
Collection names
Database queries
```

Bad:

``` text
Dashboard → MongoDB
```

Correct:

``` text
Dashboard
   ↓
Analytics API
   ↓
Backend
   ↓
MongoDB
```

------------------------------------------------------------------------

# 86. No Gemini Logic in Components

Components should not contain:

``` text
Gemini prompt
Gemini API key
Gemini SDK calls
```

Correct:

``` text
AskKeety UI
   ↓
askKeety()
   ↓
POST /api/ai/ask
```

------------------------------------------------------------------------

# 87. Data Refresh Strategy

After mutation:

``` text
Create Product
    ↓
Refresh Products
```

``` text
Create Sale
    ↓
Refresh Sales
Refresh Inventory
Refresh Analytics
```

``` text
Create Expense
    ↓
Refresh Expenses
Refresh Analytics
```

Do not reload the entire application after every small mutation.

Refresh only affected server state.

------------------------------------------------------------------------

# 88. Optimistic Updates

Use optimistic updates only where rollback is simple and safe.

Good candidates:

``` text
UI preference
Non-critical toggle
```

Be cautious with:

``` text
Sales
Inventory
Financial data
```

For financial/business-critical data, prefer confirmed backend
responses.

------------------------------------------------------------------------

# 89. Financial Data UI

Business-critical data should prioritize accuracy over animation.

For:

``` text
Revenue
Sales
Expenses
Inventory
```

do not show optimistic values as final facts unless confirmed by the
backend.

------------------------------------------------------------------------

# 90. Accessibility for AI

Ask KEETY should support:

``` text
Keyboard input
Accessible send button
Readable response structure
Focus management
Screen-reader-friendly status updates
```

When AI starts generating:

``` text
aria-live
```

or an equivalent accessible status mechanism can announce the state
appropriately.

Do not overuse live regions.

------------------------------------------------------------------------

# 91. Reduced Motion

Respect:

``` text
prefers-reduced-motion
```

Animations should be reduced or disabled where appropriate.

The application must remain fully usable without animation.

------------------------------------------------------------------------

# 92. Production Quality Checklist

Before completion:

``` text
Architecture
✓ scalable
✓ understandable
✓ modular

React
✓ clean components
✓ correct hooks
✓ no unnecessary state
✓ no unnecessary effects

TypeScript
✓ strong API types
✓ no unnecessary any
✓ reusable domain types

UI
✓ consistent spacing
✓ consistent typography
✓ consistent components
✓ intentional visual hierarchy

Responsive
✓ mobile
✓ tablet
✓ desktop

Accessibility
✓ semantic HTML
✓ keyboard navigation
✓ labels
✓ focus states
✓ contrast

Data
✓ loading states
✓ empty states
✓ error states
✓ retry states

API
✓ centralized API client
✓ typed responses
✓ authentication
✓ business context
✓ error handling

AI
✓ loading state
✓ structured response
✓ error handling
✓ evidence/context visibility
✓ no exposed API key

Security
✓ no secrets in client
✓ no frontend-only authorization assumptions

Performance
✓ reasonable bundle
✓ no unnecessary API calls
✓ no obvious render bottlenecks
✓ optimized images

Production
✓ build works
✓ typecheck works
✓ lint works
✓ routes work
```

------------------------------------------------------------------------

# 93. 10x Scale Test

Imagine:

``` text
10x users
10x businesses
10x products
10x sales
10x reports
10x AI questions
```

The frontend architecture should still remain maintainable.

Avoid:

``` text
Huge components
Duplicated API logic
Duplicated UI
Global state for everything
Hard-coded business rules
```

------------------------------------------------------------------------

# 94. Real User Test

Pretend you are a new business owner.

Ask:

``` text
Do I understand the dashboard immediately?

Do I know what my most important metric is?

Do I understand what changed?

Do I understand why it changed?

Do I know what KEETY recommends?

Can I easily add my products?

Can I record a sale?

Can I ask KEETY a question?

Can I understand the answer?

Do errors explain what I should do?

Does the product feel trustworthy?
```

Fix friction before adding more features.

------------------------------------------------------------------------

# 95. Senior Frontend Engineering Standard

The frontend must optimize for:

``` text
Works
+
Scales
+
Maintainable
+
Accessible
+
Responsive
+
Performant
+
Secure
+
Professional
```

Do not optimize for:

``` text
More components
More animations
More libraries
More state management
More abstraction
```

Use the simplest architecture that satisfies the product requirements.

------------------------------------------------------------------------

# 96. Final KEETY Frontend Architecture

``` text
                         KEETY FRONTEND
                    React + TypeScript
                            │
                            ↓
                    Application Router
                            │
          ┌─────────────────┼──────────────────┐
          ↓                 ↓                  ↓
       Auth UI          Dashboard UI       Business UI
          │                 │                  │
          │                 ↓                  │
          │            Analytics UI            │
          │                 │                  │
          │                 ↓                  │
          │            AI Insights             │
          │                 │                  │
          └─────────────────┼──────────────────┘
                            ↓
                       API CLIENT
                            │
                            ↓
                  NODE + EXPRESS BACKEND
                            │
             ┌──────────────┼──────────────┐
             ↓              ↓              ↓
         MongoDB        Analytics        Gemini
         Atlas            Module           AI
             │              │              │
             └──────────────┼──────────────┘
                            ↓
                    KEETY Business Data
                            │
                            ↓
                 Insights + Recommendations
                            │
                            ↓
                      KEETY FRONTEND
```

------------------------------------------------------------------------

# 97. Final User Journey

``` text
LANDING / LOGIN
      ↓
REGISTER
      ↓
BUSINESS ONBOARDING
      ↓
CHOOSE BUSINESS TYPE
      ↓
ADD BUSINESS INFORMATION
      ↓
ADD PRODUCTS
      ↓
RECORD SALES
      ↓
DASHBOARD
      ↓
SEE BUSINESS METRICS
      ↓
SEE AI INSIGHTS
      ↓
ASK KEETY
      ↓
GET BUSINESS-SPECIFIC ANSWER
      ↓
OPEN GROWTH STRATEGY
      ↓
GET ACTIONABLE RECOMMENDATIONS
      ↓
VIEW REPORTS
      ↓
TAKE BUSINESS ACTION
```

------------------------------------------------------------------------

# 98. Final Product Principle

> **KEETY frontend ka purpose sirf business data ko display karna nahi
> hai. Frontend ko raw business information ko simple, understandable,
> actionable experience mein convert karna hai.**

The user should move naturally from:

``` text
"What is happening?"
```

to:

``` text
"Why is it happening?"
```

to:

``` text
"What should I do next?"
```

That is the core frontend experience of KEETY.

------------------------------------------------------------------------

# 99. Final Rules

### Rule 1

> React + TypeScript + Tailwind CSS is the core frontend stack.

### Rule 2

> Frontend communicates with the Node.js + Express backend through REST
> APIs.

### Rule 3

> Frontend never communicates directly with MongoDB.

### Rule 4

> Frontend never communicates directly with Gemini.

### Rule 5

> No server secrets are exposed to the browser.

### Rule 6

> Backend remains the source of truth for business metrics,
> authorization, sales totals, inventory, and AI context.

### Rule 7

> Every API-backed screen must have loading, success, empty, and error
> states.

### Rule 8

> Every business-critical mutation must be confirmed by the backend
> before being treated as final.

### Rule 9

> Business types share reusable frontend architecture.

### Rule 10

> UI differences between business types should be intentional and
> data-driven.

### Rule 11

> Accessibility is part of the implementation, not a later enhancement.

### Rule 12

> Mobile, tablet, and desktop are first-class experiences.

### Rule 13

> AI output must be presented as insights and recommendations, not as
> unexplained text.

### Rule 14

> The frontend should make KEETY's business intelligence understandable
> within seconds.

### Rule 15

> Do not build complexity that the MVP does not need.

------------------------------------------------------------------------

# 100. Final KEETY Frontend Standard

The frontend is complete only when:

``` text
Architecture is scalable
+
Components are reusable
+
TypeScript is strong
+
API integration is clean
+
Authentication works
+
Business isolation is respected
+
Dashboard is understandable
+
Analytics are readable
+
Products / Sales / Customers / Expenses / Inventory work
+
AI interaction feels natural
+
AI loading/error states work
+
Reports are readable
+
Responsive behavior is polished
+
Accessibility is considered
+
Performance is considered
+
Security is respected
+
The product feels professional
```

Most importantly:

> **Do not optimize for "it works."**

Optimize for:

> **It works + it scales + it is maintainable + it is accessible + it is
> performant + it feels professional + it helps the business owner make
> better decisions.**
