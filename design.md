# design.md --- KEETY Product Design System & UX Architecture

# Brutal 15+ Year Product Designer + UI/UX Architect Review Standard

## ROLE

Act as a **15+ year Senior Product Designer, UI/UX Architect, Design
Systems Engineer, Frontend Architect, React/Next.js Expert,
Accessibility Specialist, Interaction Designer, and Design Director**.

Your responsibility is to design and review **KEETY** as a real
production SaaS product, not as a generic dashboard template.

KEETY is an AI-powered business intelligence and growth assistant for
businesses such as:

-   Clothing
-   Restaurants
-   Salons
-   Grocery / Retail
-   Electronics
-   Other businesses

The product helps business owners move from:

``` text
Business Data
      ↓
Understanding
      ↓
Insights
      ↓
AI Explanation
      ↓
Recommendations
      ↓
Business Action
```

The design goal is:

> **Make business intelligence understandable, trustworthy, actionable,
> and simple enough for a busy business owner to use every day.**

------------------------------------------------------------------------

# 1. THE BRUTAL DESIGN RULE

Do not approve the design because:

-   It looks modern.
-   The colors are attractive.
-   It uses gradients.
-   It has rounded cards.
-   It uses glassmorphism.
-   It has animations.
-   It resembles another SaaS product.
-   The dashboard looks impressive in a screenshot.

Instead ask:

> **Does every visual and interaction decision help the business owner
> understand or act?**

The target is:

``` text
Intentional
+
Clear
+
Actionable
+
Trustworthy
+
Accessible
+
Responsive
+
Distinctive
+
Implementable
```

Not:

``` text
Pretty
+
Trendy
+
Decorative
```

------------------------------------------------------------------------

# 2. SOURCE-OF-TRUTH ARCHITECTURE

The design must remain aligned with:

``` text
design.md
frontend.md
backend.md
database.md
architecture.md
```

The approved frontend architecture is:

``` text
React + TypeScript + Tailwind CSS
            ↓
Node.js + Express REST API
            ↓
MongoDB Atlas
            ↓
Analytics Module
            ↓
Google Gemini AI
```

The frontend must never design interactions that require direct browser
access to:

``` text
MongoDB
Gemini
Server secrets
```

------------------------------------------------------------------------

# 3. PRODUCT UNDERSTANDING

## What is KEETY?

KEETY is an AI business assistant that helps a business owner
understand:

``` text
What happened?
Why did it happen?
What matters?
What should I do next?
```

KEETY combines:

``` text
Products
Sales
Customers
Expenses
Inventory
Analytics
AI
Reports
```

into one business-oriented experience.

------------------------------------------------------------------------

# 4. PRIMARY USER

The primary user is:

``` text
Business Owner
```

This person may not be:

-   A data analyst
-   A financial analyst
-   A technical user
-   A dashboard expert

Therefore the interface must not assume that users understand:

``` text
Complex analytics
Technical terminology
Database concepts
AI terminology
Statistical jargon
```

Use business language.

------------------------------------------------------------------------

# 5. PRIMARY USER GOAL

The primary goal is:

> **Understand the business quickly and know what action deserves
> attention next.**

The design should reduce the time between:

``` text
Opening KEETY
        ↓
Understanding the current situation
        ↓
Taking an informed action
```

------------------------------------------------------------------------

# 6. KEETY'S CORE UX PROMISE

Every major experience should support:

``` text
WHAT
 ↓
WHY
 ↓
WHAT NEXT
```

Example:

``` text
WHAT:
Revenue increased 18%.

WHY:
Sales of the Black Hoodie increased significantly.

WHAT NEXT:
Review inventory because stock is approaching the reorder level.
```

This principle should influence:

-   Dashboard
-   Analytics
-   AI
-   Reports
-   Growth Strategy
-   Notifications
-   Empty states

------------------------------------------------------------------------

# 7. PRIMARY USER FLOW

``` mermaid
flowchart TD

    A[Landing Page]
        ↓
    B[Understand KEETY Value]
        ↓
    C[Get Started]
        ↓
    D[Register / Login]
        ↓
    E[Business Onboarding]
        ↓
    F[Choose Business Type]
        ↓
    G[Add Business Information]
        ↓
    H[Add Products / Business Data]
        ↓
    I[Record First Sale]
        ↓
    J[Dashboard]
        ↓
    K[Understand Performance]
        ↓
    L[Ask KEETY]
        ↓
    M[Receive Insight]
        ↓
    N[Receive Recommendation]
        ↓
    O[Take Business Action]
        ↓
    P[Return to KEETY]
```

The design must optimize the path to the **first meaningful business
insight**.

------------------------------------------------------------------------

# 8. INFORMATION ARCHITECTURE

Primary navigation:

``` text
Dashboard
Products
Sales
Customers
Expenses
Inventory
Analytics
Ask KEETY
Growth
Reports
Settings
```

The navigation should communicate:

``` text
Manage Data
      ↓
Understand Data
      ↓
Ask KEETY
      ↓
Take Action
```

Avoid an overloaded sidebar.

------------------------------------------------------------------------

# 9. SITEMAP

``` mermaid
flowchart TD

    Home[Landing]
    Home --> Login
    Home --> Register

    Register --> Onboarding
    Login --> App

    Onboarding --> BusinessSetup
    BusinessSetup --> App

    App[KEETY App]

    App --> Dashboard
    App --> Products
    App --> Sales
    App --> Customers
    App --> Expenses
    App --> Inventory
    App --> Analytics
    App --> AskKEETY
    App --> Growth
    App --> Reports
    App --> Settings

    Settings --> Profile
    Settings --> BusinessSettings
    Settings --> Preferences
```

------------------------------------------------------------------------

# 10. PAGE INVENTORY

  -----------------------------------------------------------------------------
  Page           Purpose          Primary Goal    Primary CTA    Important
                                                                 States
  -------------- ---------------- --------------- -------------- --------------
  Landing        Explain KEETY    Understand      Get Started    Loading /
                                  value                          Error

  Login          Authentication   Sign in         Login          Error /
                                                                 Loading

  Register       Account creation Create account  Create Account Error /
                                                                 Loading

  Onboarding     Business setup   Configure       Continue       Validation /
                                  business                       Loading

  Dashboard      Business         Understand      Ask KEETY /    Loading /
                 overview         business        Action         Empty / Error

  Products       Product          Manage products Add Product    Empty / Error
                 management                                      

  Sales          Sales management Record /        Record Sale    Empty / Error
                                  inspect sales                  

  Customers      Customer         Understand      Add Customer   Empty / Error
                 management       customers                      

  Expenses       Expense          Track expenses  Add Expense    Empty / Error
                 management                                      

  Inventory      Stock management Identify stock  View Product   Empty / Error
                                  risk                           

  Analytics      Deep analysis    Understand      Change Period  Loading /
                                  trends                         Empty / Error

  Ask KEETY      AI assistant     Ask business    Send           Thinking /
                                  questions                      Error

  Growth         Strategy         Find growth     Generate       Loading /
                                  opportunities   Strategy       Error

  Reports        Historical       Review business View Report    Empty / Error
                 insight          reports                        

  Settings       Configuration    Manage business Save           Success /
                                                                 Error
  -----------------------------------------------------------------------------

------------------------------------------------------------------------

# 11. GLOBAL DESIGN PRINCIPLE

KEETY should feel like:

``` text
A calm business command center
```

not:

``` text
A giant analytics cockpit
```

The user should not need to interpret ten charts before understanding
what matters.

------------------------------------------------------------------------

# 12. DESIGN PERSONALITY

KEETY's visual personality should be:

``` text
Professional
Intelligent
Approachable
Trustworthy
Clear
Focused
Modern
Action-oriented
```

Avoid making it:

``` text
Overly futuristic
Cyberpunk
Crypto-like
Gaming-like
Overly corporate
Visually noisy
Generic admin-template-like
```

------------------------------------------------------------------------

# 13. VISUAL IDENTITY

KEETY must have recognizable visual DNA.

Identity should come from:

``` text
Typography
+
Layout rhythm
+
Information hierarchy
+
AI interaction patterns
+
Business insight cards
+
Action-oriented components
```

Do not try to create identity through random gradients.

------------------------------------------------------------------------

# 14. DESIGN LANGUAGE

The product should visually communicate:

``` text
Business clarity
      +
Intelligence
      +
Action
```

A user should be able to recognize:

``` text
KEETY Insight
KEETY Recommendation
KEETY Analysis
```

as part of one unified system.

------------------------------------------------------------------------

# 15. LANDING PAGE

The landing page should answer three questions immediately:

``` text
What is KEETY?
Why should I care?
What should I do next?
```

Recommended hierarchy:

``` text
Hero
 ↓
Problem
 ↓
How KEETY Works
 ↓
Business Types
 ↓
Core Capabilities
 ↓
AI Example
 ↓
Benefits
 ↓
CTA
```

------------------------------------------------------------------------

# 16. LANDING HERO

Recommended structure:

``` text
Headline
"Understand your business. Know what to do next."

Supporting text
"KEETY turns your sales, products, customers, expenses,
and inventory into practical business insights."

Primary CTA
"Get Started"

Secondary CTA
"See How KEETY Works"

Product visual
Dashboard / AI insight demonstration
```

Do not use multiple competing hero CTAs.

------------------------------------------------------------------------

# 17. HERO PRODUCT DEMONSTRATION

The product visual should show actual KEETY concepts:

``` text
Revenue
Top Product
Low Stock
AI Insight
Recommended Action
```

Do not use fake decorative charts with no business meaning.

------------------------------------------------------------------------

# 18. BUSINESS TYPE PERSONALIZATION

Supported business types:

``` text
CLOTHING
RESTAURANT
SALON
GROCERY_RETAIL
ELECTRONICS
OTHER
```

The product should share the same core design system.

Business-specific terminology may adapt.

Examples:

``` text
Clothing:
Products / Stock / Sizes / Colors

Restaurant:
Menu Items / Inventory / Orders

Salon:
Services / Customers / Appointments where supported
```

Do not create unrelated visual systems for each business type.

------------------------------------------------------------------------

# 19. ONBOARDING

Onboarding should be progressive.

Flow:

``` text
Welcome
 ↓
Business Name
 ↓
Business Type
 ↓
Currency
 ↓
Timezone
 ↓
First Product / Business Data
 ↓
First Sale
 ↓
First Insight
```

The user should understand:

> Why each step is being requested.

Avoid a giant setup form.

------------------------------------------------------------------------

# 20. ONBOARDING UX PRINCIPLE

Every onboarding step should answer:

``` text
What am I entering?
Why does KEETY need it?
What will I get from it?
```

Example:

``` text
Add your products

KEETY uses product and sales data to identify
your strongest products and inventory risks.
```

------------------------------------------------------------------------

# 21. DASHBOARD PHILOSOPHY

The dashboard is not a collection of widgets.

It is:

> **The owner's daily business briefing.**

The dashboard should answer:

``` text
How is my business doing?
What changed?
What needs attention?
What should I do next?
```

------------------------------------------------------------------------

# 22. DASHBOARD HIERARCHY

Recommended:

``` text
Greeting / Business Context
        ↓
Key Metrics
        ↓
Important Change
        ↓
Top Products / Business Drivers
        ↓
Inventory Risk
        ↓
AI Insights
        ↓
Recommended Actions
```

Do not place six unrelated charts above the primary insight.

------------------------------------------------------------------------

# 23. DASHBOARD KEY METRICS

Potential metrics:

``` text
Revenue
Sales
Growth %
Average Order Value
Expenses
Low Stock
```

Each metric should include context where possible:

``` text
Revenue
₹1,20,000
↑ 18% vs previous period
```

A number without context is less useful.

------------------------------------------------------------------------

# 24. DASHBOARD AI INSIGHT

Example:

``` text
KEETY Insight

Revenue increased 18% this month.

The largest contribution came from Black Hoodie sales.

Inventory is now approaching the reorder level.

[Review Inventory]
```

The insight should connect:

``` text
Observation
+
Reason
+
Potential action
```

------------------------------------------------------------------------

# 25. RECOMMENDATION DESIGN

Recommendations should use a consistent structure:

``` text
Recommendation
Why it matters
Priority
Suggested action
```

Example:

``` text
Restock Black Hoodie

Why it matters:
Strong recent sales and low current inventory.

Priority:
HIGH

Action:
Review stock and reorder availability.

[View Product]
```

Do not promise guaranteed business outcomes.

------------------------------------------------------------------------

# 26. PRIORITY LANGUAGE

Use clear priority levels where justified:

``` text
HIGH
MEDIUM
LOW
```

Priority should reflect actual backend/AI logic.

Do not assign priority purely for visual decoration.

------------------------------------------------------------------------

# 27. ANALYTICS PAGE

Analytics should answer specific questions.

Examples:

``` text
How are sales changing?
Which products drive revenue?
What are my largest expenses?
How are customers behaving?
Where is inventory becoming risky?
```

Each chart should have a purpose.

------------------------------------------------------------------------

# 28. ANALYTICS INFORMATION HIERARCHY

``` text
Summary
 ↓
Trend
 ↓
Breakdown
 ↓
Interpretation
 ↓
Action
```

Do not make users interpret raw charts alone.

------------------------------------------------------------------------

# 29. CHART DESIGN

Use the simplest chart that communicates the point.

Examples:

``` text
Trend → Line
Category comparison → Bar
Composition → Donut only when appropriate
```

Avoid decorative 3D charts.

Every chart should have:

``` text
Title
Context
Units
Labels where needed
Loading
Empty
Error
```

------------------------------------------------------------------------

# 30. TIME FILTERS

Supported UX:

``` text
7 Days
30 Days
90 Days
This Month
Previous Month
Custom
```

The active period should always be visible.

------------------------------------------------------------------------

# 31. PRODUCTS DESIGN

Products page should optimize for:

``` text
Find
Understand
Create
Edit
Deactivate
```

Desktop:

``` text
Search + Filters + Add Product
                ↓
Product Table
```

Mobile:

``` text
Search
Filters
Product Cards
```

------------------------------------------------------------------------

# 32. PRODUCT FORM

Core fields:

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

The design should avoid overwhelming users with business-type-specific
fields unless relevant.

------------------------------------------------------------------------

# 33. SALES DESIGN

Sales are business-critical.

The interface should prioritize:

``` text
Accuracy
Speed
Clarity
Confirmation
```

Record Sale flow:

``` text
Customer
 ↓
Products
 ↓
Quantity
 ↓
Price
 ↓
Discount / Tax where supported
 ↓
Payment Method
 ↓
Total
 ↓
Confirm Sale
```

------------------------------------------------------------------------

# 34. SALES CONFIRMATION

After a successful sale:

``` text
Sale recorded successfully.

Inventory and business analytics have been updated.
```

Only state that downstream data was updated if the backend confirms it.

------------------------------------------------------------------------

# 35. CUSTOMERS DESIGN

Customer page should emphasize business usefulness.

Display:

``` text
Customer
Orders
Total Spent
Last Purchase
```

Do not turn the customer page into a CRM with dozens of unnecessary
fields in the MVP.

------------------------------------------------------------------------

# 36. EXPENSES DESIGN

Expense interface should be simple.

``` text
Category
Description
Amount
Date
```

Useful summary:

``` text
Total Expenses
Largest Categories
Expense Trend
```

Avoid complicated accounting terminology unless required.

------------------------------------------------------------------------

# 37. INVENTORY DESIGN

Inventory should visually prioritize risk.

Statuses:

``` text
IN STOCK
LOW STOCK
OUT OF STOCK
```

Example:

``` text
Black Hoodie
4 remaining
Reorder level: 5

LOW STOCK
```

Do not rely on color alone.

------------------------------------------------------------------------

# 38. ASK KEETY --- CORE EXPERIENCE

Ask KEETY should feel like:

``` text
A business advisor
```

not:

``` text
A generic chatbot
```

The interface should guide users toward useful business questions.

------------------------------------------------------------------------

# 39. ASK KEETY LAYOUT

``` text
┌───────────────────────────────────────────────┐
│ Ask KEETY                                     │
│ Understand your business with AI              │
├───────────────────────────────────────────────┤
│ Suggested Questions                            │
│                                               │
│ Which products should I restock?              │
│ Why did sales change this month?              │
│ How can I improve revenue?                    │
├───────────────────────────────────────────────┤
│ Conversation                                  │
│                                               │
│ User question                                 │
│                                               │
│ KEETY answer                                  │
│                                               │
│ Evidence / business context                   │
│                                               │
│ Recommended actions                           │
├───────────────────────────────────────────────┤
│ Ask about your business...            [Send]  │
└───────────────────────────────────────────────┘
```

------------------------------------------------------------------------

# 40. SUGGESTED AI QUESTIONS

Suggestions should be business-oriented:

``` text
Which products should I restock?

Why did my sales change?

What is driving my revenue?

Where are my biggest expenses?

How can I improve repeat purchases?

What should I focus on this month?
```

Avoid generic prompts like:

``` text
Write a poem
Tell me a joke
Explain quantum physics
```

KEETY is a business assistant.

------------------------------------------------------------------------

# 41. AI RESPONSE HIERARCHY

AI responses should prefer:

``` text
Answer
 ↓
Key Insight
 ↓
Evidence / Data Basis
 ↓
Recommendation
 ↓
Action
```

Avoid giant uninterrupted paragraphs.

------------------------------------------------------------------------

# 42. AI TRUST

When useful, display:

``` text
Based on:
Recent sales
Current inventory
Selected date range
```

Do not expose internal prompts.

Do not fabricate sources.

Do not create fake confidence scores.

------------------------------------------------------------------------

# 43. AI LOADING

Use an intentional state:

``` text
KEETY is analyzing your business...
```

Optional stages:

``` text
Understanding your question
Analyzing business data
Preparing recommendations
```

Only show stages that correspond to actual system behavior.

------------------------------------------------------------------------

# 44. AI ERROR

If AI fails:

``` text
KEETY couldn't generate an answer right now.

Please try again.
```

Action:

``` text
Try Again
```

Do not expose:

``` text
Gemini stack traces
API keys
Internal errors
```

------------------------------------------------------------------------

# 45. GROWTH STRATEGY

Growth should turn data into action.

Flow:

``` text
Choose Goal
 ↓
Understand Current Situation
 ↓
Generate Strategy
 ↓
Review Opportunities
 ↓
Take Action
```

Goals may include:

``` text
Increase Revenue
Improve Repeat Customers
Improve Product Sales
Reduce Inventory Risk
Improve Profitability
```

------------------------------------------------------------------------

# 46. GROWTH STRATEGY CARD

Example:

``` text
Growth Opportunity

Improve availability of high-demand products.

Why:
Strong sales + low stock.

Recommended action:
Review inventory and reorder high-demand items.

Business area:
Revenue / Inventory

Priority:
HIGH
```

Avoid presenting AI suggestions as guarantees.

------------------------------------------------------------------------

# 47. REPORTS

Reports should distinguish:

``` text
Measured Data
AI Interpretation
Recommendations
```

Recommended structure:

``` text
Report Title
Period
Executive Summary
Key Metrics
Insights
Recommendations
```

------------------------------------------------------------------------

# 48. SETTINGS

Settings should not become a dumping ground.

Group into:

``` text
Business
Profile
Preferences
Security
```

Future advanced configuration can be progressively disclosed.

------------------------------------------------------------------------

# 49. GLOBAL APPLICATION SHELL

Desktop:

``` text
┌───────────────────────────────────────────────┐
│ Business ▼     Search      Notifications User │
├──────────────┬────────────────────────────────┤
│              │                                │
│ Dashboard    │                                │
│ Products     │         Main Content           │
│ Sales        │                                │
│ Customers    │                                │
│ Expenses     │                                │
│ Inventory    │                                │
│ Analytics    │                                │
│ Ask KEETY    │                                │
│ Growth       │                                │
│ Reports      │                                │
│ Settings     │                                │
│              │                                │
└──────────────┴────────────────────────────────┘
```

The shell must remain visually quiet so the content remains primary.

------------------------------------------------------------------------

# 50. MOBILE NAVIGATION

Mobile should not simply compress the desktop sidebar.

Use an intentional pattern such as:

``` text
Top Bar
 ↓
Main Content
 ↓
Mobile Navigation / Menu
```

Primary mobile destinations may prioritize:

``` text
Dashboard
Analytics
Ask KEETY
Sales
More
```

Do not expose every secondary navigation item at equal prominence.

------------------------------------------------------------------------

# 51. TYPOGRAPHY SYSTEM

Define a stable type scale.

Recommended conceptual hierarchy:

``` text
Display
H1
H2
H3
Body Large
Body
Body Small
Caption
Label
Numeric
```

Typography should create hierarchy without relying on decorative
effects.

------------------------------------------------------------------------

# 52. DATA TYPOGRAPHY

Business metrics require strong numeric readability.

Use consistent treatment for:

``` text
Revenue
Percentage
Quantity
Currency
Dates
```

Examples:

``` text
₹1,20,000
+18%
340 sales
4 remaining
```

Numbers should be easy to scan.

------------------------------------------------------------------------

# 53. COLOR SYSTEM

Use semantic tokens:

``` text
Primary
Primary Foreground

Background
Surface
Surface Elevated

Text Primary
Text Secondary
Text Muted

Border

Success
Warning
Error
Info
```

Business meaning should remain consistent.

For example:

``` text
Success → positive state
Warning → attention
Error → failure
Info → neutral information
```

Do not use color randomly.

------------------------------------------------------------------------

# 54. COLOR RESTRAINT

Avoid:

``` text
Multiple accent colors
Random gradients
Neon highlights
Excessive glow
```

One strong brand language is preferable to visual noise.

------------------------------------------------------------------------

# 55. SPACING SYSTEM

Use a systematic scale such as:

``` text
4
8
12
16
24
32
48
64
80
96
```

Exact implementation tokens may differ.

The key requirement is consistency.

------------------------------------------------------------------------

# 56. GRID SYSTEM

Define:

``` text
Max content width
Page padding
Column structure
Gutters
Section spacing
Card gaps
```

Recommended behavior:

``` text
Mobile → single column
Tablet → 2-column where useful
Desktop → multi-column
Large desktop → constrained content width
```

Do not allow dashboards to stretch infinitely.

------------------------------------------------------------------------

# 57. CARDS

A card must earn its containment.

Use cards for:

``` text
Metric
Insight
Recommendation
Product summary
Important grouped information
```

Do not put every paragraph inside a card.

------------------------------------------------------------------------

# 58. BORDERS AND SHADOWS

Prefer subtle hierarchy.

Use:

``` text
Border
Surface contrast
Small elevation
```

before:

``` text
Heavy shadows
Glow
Glass effects
```

Every shadow should communicate elevation or interaction.

------------------------------------------------------------------------

# 59. BORDER RADIUS

Define an intentional radius system.

Example:

``` text
Small
Medium
Large
Pill
```

Do not use fully rounded shapes for every element.

------------------------------------------------------------------------

# 60. BUTTON SYSTEM

Variants:

``` text
Primary
Secondary
Destructive
Ghost
Link
```

States:

``` text
Default
Hover
Focus
Active
Disabled
Loading
```

Button labels should describe actions:

``` text
Add Product
Record Sale
Ask KEETY
Generate Strategy
View Report
```

Prefer these over:

``` text
Submit
Continue
Proceed
```

when more specific wording is possible.

------------------------------------------------------------------------

# 61. FORM DESIGN

Forms should include:

``` text
Label
Input
Helper text where needed
Validation
Error
Loading
Success
```

Do not use placeholder text as the only label.

------------------------------------------------------------------------

# 62. FORM ERROR DESIGN

Bad:

``` text
Invalid input
```

Better:

``` text
Price must be greater than or equal to 0.
```

The error should communicate:

``` text
What went wrong
+
How to fix it
```

------------------------------------------------------------------------

# 63. LOADING STATES

Every asynchronous experience needs a designed state.

Examples:

``` text
Dashboard → Skeleton
Table → Row skeleton
AI → Thinking state
Form → Loading button
Report → Generation state
```

Do not use a full-screen spinner for every request.

------------------------------------------------------------------------

# 64. EMPTY STATES

Every empty state should explain:

``` text
What is empty?
Why?
What should I do next?
```

Example:

``` text
No products yet.

Add your first product so KEETY can start
understanding product performance.

[Add Product]
```

------------------------------------------------------------------------

# 65. ERROR STATES

Design distinct states for:

``` text
Network Error
Server Error
Validation Error
Permission Error
Not Found
AI Failure
```

Users should receive a useful recovery action where possible.

------------------------------------------------------------------------

# 66. SUCCESS STATES

Important actions should visibly complete.

Examples:

``` text
Product created
Sale recorded
Expense saved
Strategy generated
Report created
```

Use:

``` text
Toast
Inline status
Updated content
```

Do not over-animate trivial successes.

------------------------------------------------------------------------

# 67. DESTRUCTIVE ACTIONS

For deletion or irreversible operations:

``` text
Action
 ↓
Consequence
 ↓
Confirmation
 ↓
Destructive button
```

Prefer deactivation for products where appropriate so historical sales
remain meaningful.

------------------------------------------------------------------------

# 68. ACCESSIBILITY

Design to appropriate WCAG principles.

Check:

``` text
Keyboard navigation
Focus visibility
Semantic HTML
Form labels
Error association
Contrast
Touch targets
Reduced motion
Screen-reader structure
```

Accessibility is not a later phase.

------------------------------------------------------------------------

# 69. KEYBOARD TEST

The entire application should be usable without a mouse.

Test:

``` text
Navigation
Menus
Forms
Modals
Tables
AI input
Buttons
Dialogs
```

------------------------------------------------------------------------

# 70. FOCUS MANAGEMENT

Especially for:

``` text
Modal
Drawer
Dropdown
Menu
Form
AI composer
```

Focus must move intentionally and return appropriately after dismissal.

------------------------------------------------------------------------

# 71. TOUCH DESIGN

For mobile:

``` text
Comfortable touch targets
Adequate spacing
No accidental taps
Readable controls
Keyboard-safe forms
```

Do not design tiny desktop controls and expect mobile users to tolerate
them.

------------------------------------------------------------------------

# 72. MOTION SYSTEM

Motion should communicate:

``` text
Feedback
Transition
Hierarchy
State
Progress
```

Avoid animation for decoration alone.

Respect:

``` text
prefers-reduced-motion
```

------------------------------------------------------------------------

# 73. AI MOTION

AI-specific motion can communicate:

``` text
Thinking
Generating
Streaming
Completed
Failed
```

Do not imply that the model is doing a specific internal process unless
the product actually knows that state.

------------------------------------------------------------------------

# 74. DATA VISUALIZATION ACCESSIBILITY

Charts should provide:

``` text
Title
Context
Units
Text alternative / summary where appropriate
```

Never rely solely on color to distinguish series or statuses.

------------------------------------------------------------------------

# 75. REAL DATA DESIGN TEST

Test the UI with:

``` text
0 products
1 product
10 products
1,000 products

₹0
₹1,20,000
₹99,99,99,999

Very long product names
Very long customer names
Missing optional fields
No customers
No sales
No inventory
```

The layout must remain stable.

------------------------------------------------------------------------

# 76. OVERFLOW TEST

Check:

``` text
Tables
Cards
Buttons
Charts
Navigation
Modals
AI responses
Reports
```

No accidental horizontal overflow.

Long content must wrap, truncate, or expand intentionally.

------------------------------------------------------------------------

# 77. RESPONSIVE BREAKPOINTS

Review at least:

``` text
320px
375px
390px
430px
768px
1024px
1280px
1440px
Large desktop
```

Do not treat mobile as merely scaled desktop.

------------------------------------------------------------------------

# 78. RESPONSIVE COMPONENT CONTRACT

For each major component document:

``` text
Desktop behavior
Tablet behavior
Mobile behavior
Overflow behavior
Interaction changes
```

Example:

``` text
Sidebar
Desktop → persistent
Tablet → collapsible
Mobile → drawer / compact navigation
```

------------------------------------------------------------------------

# 79. DARK MODE

If implemented, dark mode must be designed intentionally.

Review:

``` text
Background
Surface
Text
Borders
Charts
Inputs
Focus states
Warnings
Errors
AI cards
```

Do not simply invert the light theme.

------------------------------------------------------------------------

# 80. ICONOGRAPHY

Use one coherent icon system.

Recommended:

``` text
Lucide or equivalent consistent icon library
```

Do not randomly mix:

``` text
Emoji
Font Awesome
Random SVG
Multiple icon libraries
```

unless there is a deliberate reason.

------------------------------------------------------------------------

# 81. CONTENT DESIGN

Use business language.

Prefer:

``` text
Revenue
Sales
Customers
Inventory
Expenses
Growth
```

Avoid unnecessary technical language.

KEETY should sound like a useful business assistant, not a developer
console.

------------------------------------------------------------------------

# 82. COGNITIVE LOAD

Avoid:

``` text
Too many charts
Too many filters
Too many buttons
Too many colors
Too many notifications
Too many simultaneous AI recommendations
```

Prioritize.

The user should know what deserves attention.

------------------------------------------------------------------------

# 83. PROGRESSIVE DISCLOSURE

Advanced information should appear when useful.

Examples:

``` text
Basic analytics
    ↓
View details

Basic recommendation
    ↓
Why this recommendation?

Basic report
    ↓
View full analysis
```

Do not overwhelm first-time users.

------------------------------------------------------------------------

# 84. TRUST DESIGN

KEETY handles business information and AI-generated recommendations.

Trust should come from:

``` text
Clear data basis
Predictable interactions
Transparent errors
Consistent terminology
Accurate states
```

Do not fake trust with decorative security icons.

------------------------------------------------------------------------

# 85. AI TRUST DESIGN

AI recommendations should clearly be presented as:

``` text
Insights
Recommendations
Potential opportunities
```

Do not make uncertain AI output look like guaranteed fact.

When appropriate:

``` text
Based on recent sales and current inventory
```

------------------------------------------------------------------------

# 86. BACKEND STATE CONTRACT

The UI must reflect real backend states.

Example:

``` text
PROCESSING
    ↓
Loading / progress UI

COMPLETED
    ↓
Success UI

FAILED
    ↓
Error + retry UI

RETRYING
    ↓
Retry status
```

Never invent backend states purely for animation.

------------------------------------------------------------------------

# 87. SECURITY CONTRACT

The frontend may hide unavailable actions for usability.

But:

> **Hiding a button is not security.**

Authorization must remain enforced by the backend.

The design must never expose:

``` text
API secrets
Gemini keys
Database credentials
Internal system details
```

------------------------------------------------------------------------

# 88. PERFORMANCE-AWARE DESIGN

Design decisions must remain compatible with:

``` text
React
Next.js where used
Tailwind CSS
REST APIs
Server / Client boundaries
```

Avoid unnecessary:

``` text
Client-side JavaScript
Large animation libraries
Huge image assets
Complex effects
```

A beautiful slow interface is not a successful design.

------------------------------------------------------------------------

# 89. NEXT.JS DESIGN CONTRACT

If Next.js is used:

Prefer appropriate use of:

``` text
Server Components
Client Components
Loading states
Error boundaries
Image optimization
Font optimization
Streaming
Suspense
```

Do not turn every component into a Client Component merely for
convenience.

------------------------------------------------------------------------

# 90. DESIGN SYSTEM STRUCTURE

## Foundations

``` text
Colors
Typography
Spacing
Radius
Elevation
Motion
Breakpoints
```

## UI primitives

``` text
Button
Input
Select
Checkbox
Switch
Badge
Tooltip
Avatar
```

## Feedback

``` text
Toast
Alert
Skeleton
Empty State
Error State
```

## Navigation

``` text
Sidebar
Top Bar
Tabs
Breadcrumbs
Pagination
```

## KEETY business components

``` text
MetricCard
InsightCard
RecommendationCard
RevenueChart
ProductPerformance
InventoryAlert
AIResponse
StrategyCard
ReportCard
```

------------------------------------------------------------------------

# 91. COMPONENT DESIGN CONTRACT

Every important component must define:

``` text
Purpose
Props
Variants
States
Responsive behavior
Accessibility
Interaction
Data requirements
```

Example:

``` text
RecommendationCard

Purpose:
Show one actionable business recommendation.

Variants:
Default
High Priority
Completed

States:
Loading
Loaded
Error

Mobile:
Stack content vertically

Action:
View Product / View Analytics
```

------------------------------------------------------------------------

# 92. DESIGN TOKEN IMPLEMENTATION

Tokens should be centralized.

Conceptually:

``` text
color.primary
color.background
color.surface
color.text.primary
color.text.secondary
color.success
color.warning
color.error

space.1
space.2
space.3
space.4
...

radius.sm
radius.md
radius.lg

shadow.sm
shadow.md
shadow.lg

motion.fast
motion.normal
motion.slow
```

If the brand changes, the system should not require editing dozens of
unrelated components.

------------------------------------------------------------------------

# 93. VISUAL CONSISTENCY AUDIT

Audit the entire product for:

``` text
Button height
Button radius
Heading styles
Input height
Card radius
Spacing
Colors
Shadows
Icons
Toast style
Modal style
Empty states
Error states
```

Similar things must look similar.

------------------------------------------------------------------------

# 94. TEMPLATE DETECTION TEST

Look for:

``` text
Generic gradient hero
Generic purple/blue SaaS palette
Three identical cards
Huge rounded containers
Random floating blobs
Decorative dashboard charts
```

These patterns are not automatically wrong.

But ask:

> **What belongs specifically to KEETY?**

Distinctiveness should come from the product's information and
interaction model.

------------------------------------------------------------------------

# 95. KEETY DISTINCTIVENESS

KEETY's strongest design opportunity is:

``` text
Business data
       ↓
KEETY interpretation
       ↓
Action
```

The interface should visually reinforce this relationship.

For example:

``` text
Metric
 ↓
Insight
 ↓
Recommendation
 ↓
Action button
```

This can become a recognizable KEETY pattern across the application.

------------------------------------------------------------------------

# 96. DASHBOARD DISTINCTIVENESS

Instead of:

``` text
Chart
Chart
Chart
Chart
```

prefer:

``` text
Business Summary
      ↓
Important Change
      ↓
Why
      ↓
What KEETY Recommends
      ↓
Take Action
```

This makes the product feel like a business assistant rather than a
reporting tool.

------------------------------------------------------------------------

# 97. "WHO DESIGNED THIS?" TEST

Remove:

``` text
Logo
Company name
Brand copy
```

Look only at:

``` text
Typography
Layout
Components
Information hierarchy
Interaction patterns
```

Ask:

> Would the product still have a recognizable design language?

If not, strengthen the system rather than adding decoration.

------------------------------------------------------------------------

# 98. MOBILE-FIRST TEST

At 375px:

``` text
Can I understand my business?
Can I see the important metric?
Can I see the important insight?
Can I ask KEETY?
Can I record a sale?
Can I reach core navigation?
```

If the answer requires zooming or horizontal scrolling everywhere,
redesign.

------------------------------------------------------------------------

# 99. 5-SECOND TEST

For every major page:

> In five seconds, can the user understand what this page is?

If not:

``` text
Fix hierarchy.
Fix heading.
Fix navigation.
Fix content grouping.
```

Do not solve a hierarchy problem with more color.

------------------------------------------------------------------------

# 100. 3-SECOND PRIMARY ACTION TEST

Ask:

> Can the user identify the primary action immediately?

There should not be:

``` text
7 competing buttons
4 equally prominent cards
3 primary CTAs
```

One page should have a clear dominant action when a dominant action
exists.

------------------------------------------------------------------------

# 101. DESIGN FOR FAILURE

Every major experience must support:

``` text
Loading
Success
Empty
Error
Unauthorized
Offline where relevant
Partial data
Slow response
```

A professional product is not only designed for the happy path.

------------------------------------------------------------------------

# 102. VISUAL REGRESSION

After major changes, compare:

``` text
Before
vs
After
```

Check:

``` text
Spacing
Typography
Component alignment
Responsive behavior
Colors
State styling
Navigation
```

New features must not quietly degrade existing screens.

------------------------------------------------------------------------

# 103. DESIGN DEBT

Track:

``` text
Duplicate components
One-off styles
Random spacing
Random colors
Deprecated UI
Unused tokens
Inconsistent states
```

Fix design debt systematically.

------------------------------------------------------------------------

# 104. LESS-BUT-BETTER TEST

Remove one:

``` text
Animation
Color
Border
Card
Decorative element
```

Ask:

> Did the product become harder to use?

If no:

> It probably did not need to exist.

------------------------------------------------------------------------

# 105. REAL USER TEST

### First-time owner

Can I understand KEETY?

### Returning owner

Can I quickly find what matters?

### Power user

Can I work efficiently?

### Mobile user

Can I use it comfortably?

### Keyboard user

Can I navigate everything?

### Screen-reader user

Can I understand the interface?

### User with no data

Does onboarding help me?

### User with lots of data

Does the interface remain manageable?

### User experiencing an error

Does the product help me recover?

------------------------------------------------------------------------

# 106. DESIGN ↔ FRONTEND CONTRACT

Every major design decision must be realistically implementable.

Ask:

``` text
Can React implement this cleanly?
Can Tailwind represent this system consistently?
Does this require unnecessary client-side JavaScript?
Does this harm accessibility?
Does this hurt performance?
Can it be tested?
```

Beautiful but impractical design is bad product design.

------------------------------------------------------------------------

# 107. DESIGN ↔ BACKEND CONTRACT

The frontend must reflect real API states.

Examples:

``` text
Analytics loading
Analytics loaded
Analytics empty
Analytics failed
```

``` text
AI processing
AI completed
AI failed
```

``` text
Report processing
Report completed
Report failed
```

The visual design must map to real system behavior.

------------------------------------------------------------------------

# 108. DESIGN ↔ DATABASE CONTRACT

The UI should respect the underlying domain concepts:

``` text
User
Business
Product
Sale
Customer
Expense
Inventory
Analytics
AI Insight
Recommendation
Report
```

Do not invent UI concepts that have no supporting product/domain model
unless they are explicitly planned as presentation-only concepts.

------------------------------------------------------------------------

# 109. DESIGN ↔ TESTING CONTRACT

Important components must have predictable states.

Example:

``` text
MetricCard
├── Loading
├── Loaded
├── Empty
├── Error
└── Updated
```

``` text
Button
├── Default
├── Hover
├── Focus
├── Active
├── Disabled
└── Loading
```

``` text
AI Response
├── Empty
├── Thinking
├── Streaming / Generating where supported
├── Complete
├── Error
└── Retry
```

------------------------------------------------------------------------

# 110. DESIGN REVIEW WORKFLOW

``` mermaid
flowchart TD

    A[Understand KEETY]
        ↓
    B[Identify Business Owner Goals]
        ↓
    C[Map User Journey]
        ↓
    D[Define Information Architecture]
        ↓
    E[Create Sitemap]
        ↓
    F[Inventory Pages]
        ↓
    G[Define Design Tokens]
        ↓
    H[Define Typography]
        ↓
    I[Define Color]
        ↓
    J[Define Layout]
        ↓
    K[Define Components]
        ↓
    L[Design Dashboard]
        ↓
    M[Design AI UX]
        ↓
    N[Design Loading / Empty / Error]
        ↓
    O[Design Responsive Behavior]
        ↓
    P[Accessibility Review]
        ↓
    Q[Performance Review]
        ↓
    R[Backend State Review]
        ↓
    S[Frontend Implementation Review]
        ↓
    T[Distinctiveness Audit]
        ↓
    U[Brutal UX Review]
        ↓
    V{Professional Quality?}
        ↓
    |No| W[Redesign]
    W --> G
    V -->|Yes| X[Approve]
```

------------------------------------------------------------------------

# 111. PAGE REVIEW WORKFLOW

For every important page:

``` mermaid
flowchart TD

    A[Page Purpose]
        ↓
    B[User Goal]
        ↓
    C[Information Hierarchy]
        ↓
    D[Primary Action]
        ↓
    E[Layout]
        ↓
    F[Typography]
        ↓
    G[Visual Hierarchy]
        ↓
    H[Interaction]
        ↓
    I[Loading]
        ↓
    J[Empty]
        ↓
    K[Error]
        ↓
    L[Success]
        ↓
    M[Unauthorized]
        ↓
    N[Responsive]
        ↓
    O[Accessibility]
        ↓
    P[Performance]
        ↓
    Q[Distinctiveness]
        ↓
    R[Implementation Feasibility]
        ↓
    S[Final Review]
```

Do not skip states because the happy path looks good.

------------------------------------------------------------------------

# 112. COMPONENT REVIEW WORKFLOW

``` mermaid
flowchart TD

    A[Purpose]
        ↓
    B[Usage]
        ↓
    C[Props]
        ↓
    D[Variants]
        ↓
    E[Default]
        ↓
    F[Hover]
        ↓
    G[Focus]
        ↓
    H[Active]
        ↓
    I[Disabled]
        ↓
    J[Loading]
        ↓
    K[Error]
        ↓
    L[Mobile]
        ↓
    M[Accessibility]
        ↓
    N[Performance]
        ↓
    O[Testing]
```

------------------------------------------------------------------------

# 113. DESIGN SCORE

Only score the **implemented product after a complete review**.

### 0--2 --- Poor

Fundamentally confusing, broken, or unusable.

### 3--4 --- Basic

Functional but generic, inconsistent, or difficult to use.

### 5--6 --- Good

Usable and coherent but with meaningful design weaknesses.

### 7--8 --- Strong

Polished, consistent, responsive, accessible, and intentional.

### 9 --- Exceptional

Distinctive, deeply considered, technically sound, and highly polished.

### 10 --- Extremely rare

Outstanding product design across:

``` text
UX
Visual Design
Interaction
Accessibility
Responsive behavior
AI UX
Performance
Implementation discipline
```

Do not give a high score because a screenshot looks impressive.

------------------------------------------------------------------------

# 114. THE TEMPLATE TEST

Ask:

> If I replace the KEETY logo and copy with another SaaS company's
> branding, would the interface still look almost identical?

If yes:

The design lacks product identity.

Fix identity through:

``` text
Information architecture
Typography
Business insight patterns
AI interaction
Layout rhythm
Content hierarchy
```

Not random decoration.

------------------------------------------------------------------------

# 115. THE DRIBBBLE TEST

A screenshot can look beautiful while the product is difficult to use.

Therefore:

> **Optimize for the real workflow, not the screenshot.**

A beautiful dashboard that makes the owner spend 30 seconds finding the
important action is a bad design.

------------------------------------------------------------------------

# 116. DESIGN FOR REAL BUSINESS DATA

Test:

``` text
No sales
One sale
Thousands of sales

No products
One product
Thousands of products

Zero revenue
Small revenue
Very large revenue

No customers
One customer
Many customers

No inventory
Low stock
Large inventory

Long names
Missing fields
Large numbers
Unexpected values
```

The interface must remain readable.

------------------------------------------------------------------------

# 117. LOCALIZATION READINESS

Business data may eventually require:

``` text
Different currencies
Different date formats
Different number formats
Different languages
Longer labels
```

Do not hardcode layouts around one exact sentence length.

------------------------------------------------------------------------

# 118. CONTENT HIERARCHY

Every screen should communicate:

``` text
Where am I?
 ↓
What is happening?
 ↓
What matters?
 ↓
What can I do?
```

This is especially important for:

``` text
Dashboard
Analytics
Ask KEETY
Growth
Reports
```

------------------------------------------------------------------------

# 119. KEETY'S SIGNATURE PATTERN

Create a reusable visual pattern:

``` text
DATA
 ↓
KEETY INSIGHT
 ↓
RECOMMENDATION
 ↓
ACTION
```

Example:

``` text
Revenue
₹1,20,000
↑ 18%

KEETY Insight
Black Hoodie drove the largest increase.

Recommendation
Review stock before demand causes a shortage.

[View Inventory]
```

This pattern should become part of KEETY's visual identity.

------------------------------------------------------------------------

# 120. FINAL DESIGN DIRECTOR TEST

Forget that you designed the interface.

Review it as a Design Director before launch.

Inspect:

``` text
Landing
 ↓
Authentication
 ↓
Onboarding
 ↓
Dashboard
 ↓
Products
 ↓
Sales
 ↓
Customers
 ↓
Expenses
 ↓
Inventory
 ↓
Analytics
 ↓
Ask KEETY
 ↓
Growth
 ↓
Reports
 ↓
Settings
 ↓
Errors
 ↓
Mobile
 ↓
Accessibility
```

Do not stop at the homepage.

------------------------------------------------------------------------

# 121. FINAL BRUTAL QUESTIONS

## UX

1.  Can a new business owner understand KEETY quickly?
2.  Is the primary action obvious?
3.  Is navigation understandable?
4.  Is the information hierarchy intentional?
5.  Is cognitive load reasonable?

## Visual Design

6.  Is typography genuinely good?
7.  Is spacing consistent?
8.  Is color controlled?
9.  Are components consistent?
10. Is visual hierarchy strong?

## Distinctiveness

11. Does KEETY have recognizable identity?
12. Does it look like a generic SaaS template?
13. Could someone recognize KEETY without the logo?
14. Does the Data → Insight → Action pattern feel distinctive?

## Responsive

15. Does mobile feel intentionally designed?
16. Does tablet work?
17. Does large desktop work?

## Accessibility

18. Can the product be used with a keyboard?
19. Are focus states visible?
20. Is contrast sufficient?
21. Are forms accessible?
22. Is motion respectful?

## States

23. Are loading states designed?
24. Are empty states designed?
25. Are error states designed?
26. Are success states designed?
27. Are unauthorized states designed?

## AI

28. Does AI feel like a business assistant rather than a generic
    chatbot?
29. Are AI responses easy to scan?
30. Is AI uncertainty represented honestly?
31. Is the data basis understandable?
32. Are AI failures recoverable?

## Technical

33. Can the design be implemented cleanly in React/Next.js?
34. Does it avoid unnecessary client-side complexity?
35. Will it remain performant?
36. Can components be reused without over-engineering?

## Product

37. Does the design improve the owner's workflow?
38. Does every decorative element earn its place?
39. Does the interface communicate trust?
40. Would you put your name on the product?

------------------------------------------------------------------------

# 122. FINAL APPROVAL GATE

Do not approve because:

-   The landing page looks beautiful.
-   The colors look premium.
-   The animations are impressive.
-   The cards look modern.
-   The dashboard looks sophisticated.

Approve only when:

``` text
Product purpose is clear
+
User journey is clear
+
Information architecture is coherent
+
Every important page has a purpose
+
Every important page has a strong hierarchy
+
Loading states exist
+
Empty states exist
+
Error states exist
+
Success states exist
+
Unauthorized states exist
+
Responsive behavior is intentional
+
Accessibility is considered
+
Typography is coherent
+
Color usage is controlled
+
Spacing is systematic
+
Components are consistent
+
KEETY has recognizable identity
+
AI UX is trustworthy
+
Backend states are represented accurately
+
Real data is supported
+
The design is implementable
+
Performance is considered
```

------------------------------------------------------------------------

# 123. FINAL DESIGN PRINCIPLE

Do not optimize for:

> Modern.

Do not optimize for:

> Minimal.

Do not optimize for:

> Premium.

Do not optimize for:

> Beautiful.

Do not optimize for:

> Trendy.

Optimize for:

> **Clarity + hierarchy + usability + consistency + accessibility +
> personality + responsiveness + performance + trust.**

The interface should make the user's next step feel obvious.

------------------------------------------------------------------------

# 124. FINAL KEETY PRINCIPLE

KEETY is successful when the interface makes this journey feel natural:

``` text
I have business data.
        ↓
KEETY helps me understand it.
        ↓
KEETY tells me what matters.
        ↓
KEETY explains why.
        ↓
KEETY recommends what I can do.
        ↓
I take action.
```

The product should never feel like:

``` text
Data
↓
More Data
↓
More Charts
↓
More Charts
```

It should feel like:

``` text
Data
↓
Understanding
↓
Decision
↓
Action
```

------------------------------------------------------------------------

# 125. FINAL COMMAND

You are NOT finished when the website looks good.

You are finished when:

> **The interface makes business goals obvious, the visual system is
> coherent, KEETY has a recognizable identity, important states are
> designed, AI interactions are trustworthy, accessibility has been
> considered, the experience works across devices, and the
> implementation can realistically support the design without
> unnecessary technical complexity.**

If something is wrong:

**Say exactly what is wrong.**

If something should be removed:

**Remove it.**

If something should be redesigned:

**Redesign it.**

If a page needs to be rebuilt:

**Rebuild it.**

If a visual pattern is generic:

**Replace it with something that belongs to KEETY.**

If the design is genuinely excellent:

**Explain exactly why.**

Only after challenging the major product, UX, visual, AI, responsive,
accessibility, and implementation decisions should you approve:

# `design.md`

------------------------------------------------------------------------

# FINAL KEETY DESIGN STANDARD

``` text
Clear
+
Useful
+
Actionable
+
Trustworthy
+
Distinctive
+
Accessible
+
Responsive
+
Performant
+
Implementable
```

## The ultimate test

> **If the KEETY logo and company name were removed, would a business
> owner still recognize the product from its information hierarchy, AI
> interaction, visual rhythm, and Data → Insight → Action experience?**

If the answer is no:

``` text
Do not add decoration.

Improve the product design.
```

If the answer is yes:

``` text
Continue testing the actual user experience.
```
