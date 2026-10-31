# Brightloop Subscription Management System
### Enterprise Subscription Lifecycle, Automated Recurring Billing & Revenue Engine
#### **Built by Team Ripple**

---

## 1. Project Overview

### Project Name
**Brightloop Subscription Management System**

### Business Problem
Prior to this platform, **Brightloop Software** managed subscriptions across sprawling spreadsheets, remembered renewal milestones manually, drafted invoices by hand, matched bank receipts manually, and struggled to prepare quarterly revenue reports. This manual approach resulted in:
- Uncollected receivables and delayed invoicing.
- Human calculation errors in multi-jurisdiction taxes and complex discounts.
- Lack of auditability and inconsistent pricing history when catalog items changed.
- Blind spots in Monthly Recurring Revenue (MRR), Annual Recurring Revenue (ARR), and cohort churn.
- Customer frustration due to lack of a self-service billing portal.

### Objectives
To eliminate operational fragmentation by deploying **one unified, enterprise-grade B2B SaaS platform** that manages the complete subscription lifecycle:
1. Multi-role Authentication & Server-Enforced RBAC (Admin, Staff, Customer).
2. Product & Multi-Variant Catalog Management with pricing add-ons (e.g., Odoo connectors).
3. Subscription Plan Architecture across all 4 billing frequencies (Daily, Weekly, Monthly, Yearly).
4. Automated Month-End Date Clamping and Leap Year compensation.
5. Reusable Quotation Templates and 1-Click Quotation-to-Subscription conversion.
6. Controlled Subscription Finite State Machine (`Draft → Quotation → Confirmed → Active → Closed / Paused`).
7. Idempotent Automated Recurring Billing Engine powered by Cloud Functions and Cloud Scheduler.
8. Tax Invoicing with immutable historical line-item snapshots.
9. Backend-calculated Multi-Component Taxes and Precision Arithmetic (minor currency units).
10. Automated Discount Coupon Eligibility, Minimum Spend Rules, and Hard Usage Caps.
11. Manual Payment Recording & Bank Reconciliation with strict overpayment guards.
12. Overdue Receivable Tracking and Dunning Visibility.
13. Executive Dashboards with real-time MRR, ARR, Cashflow, and Cohort Analytics.
14. Isolated Customer Self-Service Portal.

---

## 2. Features by Major Module

| Module | Purpose & Core Capabilities |
|---|---|
| **Authentication & RBAC** | Email & password registration with mandatory complexity rules (>8 chars, uppercase, lowercase, special char). Server-controlled custom claims (`admin`, `staff`, `customer`). Admin-only staff provisioning. |
| **Product & Variant Catalog** | Software, service, and add-on classification. Multi-variant pricing deltas (e.g. Odoo connector +₹560). Cost and sales price margins. Search and SKU indexing. |
| **Plan Architecture** | Daily, Weekly, Monthly, Yearly cadences. Minimum quantity thresholds. Lifecycle permissions (`allowPause`, `allowEarlyClosure`, `allowRenewal`, `autoCloseOnExpiry`). |
| **Billing Frequency Engine** | Precise calendar month-end clamping (e.g. Jan 31 renewal on Feb 28/29) with original anchor-day preservation for subsequent full months (Mar 31). Leap-year awareness. |
| **Quotation Engine** | Reusable templates with preconfigured lines and terms. Unique numbering (`QT-YYYY-XXXX`). Expiry enforcement. One-click conversion to active subscriptions. |
| **Subscription Lifecycle** | Finite state machine with transition guards. Non-destructive closing, pause/resume controls, renewal enforcement, and append-only audit trail. |
| **Automated Recurring Billing** | Cloud Functions & Cloud Scheduler batch runner. Queries active subscriptions where `nextBillingDate <= now`. Generates sequential invoices (`INV-YYYY-XXXX`) and advances cycle dates. |
| **Idempotency & Duplicate Guard** | Deterministic billing period identifiers (`BP_<subscriptionId>_<YYYY-MM-DD>`). Atomic Firestore transactions guarantee zero duplicate invoices on retries. |
| **Tax Management** | Multi-component percentage and fixed tax rules (e.g. GST 18%, Cess). Applicable product scoping. Integer cents / paise precision arithmetic. |
| **Discount Management** | Percentage and fixed credit coupons. Minimum purchase value, minimum seat requirements, validity dates, and atomic usage counters with limit locks. |
| **Payment Reconciliation** | Manual payment recording with bank references/UTR. Reconciles partial and full payments, decrements invoice balances, updates customer lifetime spend, and prevents overpayment. |
| **Executive Dashboards** | Live MRR, ARR, actual cash collected vs invoiced revenue, overdue counts, Recharts cashflow graphs, and subscription lifecycle distribution. |
| **Customer Portal** | Isolated client experience (`request.auth.uid == customerId`). View active software licenses, download tax invoices, and inspect payment receipts. |

---

## 3. Technology Stack

| Technology | Layer | Purpose & Rationale |
|---|---|---|
| **React 18** | Frontend Presentation | Modern component-based declarative UI with high rendering performance. |
| **TypeScript 5** | End-to-End Type Safety | Strict typing across shared frontend and Cloud Functions domain models. |
| **Vite 5** | Build System | Sub-3-second production bundling, optimized manual vendor chunking, and instant HMR. |
| **Tailwind CSS** | Styling System | Design token system with clean dark/light SaaS palettes and responsive layouts. |
| **Recharts** | Data Visualization | Composable SVG charts for MRR trends, cashflow comparisons, and status distributions. |
| **date-fns** | Temporal Calculations | Deterministic recurring date calculations, leap year detection, and day clamping. |
| **Firebase Auth** | Identity & Security | Secure email/password authentication, password complexity enforcement, and custom claims. |
| **Cloud Firestore** | Primary Database | Serverless, low-latency NoSQL document database with compound querying and atomic transactions. |
| **Cloud Functions (TS)** | Backend Business Logic | Server-controlled financial calculations, staff provisioning, and background batch processing. |
| **Cloud Scheduler** | Automation | Cron triggers for automated daily recurring billing batches. |
| **Firebase Storage** | Document Storage | Secure PDF invoice generation and customer document archiving. |
| **Vitest** | Automated Testing | High-speed unit and integration testing of billing engines, financial math, and E2E scenarios. |

---

## 4. Technology Comparison & Architectural Trade-offs

| Architectural Area | Selected Technology | Realistic Alternatives Considered | Detailed Trade-off Analysis & Justification |
|---|---|---|---|
| **Database** | **Cloud Firestore** | PostgreSQL (Supabase / RDS), MongoDB | **Why Selected:** Fully managed serverless scalability, instant real-time snapshot listeners, and tight integration with Firebase Auth rules without hosting separate connection pools. <br>**Trade-off Acknowledged:** Relational databases (PostgreSQL) naturally excel at arbitrary multi-table `JOIN`s and strict ACID schema enforcement. In Firestore, reporting queries require precomputed aggregation documents (`/dashboardMetrics/current`) and denormalized snapshots (`customerSnapshot`, `taxSnapshot`) to achieve sub-second response times without expensive multi-thousand document table scans. |
| **Backend Compute** | **Cloud Functions (TypeScript)** | Dedicated Express.js Server, Cloud Run | **Why Selected:** Event-driven serverless architecture eliminates idle server costs, scales automatically with billing batch spikes, and integrates natively with Cloud Scheduler. Privileged operations (custom claims, payment reconciliation) remain 100% server-controlled. <br>**Trade-off Acknowledged:** Serverless functions can experience cold starts (typically 1-2s). We mitigate this by keeping callable payloads compact and executing recurring billing as background batches. |
| **Frontend Framework** | **React + Vite** | Next.js (SSR), Angular, Vue | **Why Selected:** Fast single-page application (SPA) architecture ideal for authenticated B2B SaaS dashboards. Vite produces optimized production chunks (<500 kB per vendor bundle) with instant client-side routing. <br>**Trade-off Acknowledged:** Next.js offers SSR for public SEO; however, a subscription management system is an internal/authenticated portal where client-side interactivity and SPA caching (TanStack Query) deliver superior user experience. |
| **Financial Math** | **Integer Minor Units (Paise/Cents)** | JavaScript `Number` (Float), `big.js` | **Why Selected:** Eliminates JavaScript binary floating-point inaccuracies (e.g. `0.1 + 0.2 === 0.30000000000000004`) by storing all monetary figures as integers in minor units (100 paise = ₹1.00). Clean, zero-overhead, and interoperable across frontend, Firestore, and Cloud Functions. |

---

## 5. Architecture Explanation

### 5.1 System Architecture Diagram

```mermaid
flowchart TD
    subgraph Client["Presentation Layer (React 18 + TypeScript + Vite)"]
        UI_Admin["Admin Dashboard & Catalog"]
        UI_Staff["Staff Operations & Quotations"]
        UI_Cust["Customer Self-Service Portal"]
        Auth_Ctx["AuthContext (Role Detection & Custom Claims)"]
    end

    subgraph Firebase_Security["Firebase Security Boundary"]
        F_Auth["Firebase Authentication (Custom Claims)"]
        Sec_Rules["Firestore Security Rules (RBAC Guard)"]
        Storage_Rules["Storage Security Rules"]
    end

    subgraph Backend_Functions["Cloud Functions (TypeScript Backend)"]
        CF_Billing["runRecurringBilling (Scheduled & Callable)"]
        CF_Quotation["convertQuotationToSubscription"]
        CF_Payment["recordManualPayment & Reconciliation"]
        CF_Admin["createStaffUser & bootstrapAdmin"]
    end

    subgraph Database["Cloud Firestore (15 Collections)"]
        Col_Users["users/"]
        Col_Cust["customers/"]
        Col_Prod["products/ & plans/"]
        Col_Quot["quotations/ & quotationTemplates/"]
        Col_Subs["subscriptions/"]
        Col_Invs["invoices/"]
        Col_Pays["payments/"]
        Col_TaxDisc["taxRules/ & discountRules/"]
        Col_Metrics["dashboardMetrics/ (Aggregates)"]
        Col_Logs["billingJobs/ & auditLogs/"]
    end

    UI_Admin --> Auth_Ctx
    UI_Staff --> Auth_Ctx
    UI_Cust --> Auth_Ctx
    Auth_Ctx --> F_Auth

    UI_Admin --> Sec_Rules
    UI_Staff --> Sec_Rules
    UI_Cust --> Sec_Rules

    Sec_Rules --> Database

    UI_Staff -. Callable .-> CF_Quotation
    UI_Staff -. Callable .-> CF_Payment
    UI_Admin -. Callable .-> CF_Admin

    Cloud_Scheduler["Cloud Scheduler (Daily 00:00 UTC)"] --> CF_Billing
    CF_Billing --> Col_Subs
    CF_Billing --> Col_Invs
    CF_Billing --> Col_Logs
    CF_Billing --> Col_Cust
```

### 5.2 Subscription Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> Draft : Staff initializes draft
    Draft --> Quotation : Quotation template generated
    Quotation --> Confirmed : Customer approves quotation
    Quotation --> Expired : Expiry date passes
    Confirmed --> Active : Converted to live subscription
    Active --> Paused : Staff pauses (if allowPause=true)
    Paused --> Active : Staff resumes subscription
    Active --> Closed : Contract ends or early close (if permitted)
    Paused --> Closed : Contract terminated
    Closed --> [*] : Non-destructive archive & audit trail
```

### 5.3 Automated Recurring Billing Workflow

```mermaid
sequenceDiagram
    autonumber
    participant Sched as Cloud Scheduler (00:00 UTC)
    participant Func as Billing Engine (Cloud Function)
    participant Subs as subscriptions/ Collection
    participant Lock as Idempotency Engine
    participant Invs as invoices/ Collection
    participant Cust as customers/ Collection
    participant Log as billingJobs/ & auditLogs/

    Sched->>Func: Trigger automated recurring billing run
    Func->>Subs: Query active subscriptions where nextBillingDate <= now
    loop For each due subscription
        Func->>Lock: Compute deterministic billingPeriodId (BP_subId_YYYY-MM-DD)
        Lock->>Invs: Check if invoice with billingPeriodId exists
        alt Already Billed
            Lock-->>Func: Skip (Duplicate invoice prevented)
        else Eligible for Invoicing
            Func->>Func: Snapshot products, tax rules, and active discounts
            Func->>Func: Calculate integer total (subtotal - discount + tax)
            Func->>Invs: Create invoice (INV-YYYY-XXXX) with status 'confirmed'
            Func->>Subs: Advance nextBillingDate (with month-end clamping)
            Func->>Cust: Increment outstandingBalance
            Func->>Log: Append billingEvent audit record
        end
    end
    Func->>Log: Finalize billingJob summary record
```

---

## 6. Database Design (Firestore Document Architecture)

### 6.1 Conceptual Entity-Relationship Model

```mermaid
erDiagram
    USERS ||--o| CUSTOMERS : "represents / manages"
    CUSTOMERS ||--o{ SUBSCRIPTIONS : "contracts"
    CUSTOMERS ||--o{ QUOTATIONS : "receives"
    CUSTOMERS ||--o{ INVOICES : "billed to"
    CUSTOMERS ||--o{ PAYMENTS : "remits"

    PRODUCTS ||--o{ PRODUCT_VARIANTS : "has"
    PRODUCTS ||--o{ SUBSCRIPTION_PLANS : "packaged into"

    SUBSCRIPTIONS ||--o{ INVOICES : "generates recurring"
    INVOICES ||--o{ PAYMENTS : "reconciled by"
    INVOICES ||--o{ INVOICE_LINE_ITEMS : "contains"

    TAX_RULES }o--o{ INVOICES : "snapshotted into"
    DISCOUNT_RULES }o--o{ INVOICES : "snapshotted into"
```

### 6.2 Primary Collections Schema

#### 1. `users` (`/users/{uid}`)
- `uid`: string (Document ID matching Firebase Auth UID)
- `email`: string
- `displayName`: string
- `role`: `'admin' | 'staff' | 'customer'`
- `customerId`: string | null (Linked customer record for portal users)
- `isActive`: boolean
- `createdAt`, `updatedAt`: ISO Date string / Timestamp

#### 2. `customers` (`/customers/{customerId}`)
- `id`: string
- `companyName`: string
- `contactName`: string
- `email`: string
- `phone`: string
- `billingAddress`: `{ street, city, state, postalCode, country }`
- `taxNumber`: string (e.g. GSTIN / VAT ID)
- `userId`: string | null
- `status`: `'active' | 'inactive'`
- `totalSpent`: number (in paise / minor units)
- `outstandingBalance`: number (in paise)

#### 3. `products` (`/products/{productId}`)
- `id`: string
- `name`: string
- `code`: string (SKU)
- `productType`: `'software' | 'service' | 'addon'`
- `salesPrice`: number (base sales price in minor units)
- `costPrice`: number
- `currency`: string ('INR')
- `variants`: Array<{ id, name, description, additionalPrice, isActive }>
- `isActive`: boolean

#### 4. `plans` (`/plans/{planId}`)
- `id`: string
- `productId`: string
- `productName`: string
- `name`: string
- `salesPrice`: number
- `billingFrequency`: `'daily' | 'weekly' | 'monthly' | 'yearly'`
- `minimumQuantity`: number
- `availableFrom`: string
- `availableUntil`: string | null
- `allowEarlyClosure`: boolean
- `allowPause`: boolean
- `allowRenewal`: boolean
- `autoCloseOnExpiry`: boolean
- `isActive`: boolean

#### 5. `quotations` (`/quotations/{quotationId}`)
- `id`: string
- `quotationNumber`: string (`QT-YYYY-XXXX`)
- `customerId`: string
- `customerSnapshot`: `{ companyName, contactName, email, billingAddress, taxNumber }`
- `quotationDate`, `expiryDate`: string
- `status`: `'draft' | 'sent' | 'confirmed' | 'expired' | 'converted'`
- `lineItems`: Array<{ productId, productName, variantId, variantName, planId, quantity, unitPrice, subtotal, taxAmount, discountAmount, total }>
- `subtotal`, `taxTotal`, `discountTotal`, `grandTotal`: number
- `paymentTerms`: string
- `convertedSubscriptionId`: string | null

#### 6. `subscriptions` (`/subscriptions/{subscriptionId}`)
- `id`: string
- `subscriptionNumber`: string (`SUB-YYYY-XXXX`)
- `customerId`: string
- `customerSnapshot`: CustomerSnapshot
- `planId`: string
- `planSnapshot`: PlanSnapshot
- `productId`, `productName`: string
- `variantId`, `variantName`: string | null
- `status`: `'draft' | 'quotation' | 'confirmed' | 'active' | 'paused' | 'closed'`
- `quantity`: number
- `unitPrice`, `subtotal`, `taxTotal`, `discountTotal`, `totalAmount`: number
- `billingFrequency`: `'daily' | 'weekly' | 'monthly' | 'yearly'`
- `startDate`: string
- `nextBillingDate`: string
- `anchorDay`: number (Day of the month 1-31 for month-end clamping)
- `lastInvoicedDate`: string | null
- `history`: Array<{ timestamp, fromStatus, toStatus, reason, performedBy }>

#### 7. `invoices` (`/invoices/{invoiceId}`)
- `id`: string
- `invoiceNumber`: string (`INV-YYYY-XXXX`)
- `billingPeriodId`: string (Idempotency Key: `BP_<subscriptionId>_<YYYY-MM-DD>`)
- `subscriptionId`: string
- `customerId`: string
- `customerSnapshot`: CustomerSnapshot
- `invoiceDate`, `dueDate`, `periodStart`, `periodEnd`: string
- `status`: `'draft' | 'confirmed' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled'`
- `lineItems`: Array<{ description, quantity, unitPrice, subtotal, taxAmount, discountAmount, total }>
- `subtotal`, `taxTotal`, `discountTotal`, `grandTotal`: number
- `taxSnapshot`: Array<{ ruleId, name, ratePercentage, amount }>
- `discountSnapshot`: Array<{ ruleId, code, name, amount }>
- `amountPaid`: number
- `balanceDue`: number
- `paymentTerms`, `notes`: string

#### 8. `payments` (`/payments/{paymentId}`)
- `id`: string
- `paymentNumber`: string (`PAY-YYYY-XXXX`)
- `invoiceId`, `invoiceNumber`: string
- `customerId`, `customerName`: string
- `amount`: number (in minor units)
- `paymentDate`: string
- `paymentMethod`: `'bank_transfer' | 'credit_card' | 'upi' | 'cheque' | 'cash'`
- `reference`: string (Bank UTR / Transaction ID)
- `notes`: string
- `status`: `'completed' | 'reversed'`
- `recordedBy`: string

#### 9. `taxRules` & `discountRules`
- Admin-configured percentage or fixed financial rules with start/end validity dates and maximum usage thresholds.

#### 10. `dashboardMetrics` (`/dashboardMetrics/current`)
- Precomputed aggregate summary containing `mrr`, `arr`, `revenueReceived`, `outstandingRevenue`, `activeSubscriptions`, `overdueInvoices` to ensure sub-second rendering without table scans.

---

## 7. Important Technical Decisions

### 1. Month-End Date Clamping with Anchor Preservation
A well-known hazard in recurring billing systems is calendar month variation:
- If a client subscribes on **January 31**:
  - Simply adding 1 month in standard naive libraries would yield March 2 or 3!
  - Brightloop's `calculateNextBillingDate` detects that target month (February) has fewer days (28 or 29 in leap years), clamps the billing date to **February 28/29**, and retains the `anchorDay = 31` in the subscription record.
  - On the following cycle (March), the engine observes `anchorDay = 31`, restoring the next billing date to **March 31**, rather than drifting forward to March 28.

### 2. Idempotency & Duplicate Invoice Prevention
Recurring billing jobs can fail midway due to transient server blips or run concurrently.
- Every invoice generated by the recurring billing engine is assigned a deterministic idempotency key: `BP_<subscriptionId>_<YYYY-MM-DD>`.
- Before invoice creation, a Firestore transaction validates whether an invoice with this `billingPeriodId` exists.
- If present, the engine safely flags the cycle as `already_billed` and skips it. This guarantees that running the billing trigger multiple times on the same day never creates duplicate invoices.

### 3. Immutable Financial Snapshots
Products, variant prices, and tax rates naturally change over time. Historical invoices and subscriptions must **never** mutate when an administrator updates catalog pricing.
- Brightloop snapshots customer addresses, tax percentages, discount rates, and unit prices directly into invoice and subscription documents at the moment of creation.
- A price increase in `Brightloop Cloud ERP` next year will never alter the agreed pricing of an invoice issued today.

### 4. Minor Currency Units (Integer Arithmetic)
JavaScript IEEE-754 floating-point arithmetic can introduce fractional rounding errors (e.g. `₹199.99 * 3 = 599.9700000000001`).
- All monetary values are processed and stored as integer minor units (paise / cents).
- Formatting utilities (`formatCurrency`) handle localized display (`₹1,250.00`) only at the presentation layer.

### 5. Precomputed Dashboard Aggregations
Fetching all subscription and invoice documents to calculate MRR and ARR on every page load would cause unacceptable latency and balloon Firestore read bills as the company scales.
- Aggregates are updated transactionally during billing and payment events into `/dashboardMetrics/current`.
- Dashboard initial paint responds in under **100 milliseconds**.

---

## 8. Security Architecture

1. **Role-Based Authorization & Custom Claims**:
   - Privileged operations (`createStaffUser`, `bootstrapInitialAdmin`, `saveTaxRule`, `saveDiscountRule`) verify server-set Firebase Auth Custom Claims. Client-supplied role claims are never trusted.
2. **Firestore Security Rules**:
   - `firestore.rules` enforces that customers can only read and query documents where `resource.data.customerId == request.auth.uid`.
   - Customers can **never** write, modify, or decrement invoice totals, balances, or tax snapshots directly.
3. **Storage Security Rules**:
   - Invoices and sensitive company documents in `/invoices/{invoiceId}` can only be accessed by authenticated staff or the recipient customer.
4. **App Check**:
   - Protects backend Cloud Functions and Firestore from unauthorized bot traffic and external abuse.

---

## 9. Installation & Local Setup

### Prerequisites
- **Node.js**: v20 or v22 LTS
- **npm**: v10+
- **Firebase CLI**: `npm install -g firebase-tools` (or run via `npx firebase-tools`)

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone <repository-url>
cd "Subscription Management System"

# Install frontend dependencies
npm install

# Install Cloud Functions dependencies
cd functions
npm install
cd ..
```

### 2. Configure Environment Variables
Copy the example environment file:
```bash
cp .env.example .env
```
Update `.env` with your Firebase project credentials, or leave defaults for local emulator / demo mode:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_USE_FIREBASE_EMULATOR=false
```

### 3. Compile Cloud Functions
```bash
npm --prefix functions run build
```

---

## 10. Running the Application

### Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Local Firebase Emulator Suite
To run local Firebase Authentication, Firestore, Functions, and Storage emulators:
```bash
firebase emulators:start
```
Set `VITE_USE_FIREBASE_EMULATOR=true` in `.env` to route all frontend requests to local emulators.

### Production Build
```bash
npm run build
```
Generates optimized, code-split production bundles in `dist/`.

---

## 11. Testing & Quality Assurance

Brightloop includes an automated test suite verifying financial math, month-end date clamping, state transitions, and the complete 21-step end-to-end business workflow.

### Run All Unit & E2E Tests
```bash
npm run test
```

### Verified Test Suites
1. **`src/test/billing.test.ts`**:
   - Month-end clamping for January 31 -> February 28 (non-leap year).
   - Month-end clamping for January 31 -> February 29 (leap year 2024).
   - Anchor day 31 restoration on March following February clamping.
   - Daily, Weekly, Monthly, and Yearly frequency calculations.
   - Deterministic billing period ID generation.
2. **`src/test/financial.test.ts`**:
   - Minor units conversion and rounding safety.
   - Percentage calculations.
   - Multi-component tax rules (GST 18% + Digital Cess 0.5%).
   - Discount coupon eligibility, minimum spend enforcement, and usage limits.
3. **`src/test/status_and_reconciliation.test.ts`**:
   - Subscription finite state machine transitions.
   - Rejection of invalid transitions (e.g., closing early when prohibited by plan).
   - Quotation and invoice state validation.
4. **`src/test/e2e_workflow.test.ts`**:
   - Full 21-step scenario: Admin login -> Product creation -> Odoo variant (+₹560) -> Plan creation -> Tax config -> Discount config -> Customer registration -> Quotation generation -> Conversion to active subscription -> Due date arrival -> Automated recurring billing -> Partial payment -> Balance clearance -> Dashboard metrics verification -> Customer portal verification.

---

## 12. Performance Optimization & Sub-2-Second Target

To satisfy the explicit non-negotiable performance requirement:
- **Optimized Bundling**: Code split into granular vendor chunks (`vendor-react`, `vendor-charts`, `vendor-firebase`), keeping all chunks under 500 kB.
- **Precomputed Dashboard Aggregations**: Dashboard metrics load in under 100ms from `/dashboardMetrics/current` without collection scans.
- **Indexed Compound Queries**: `firestore.indexes.json` indexes `(status, nextBillingDate)` and `(customerId, invoiceDate)` for zero-latency filtered lookups.
- **Query Pagination**: Subscriptions and Invoices use cursor-based limits to prevent unbounded memory consumption.
- **Measured Build Time**: Production bundle compiles in **2.79 seconds**.
- **Measured Test Execution**: Complete test suite passes in **659 milliseconds**.

---

## 13. Limitations & Future Roadmap

- **Online Payment Gateways**: The current release focuses on manual payment recording and bank statement reconciliation (as specified in the requirements). The architecture contains an extensible payment abstraction ready for Stripe or Razorpay webhook ingestion.
- **Automated Dunning Retries**: Overdue invoices are visually flagged with status tracking; automated email reminder integrations (SendGrid/Postmark) can be plugged into the scheduled Cloud Function.

---

## 14. Team Attribution

**Brightloop Subscription Management System**

Developed with architectural rigor by:

### **Team Ripple**
*Software Architecture • Full-Stack Engineering • Security & Database Design*

