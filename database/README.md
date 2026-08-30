# FinanceFlow Database

FinanceFlow uses PostgreSQL as its primary relational database.

## Requirements

* PostgreSQL 18+
* pgAdmin 4 (optional)
* psql command-line client (recommended)

## Database

Development database:

```text
financeflow
```

Default PostgreSQL port:

```text
5432
```

## Schema

The database schema is defined in:

```text
schema.sql
```

It contains the core FinanceFlow entities:

* Users
* Accounts
* Categories
* Payment Methods
* Financial Transactions
* Income Details
* Investment Details
* Transfers
* Recurring Payments
* Payment Occurrences

## Seed Data

Development seed data is defined in:

```text
seed.sql
```

The seed script currently creates the default FinanceFlow system categories.

### Fixed Spending

* Rent
* Utilities
* Internet
* Phone
* Insurance
* Subscriptions

### Variable Spending

* Restaurants
* Groceries
* Entertainment
* Shopping
* Travel
* Fuel Costs
* Car Maintenance

### Investments

* Brokerage

## Database Setup

Create the database:

```sql
CREATE DATABASE financeflow;
```

Connect to the `financeflow` database using pgAdmin 4 or psql.

Execute:

```text
schema.sql
```

Then execute:

```text
seed.sql
```

## Verification

Verify the system categories:

```sql
SELECT
    name,
    category_type,
    status
FROM categories
WHERE user_id IS NULL
ORDER BY category_type, name;
```

Expected result:

```text
14 system categories
```

## Important Design Decisions

### Money

Financial amounts use PostgreSQL `NUMERIC` rather than floating-point types to avoid financial precision problems.

### IDs

Core entities use UUID primary keys.

### Transfers

Transfers are modeled separately from financial transactions so moving money between a user's own accounts is not incorrectly counted as spending.

### Categories

FinanceFlow supports both system categories and user-defined custom categories.

System categories have:

```text
user_id = NULL
```

Custom categories belong to a specific user.

Category names are protected against case-insensitive duplicates for the same user.

### Accounts

Accounts can be archived rather than deleted so financial history can be preserved.

Supported account types currently include:

```text
CHECKING
SAVINGS
CREDIT_CARD
BROKERAGE
CASH
OTHER
```

### Transaction Types

The primary financial transaction types are:

```text
INCOME
EXPENSE
INVESTMENT
```

Transfers are represented separately.

### Recurring Payments

Recurring payments represent payment rules such as:

```text
Rent
Utilities
Car Payment
Insurance
Subscriptions
```

Individual scheduled payments are represented using `payment_occurrences`.

## Development Migration Strategy

During Day 0, the initial database structure was created using:

```text
schema.sql
```

and development data using:

```text
seed.sql
```

During Spring Boot backend development, FinanceFlow will transition to version-controlled database migrations using **Flyway**.

The migration history will follow a structure similar to:

```text
V1__initial_schema.sql
V2__add_accounts.sql
V3__add_transactions.sql
V4__add_recurring_payments.sql
```

The exact migration structure will be finalized when Flyway is introduced into the backend.

## Database Development Principle

Database changes should be:

* Version controlled
* Reproducible
* Reviewable
* Tested before integration
* Applied consistently across development, testing, and production environments
