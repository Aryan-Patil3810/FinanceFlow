# FinanceFlow --- User Stories & Acceptance Criteria

**Version:** 1.0\
**Status:** Draft for Client Review

## Authentication

### US-AUTH-001 --- Register

**As a** new user,\
**I want** to create an account,\
**so that** I can securely manage my finances.

**Acceptance Criteria** - Given valid registration information, when the
user submits the form, an account is created. - Email addresses must be
unique. - Invalid registration data must be rejected. - Passwords must
not be stored in plaintext.

### US-AUTH-002 --- Login

**As a** registered user,\
**I want** to log in,\
**so that** I can access my financial data.

**Acceptance Criteria** - Valid credentials authenticate successfully. -
Invalid credentials are rejected. - Protected resources cannot be
accessed without authentication.

## Income

### US-INCOME-001 --- Add Income

**As a** user,\
**I want** to record my income,\
**so that** FinanceFlow can calculate my earnings and savings.

**Acceptance Criteria** - The user can enter date, pay period, gross
pay, taxes, insurance deduction, bonuses, net pay, and notes. - Required
fields are validated. - A valid income record is persisted. - The new
record appears in income history.

### US-INCOME-002 --- View Income Summary

**As a** user,\
**I want** to see monthly and YTD income,\
**so that** I understand my earnings.

**Acceptance Criteria** - Monthly income is calculated from the user's
income records. - YTD income is calculated for the current year. -
Average paycheck is calculated from applicable income records.

## Expenses

### US-EXP-001 --- Add Expense

**As a** user,\
**I want** to record an expense,\
**so that** I know where my money goes.

**Acceptance Criteria** - The user can enter amount and date. - The user
can select a category. - The user can select a payment method. - The
transaction is associated with the authenticated user. - The transaction
appears in expense history.

### US-EXP-002 --- Filter Expenses

**As a** user,\
**I want** to filter my expenses,\
**so that** I can analyze specific spending.

**Acceptance Criteria** - The user can filter by date range. - The user
can filter by category. - The user can filter by payment method. - Only
the user's own transactions are returned.

## Categories

### US-CAT-001 --- Create Custom Category

**As a** user,\
**I want** to create my own category,\
**so that** my expense tracking matches my real spending behavior.

**Acceptance Criteria** - The user can provide a category name. - The
category is associated with the user. - The category becomes selectable
for the user's expenses. - Another user cannot modify or access the
custom category.

## Investments

### US-INV-001 --- Record Investment

**As a** user,\
**I want** to record an investment contribution,\
**so that** I can track money allocated to investments.

**Acceptance Criteria** - The user can enter date, amount, account name,
and notes. - The contribution appears in investment history. - The
contribution is associated with the authenticated user.

## Upcoming Payments

### US-PAY-001 --- Add Upcoming Payment

**As a** user,\
**I want** to record an upcoming payment,\
**so that** I do not lose track of future obligations.

**Acceptance Criteria** - The user can enter payment name, amount, due
date, category, frequency, payment method, status, and notes. - The
payment appears in upcoming-payment views. - Recurring frequencies are
supported.

## Dashboard

### US-DASH-001 --- View Financial Dashboard

**As a** user,\
**I want** a financial dashboard,\
**so that** I can understand my financial position quickly.

**Acceptance Criteria** - The dashboard displays income. - The dashboard
displays expenses. - The dashboard displays savings. - The dashboard
displays savings rate. - The dashboard displays investment
contributions. - The dashboard displays category-level spending. - The
dashboard displays upcoming payments.

## Financial Health

### US-SAVE-001 --- Understand Savings Health

**As a** user,\
**I want** FinanceFlow to explain my savings behavior,\
**so that** I know what I should improve.

**Acceptance Criteria** - Savings are calculated from authoritative
financial data. - Savings rate is displayed. - Future score calculations
can reference verified metrics. - Explanations identify meaningful
changes in spending or saving.

## AI

### US-AI-001 --- Ask a Financial Question

**As a** user,\
**I want** to ask FinanceFlow questions in natural language,\
**so that** I can understand my finances without manually analyzing
tables.

**Acceptance Criteria** - The assistant uses only authorized user
data. - Financial calculations come from verified application data. -
The response explains relevant metrics clearly. - The system does not
expose another user's information.
