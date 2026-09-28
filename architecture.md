# KEETY — Architecture

> **Architecture specification for the KEETY MVP**
>
> This document follows the provided KEETY architecture diagram as the source of truth. The implementation is intentionally aligned with the exact structure shown there:
>
> **Frontend → Node.js/Express Backend → Google Gemini AI Layer → MongoDB Atlas Database & Storage → External Services**
>
> The platform is designed to support any type of business, including clothing stores, restaurants, salons, grocery/retail, electronics, and other businesses.

---

# 1. Architecture Overview

KEETY is an **AI Business Intelligence Platform** that helps business owners understand their business data, discover insights, receive growth recommendations, and interact with an AI business assistant.

The system is divided into five primary layers:

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. FRONTEND — React + TailwindCSS                           │
│                                                             │
│ Dashboard | Add / Manage Data | Ask KEETY | Reports |      │
│ Insights  | Settings                                       │
└───────────────────────────┬─────────────────────────────────┘
                            │
                       HTTP / REST
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. BACKEND — Node.js + Express.js                           │
│                                                             │
│ Auth | Business | Product | Sales | Analytics | AI          │
│ Modules                                                     │
└──────────────┬───────────────────────┬──────────────────────┘
               │                       │
               │ Processed Business    │ AI Requests
               │ Data / Context        │
               ▼                       ▼
┌─────────────────────────┐   ┌───────────────────────────────┐
│ 4. DATABASE & STORAGE   │   │ 3. AI LAYER                  │
│                         │   │                               │
│ MongoDB Atlas           │   │ Google Gemini API             │
│                         │   │                               │
│ Users                   │   │ Analysis                      │
│ Businesses              │   │ Insights                      │
│ Products                │   │ Recommendations               │
│ Sales                   │   │ Strategies                    │
│ Customers               │   │ Natural Language Q&A          │
│ Expenses                │   │                               │
│ Inventory               │   │                               │
│ AI Logs                 │   │                               │
│ Reports                 │   │                               │
└─────────────────────────┘   └───────────────────────────────┘
                                      │
                                      ▼
                         ┌───────────────────────────┐
                         │ 5. EXTERNAL SERVICES      │
                         │                           │
                         │ Gemini API                │
                         │ Cloud Storage (Optional)  │
                         │ Email/Notification        │
                         │            (Optional)     │
                         └───────────────────────────┘
```

---

# 2. Technology Stack

The implementation will follow the technologies shown in the architecture diagram.

## Frontend

- React
- TailwindCSS
- REST API communication
- JSON responses

## Backend

- Node.js
- Express.js
- JWT authentication
- REST API
- Modular backend structure

## AI Layer

- Google Gemini API
- Generative AI for business analysis
- AI-generated insights
- AI recommendations
- Growth strategy generation
- Natural-language Q&A
- Business-specific advice

## Database & Storage

- MongoDB Atlas
- MongoDB collections for application/business data
- Cloud Storage is optional for uploaded files such as CSV and images

## External Services

- Google Gemini API
- Cloud Storage — optional
- Email/Notification service — optional

---

# 3. Supported Businesses

KEETY is designed as a general business platform.

The architecture must support:

```text
Clothing Store
Restaurant
Salon
Grocery / Retail
Electronics
Any Other Business
```

The frontend and backend should not be duplicated for every business type.

Instead, the business type is stored as part of the business profile and is passed as context to the analytics and AI modules.

Example:

```json
{
  "businessType": "restaurant"
}
```

or:

```json
{
  "businessType": "clothing_store"
}
```

The AI layer uses this context to generate business-specific insights and recommendations.

---

# 4. Layer 1 — Frontend

## Technology

```text
React + TailwindCSS
```

The frontend is the primary interface for the business owner.

The architecture diagram defines five major frontend areas:

```text
KEETY Web App
│
├── Dashboard
├── Add / Manage Data
├── Ask KEETY
├── Reports & Insights
└── Settings
```

---

# 5. Frontend — Business Owner

The main user is the:

> **Business Owner**

The business owner interacts with KEETY through the React web application.

The frontend sends:

```text
HTTP Requests
```

to the Express.js backend.

The backend returns:

```text
JSON Responses
```

containing business data, statistics, insights, recommendations, and AI-generated responses.

---

# 6. Frontend Module — Dashboard

The Dashboard provides:

- Business overview
- Key statistics
- Business insights
- Important trends
- Growth information
- High-level recommendations

The dashboard consumes processed information from the backend.

Example:

```text
Dashboard
│
├── Revenue
├── Sales
├── Products
├── Customers
├── Inventory
├── Business Insights
└── Recommendations
```

The dashboard should present information in a simple way so a business owner does not need technical knowledge to understand it.

---

# 7. Frontend Module — Add / Manage Data

This section allows the business owner to add and manage business information.

The architecture diagram explicitly includes:

```text
Products
Sales
Customers
etc.
```

The frontend can provide forms/tables for:

- Products
- Sales
- Customers
- Expenses
- Inventory
- Other business information

The frontend sends this data to the appropriate backend REST endpoints.

---

# 8. Frontend Module — Ask KEETY

This is the AI Business Assistant interface.

The business owner can ask questions in natural language.

Examples:

```text
"Which product is performing best?"

"Why are my sales going down?"

"How can I grow my business?"

"What should I promote?"

"What products should I focus on?"

"Give me a growth strategy for next month."
```

The frontend sends the user's question to:

```text
POST /api/ai/ask
```

The backend prepares the business context and sends the request to Google Gemini.

The response is returned to the frontend as JSON.

---

# 9. Frontend Module — Reports & Insights

This section presents:

- Trends
- Growth information
- Recommendations
- AI-generated insights
- Business reports

The backend Analytics Module processes business statistics and the AI Module can generate explanations, strategies, and recommendations.

---

# 10. Frontend Module — Settings

Settings contains:

- Business information
- Business profile
- Preferences

Business information may include:

```text
Business Name
Business Type
Location
Other Business Preferences
```

The selected business type becomes part of the context used by KEETY.

---

# 11. Layer 2 — Backend

## Technology

```text
Node.js + Express.js
```

The backend is the central application/API layer.

Its responsibilities include:

- Authentication
- Business management
- Product management
- Sales management
- Analytics
- AI integration
- Data access
- API responses

The backend communicates with the frontend through REST APIs.

---

# 12. Backend Module Structure

The architecture diagram defines the following modules:

```text
Backend
│
├── Auth Module
├── Business Module
├── Product Module
├── Sales Module
├── Analytics Module
└── AI Module
```

These modules are implemented inside the Node.js/Express.js application.

---

# 13. Auth Module

The Auth Module uses:

```text
JWT
```

Responsibilities:

- User registration
- User login
- JWT generation
- JWT validation
- Authentication middleware
- Identifying the current user

Example endpoint:

```http
POST /api/auth/register
```

Additional login endpoint can follow the same authentication module.

Authentication must be checked before accessing protected business data.

---

# 14. Business Module

The Business Module manages business information.

Responsibilities:

- Create business
- Update business
- Get business
- Store business type
- Store business profile information

Example endpoint:

```http
POST /api/business
```

and:

```http
GET /api/business/:id
```

The business record is linked to its owner/user.

---

# 15. Product Module

The Product Module handles product CRUD operations.

Responsibilities:

- Create product
- Read product
- Update product
- Delete product
- Product information
- Product pricing
- Product categories where applicable

Example:

```http
POST /api/products
```

Products are stored in MongoDB Atlas.

---

# 16. Sales Module

The Sales Module handles sales data.

Responsibilities:

- Create sales records
- Read sales records
- Update sales records
- Delete sales records
- Connect sales with products/business
- Provide data to analytics

The sales data becomes one of the primary inputs for business analysis.

---

# 17. Analytics Module

The Analytics Module processes business data and generates statistics.

Responsibilities:

- Business statistics
- Sales analysis
- Product performance
- Business trends
- Processed business data
- Insights context

Example endpoint:

```http
GET /api/analytics
```

The Analytics Module provides processed business data to the AI Module.

Example:

```text
Raw Business Data
       ↓
Analytics Module
       ↓
Processed Business Data
       ↓
Insights Context
       ↓
AI Module
```

---

# 18. AI Module

The AI Module integrates KEETY with:

```text
Google Gemini API
```

Responsibilities:

- Business analysis
- AI insights
- Growth recommendations
- Product suggestions
- Marketing strategy generation
- Natural-language Q&A
- Report generation
- Business-specific advice

The AI Module receives processed business data from the Analytics Module rather than blindly sending the entire database to the AI.

---

# 19. AI Request Flow

The main AI flow is:

```text
Business Owner
      ↓
Ask KEETY
      ↓
POST /api/ai/ask
      ↓
Node.js / Express
      ↓
Business Context
      ↓
Analytics Module
      ↓
Processed Business Data
      ↓
Google Gemini
      ↓
AI Generated Response
      ↓
Insights / Recommendations / Strategies
      ↓
JSON Response
      ↓
KEETY Web App
```

---

# 20. AI Capabilities

According to the architecture, KEETY's AI layer supports:

- Business analysis and insights
- Growth recommendations
- Product suggestions
- Marketing strategy generation
- Natural-language Q&A
- Report generation
- Business-specific advice

Business-specific advice can cover:

```text
Retail
Restaurant
Salon
Other supported businesses
```

---

# 21. AI Context Construction

The backend should construct a business context before calling Gemini.

Conceptually:

```text
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
      ↓
Processed Business Context
      ↓
Google Gemini
```

The context should contain relevant processed information rather than unnecessarily sending every raw record.

---

# 22. AI Prompt Structure

A KEETY AI request should conceptually contain:

```text
Business Type
Business Information
Relevant Business Metrics
Relevant Products
Relevant Sales Statistics
Relevant Customer Statistics
Relevant Inventory Statistics
User Question
```

Example:

```text
Business Type:
Clothing Store

Revenue:
₹482,000

Orders:
1,248

Top Product:
Black Hoodie

Sales Growth:
14.2%

Question:
"Which products should I restock?"
```

Gemini then produces the AI-generated response.

---

# 23. AI Response

The backend receives the Gemini response and returns it to the frontend.

The response can contain:

```text
Insights
Recommendations
Strategies
Business Advice
```

The frontend renders the response in the Ask KEETY interface or Reports & Insights section.

---

# 24. Layer 3 — AI Layer

## Technology

```text
Google Gemini API
```

The AI layer is the generative intelligence layer of KEETY.

The architecture diagram explicitly places Google Gemini between the backend and the business intelligence workflow.

---

# 25. Gemini Data Flow

The backend sends:

```text
Processed Business Data
(Insights Context)
```

to Google Gemini.

Gemini returns:

```text
AI Generated Response
(Insights, Recommendations, Strategies)
```

The response is passed back through the backend to the frontend.

---

# 26. Layer 4 — Database & Storage

## Technology

```text
MongoDB Atlas
```

MongoDB Atlas is the primary application database shown in the architecture.

The diagram defines these major data areas:

```text
Users
Businesses
Products
Sales
Customers
Expenses
Inventory
AI Logs
Reports
```

---

# 27. MongoDB Collections

The logical MongoDB collections should be:

```text
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

Each collection should contain the appropriate business/user relationship so data can be associated with the correct business.

---

# 28. Users Collection

Stores application user information.

Conceptually:

```text
User
├── _id
├── name
├── email
├── passwordHash
└── createdAt
```

JWT authentication is used to authenticate users.

Passwords must never be stored as plain text.

---

# 29. Businesses Collection

Stores business information.

Conceptually:

```text
Business
├── _id
├── ownerId
├── name
├── type
├── location
├── preferences
└── createdAt
```

The `type` field is important because KEETY provides business-specific advice.

---

# 30. Products Collection

Stores product information.

Conceptually:

```text
Product
├── _id
├── businessId
├── name
├── category
├── price
├── stock
└── createdAt
```

The exact fields can evolve according to the supported business types.

---

# 31. Sales Collection

Stores sales records.

Conceptually:

```text
Sale
├── _id
├── businessId
├── productId
├── quantity
├── amount
├── date
└── createdAt
```

Sales are used by the Analytics Module to calculate business performance.

---

# 32. Customers Collection

Stores customer information.

Conceptually:

```text
Customer
├── _id
├── businessId
├── name
├── contact
├── purchaseHistory
└── createdAt
```

Customer data supports customer-related business analysis.

---

# 33. Expenses Collection

Stores business expenses.

Conceptually:

```text
Expense
├── _id
├── businessId
├── category
├── amount
├── date
└── description
```

Expenses can be used by Analytics and AI for broader business analysis.

---

# 34. Inventory Collection

Stores inventory information.

Conceptually:

```text
Inventory
├── _id
├── businessId
├── productId
├── quantity
├── threshold
└── updatedAt
```

Inventory data supports product and stock-related recommendations.

---

# 35. AI Logs Collection

The architecture includes AI Logs.

This collection is intended to store AI interaction metadata.

Conceptually:

```text
AI Log
├── _id
├── businessId
├── userId
├── question
├── response
├── createdAt
```

Sensitive information should be handled carefully when storing AI logs.

AI logs can help with:

- Debugging
- AI interaction history
- Usage tracking
- Product improvement

---

# 36. Reports Collection

The architecture includes Reports.

Reports can store generated business reports and AI-generated reporting output.

Conceptually:

```text
Report
├── _id
├── businessId
├── title
├── type
├── content
├── createdAt
└── updatedAt
```

Reports are surfaced through the Reports & Insights frontend area.

---

# 37. Layer 5 — External Services

The architecture defines three external-service categories:

```text
Google Gemini API
Cloud Storage (Optional)
Email/Notification (Optional)
```

---

# 38. Google Gemini API

Google Gemini is the LLM provider for KEETY.

Used for:

- Business analysis
- Insights
- Recommendations
- Growth strategies
- Natural-language answers
- Report generation
- Business-specific advice

The backend should keep Gemini API credentials server-side.

The React frontend must not directly expose the Gemini API key.

---

# 39. Cloud Storage — Optional

Cloud Storage is optional and can be used for:

- File uploads
- CSV files
- Images
- Other business assets

Possible flow:

```text
React Frontend
      ↓
Backend
      ↓
Cloud Storage
      ↓
File Reference
      ↓
MongoDB
```

The exact storage provider can be selected during implementation.

---

# 40. Email / Notification — Optional

Email/Notification is optional.

Potential uses:

- Alerts
- Reports
- Notifications
- Business updates

Example:

```text
KEETY
  ↓
Important Business Insight
  ↓
Notification Service
  ↓
Business Owner
```

This service is not required for the core MVP.

---

# 41. API Endpoints

The architecture diagram specifies the following example endpoints:

```text
POST /api/auth/register

POST /api/business

GET  /api/business/:id

POST /api/products

GET  /api/analytics

POST /api/ai//ask

POST /api/ai/growth-strategy
```

These endpoints should be implemented using Express.js.

---

# 42. API Endpoint Responsibilities

## Register

```http
POST /api/auth/register
```

Creates a new user account.

---

## Create Business

```http
POST /api/business
```

Creates a business profile associated with the authenticated user.

---

## Get Business

```http
GET /api/business/:id
```

Returns business information for an authorized user.

---

## Create Product

```http
POST /api/products
```

Creates a product associated with a business.

---

## Analytics

```http
GET /api/analytics
```

Returns processed business statistics and analytics.

---

## Ask KEETY

```http
POST /api/ai//ask
```

This endpoint follows the endpoint notation shown in the provided architecture diagram.

It receives a natural-language question and returns an AI-generated answer using business context.

---

## Growth Strategy

```http
POST /api/ai/growth-strategy
```

Generates an AI-powered growth strategy based on the business information and analytics available to KEETY.

---

# 43. Recommended API Request/Response Pattern

## Ask KEETY Request

```json
{
  "businessId": "business_id",
  "question": "Which products should I focus on?"
}
```

## Response

```json
{
  "success": true,
  "data": {
    "answer": "Your top-performing products are...",
    "insights": [],
    "recommendations": []
  }
}
```

The exact response schema can evolve during implementation.

---

# 44. End-to-End Data Flow

The complete architecture works as follows:

```text
             BUSINESS OWNER
                    │
                    ▼
             React Web App
                    │
              HTTP / REST
                    │
                    ▼
           Node.js + Express
                    │
        ┌───────────┼────────────┐
        │           │            │
        ▼           ▼            ▼
    Business      Product       Sales
     Module       Module        Module
        │           │            │
        └───────────┼────────────┘
                    ▼
             Analytics Module
                    │
          Processed Business Data
             (Insights Context)
                    │
                    ▼
               AI Module
                    │
                    ▼
             Google Gemini
                    │
       AI Generated Response
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
     Insights  Recommendations Strategies
                    │
                    ▼
              Express API
                    │
               JSON Response
                    │
                    ▼
               React UI
```

---

# 45. Database Data Flow

Business data is persisted in MongoDB Atlas.

```text
React
  ↓
Express API
  ↓
Business/Product/Sales Modules
  ↓
MongoDB Atlas
```

Analytics reads the stored data:

```text
MongoDB Atlas
      ↓
Analytics Module
      ↓
Processed Statistics
      ↓
AI Module
```

---

# 46. AI + Database Relationship

The AI should not directly access MongoDB from the frontend.

Correct flow:

```text
Frontend
   ↓
Express Backend
   ↓
MongoDB
   ↓
Analytics Processing
   ↓
Processed Context
   ↓
Gemini
   ↓
AI Response
   ↓
Express
   ↓
Frontend
```

This keeps database access and AI credentials inside the backend.

---

# 47. Authentication Flow

```text
User
 ↓
Register / Login
 ↓
Auth Module
 ↓
JWT
 ↓
Frontend stores authentication state
 ↓
Protected API request
 ↓
JWT validation
 ↓
Authorized backend module
```

Business data must only be returned to authorized users.

---

# 48. Business Context Flow

Business context is central to KEETY's business-specific intelligence.

```text
Business
   ↓
Business Type
   ↓
Business Data
   ↓
Analytics
   ↓
Processed Context
   ↓
Gemini
   ↓
Business-Specific Advice
```

For example:

```text
Business Type = Restaurant

→ Restaurant-oriented insights
→ Menu/product analysis
→ Sales trends
→ Growth recommendations
```

Another example:

```text
Business Type = Clothing Store

→ Product performance
→ Inventory insights
→ Sales trends
→ Product recommendations
```

---

# 49. Analytics-to-AI Flow

The Analytics Module should prepare useful context.

Example:

```text
Raw Sales Data
      ↓
Analytics
      ↓
Revenue = ₹482,000
Orders = 1,248
Growth = 14.2%
Top Product = Black Hoodie
      ↓
Insights Context
      ↓
Gemini
      ↓
"Your revenue increased mainly because..."
```

This keeps the AI focused on interpreting business information rather than acting as the primary database engine.

---

# 50. Growth Strategy Flow

```text
Business Data
      ↓
Analytics
      ↓
Current Performance
      ↓
AI Module
      ↓
Google Gemini
      ↓
Growth Strategy
      ↓
Frontend
```

The strategy can include:

```text
Current situation
Opportunities
Risks
Recommended actions
Business-specific suggestions
```

---

# 51. Security Requirements

The architecture must protect:

- User credentials
- JWT secrets
- Gemini API key
- Business data
- Customer data
- Sales data
- AI logs

Important rules:

1. Never expose Gemini API keys to React.
2. Passwords must be hashed.
3. Protected endpoints must validate JWTs.
4. Business ownership/authorization must be checked.
5. Database queries must be scoped to the correct business.
6. Sensitive information should not be unnecessarily exposed in AI logs.

---

# 52. Error Handling

The Express backend should provide consistent API errors.

Example:

```json
{
  "success": false,
  "error": {
    "message": "Business not found"
  }
}
```

AI failures should also be handled gracefully.

Example:

```text
Gemini unavailable
       ↓
Backend catches error
       ↓
Return controlled error
       ↓
Frontend shows:
"KEETY AI is temporarily unavailable. Please try again."
```

The application should not expose internal stack traces to users.

---

# 53. AI Failure Behavior

The dashboard and standard CRUD functionality should remain conceptually separate from Gemini.

Therefore:

```text
Gemini Down
     │
     ├── Dashboard → Can still load stored/analytics data
     ├── Products → Can still work
     ├── Sales → Can still work
     └── Ask KEETY → Temporarily unavailable
```

This prevents the AI provider from becoming the only dependency for the entire application.

---

# 54. Data Validation

Backend validation should be applied before storing business data.

Examples:

```text
Product price → number
Sale quantity → number
Business type → supported value
Email → valid format
Required fields → present
```

Validation should happen server-side even if the React frontend already validates input.

---

# 55. Recommended Backend Structure

```text
backend/
│
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── env.js
│   │
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── validation.js
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   └── auth.routes.js
│   │   │
│   │   ├── business/
│   │   ├── products/
│   │   ├── sales/
│   │   ├── analytics/
│   │   └── ai/
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
│   ├── routes/
│   │   └── index.js
│   │
│   └── server.js
│
└── package.json
```

---

# 56. Recommended Frontend Structure

```text
frontend/
│
├── src/
│   ├── components/
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── sales/
│   │   ├── customers/
│   │   ├── analytics/
│   │   └── ai/
│   │
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── ManageData.jsx
│   │   ├── AskKeety.jsx
│   │   ├── Reports.jsx
│   │   └── Settings.jsx
│   │
│   ├── services/
│   │   └── api.js
│   │
│   ├── hooks/
│   ├── context/
│   ├── utils/
│   └── App.jsx
│
└── package.json
```

---

# 57. MongoDB Data Relationship

Although MongoDB is document-oriented, business ownership relationships should remain explicit.

Conceptually:

```text
User
 │
 └──── ownerId ────► Business
                       │
                       ├── businessId ──► Products
                       ├── businessId ──► Sales
                       ├── businessId ──► Customers
                       ├── businessId ──► Expenses
                       ├── businessId ──► Inventory
                       ├── businessId ──► AI Logs
                       └── businessId ──► Reports
```

This is important for authorization and data isolation.

---

# 58. MVP Scope

The first implementation should prioritize the functionality shown in the architecture.

## Must Have

```text
✓ User registration/authentication
✓ Business creation
✓ Business type
✓ Product management
✓ Sales management
✓ Analytics
✓ MongoDB Atlas
✓ Ask KEETY
✓ Gemini integration
✓ Growth strategy
✓ Dashboard
✓ Reports & insights
```

## Optional

```text
○ Cloud Storage
○ Email notifications
○ Advanced file uploads
○ Automated notifications
```

---

# 59. MVP User Journey

```text
1. Business Owner registers
              ↓
2. Creates business
              ↓
3. Selects business type
              ↓
4. Adds products
              ↓
5. Adds sales/customers/etc.
              ↓
6. Dashboard calculates analytics
              ↓
7. Owner opens Ask KEETY
              ↓
8. Owner asks a business question
              ↓
9. Backend processes business context
              ↓
10. Gemini analyzes the context
              ↓
11. KEETY returns insights/recommendations
              ↓
12. Owner views growth strategy
```

---

# 60. Example: Clothing Store

```text
Business Type:
Clothing Store

Products:
T-Shirts
Hoodies
Jeans
Jackets

Sales:
Historical sales records

Inventory:
Current product stock

Analytics:
Top products
Sales trends
Revenue

Gemini:
Business-specific interpretation

Output:
Insights
Product suggestions
Growth recommendations
```

---

# 61. Example: Restaurant

```text
Business Type:
Restaurant

Products:
Menu items

Sales:
Orders

Customers:
Customer records

Analytics:
Popular items
Sales trends
Revenue

Gemini:
Restaurant-specific interpretation

Output:
Insights
Product/menu suggestions
Growth recommendations
```

---

# 62. Example: Salon

```text
Business Type:
Salon

Products / Services:
Haircut
Hair color
Styling
Other services

Sales:
Service sales

Customers:
Customer records

Analytics:
Popular services
Revenue
Customer trends

Gemini:
Salon-specific interpretation

Output:
Insights
Service suggestions
Growth recommendations
```

---

# 63. Production Readiness Checklist

Before production, verify:

## Frontend

- [ ] React application works
- [ ] TailwindCSS configured
- [ ] Dashboard works
- [ ] Manage Data works
- [ ] Ask KEETY works
- [ ] Reports & Insights works
- [ ] Settings works

## Backend

- [ ] Express server works
- [ ] JWT authentication works
- [ ] Business APIs work
- [ ] Product APIs work
- [ ] Sales APIs work
- [ ] Analytics API works
- [ ] AI APIs work

## Database

- [ ] MongoDB Atlas configured
- [ ] Models created
- [ ] Business ownership enforced
- [ ] Indexes added where needed
- [ ] Environment variables protected

## AI

- [ ] Gemini API configured
- [ ] API key is server-side
- [ ] Business context is generated
- [ ] AI errors handled
- [ ] AI responses logged appropriately

## Optional Services

- [ ] Cloud Storage only if needed
- [ ] Email/Notifications only if needed

---

# 64. Final Architecture

The final KEETY architecture is:

```text
┌────────────────────────────────────────────────────┐
│                  BUSINESS OWNER                    │
└─────────────────────────┬──────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ 1. FRONTEND                                        │
│ React + TailwindCSS                                │
│                                                    │
│ Dashboard | Add/Manage Data | Ask KEETY            │
│ Reports & Insights | Settings                      │
└─────────────────────────┬──────────────────────────┘
                          │
                    HTTP / REST
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ 2. BACKEND                                         │
│ Node.js + Express.js                               │
│                                                    │
│ Auth | Business | Product                          │
│ Sales | Analytics | AI                             │
└───────────────┬────────────────────┬───────────────┘
                │                    │
                │                    │
                ▼                    ▼
┌────────────────────────┐   ┌───────────────────────┐
│ 4. DATABASE & STORAGE  │   │ 3. AI LAYER           │
│ MongoDB Atlas          │   │ Google Gemini API     │
│                        │   │                       │
│ Users                  │   │ Analysis              │
│ Businesses             │   │ Insights              │
│ Products               │   │ Recommendations      │
│ Sales                  │   │ Strategies            │
│ Customers              │   │ Natural Language Q&A  │
│ Expenses               │   │ Reports               │
│ Inventory              │   │ Business Advice       │
│ AI Logs                │   │                       │
│ Reports                │   └───────────┬───────────┘
└────────────────────────┘               │
                                         ▼
                              ┌────────────────────────┐
                              │ 5. EXTERNAL SERVICES    │
                              │                        │
                              │ Gemini API             │
                              │ Cloud Storage Optional │
                              │ Email/Notifications    │
                              │ Optional               │
                              └────────────────────────┘
```

---

# 65. Architecture Principle

KEETY's implementation must follow the structure of the provided architecture diagram:

```text
React + TailwindCSS
        ↓
Node.js + Express.js
        ↓
Google Gemini
        ↓
MongoDB Atlas
        ↓
Optional External Services
```

The main goal is to create a single AI-powered business platform that can understand different types of businesses through their business profile and data, provide analytics and insights, answer business questions, and generate practical growth recommendations.

The architecture should remain simple and modular during the MVP stage, while keeping the five-layer structure intact.
