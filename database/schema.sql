
-- ============================================================
-- FinanceFlow Database
-- PostgreSQL 18
-- Schema Version: 1.0
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,

    first_name VARCHAR(100),
    last_name VARCHAR(100),

    base_currency CHAR(3) NOT NULL DEFAULT 'USD',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_users_email
        UNIQUE (email)
);

-- ============================================================
-- ACCOUNTS
-- ============================================================

CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,

    name VARCHAR(150) NOT NULL,

    account_type VARCHAR(30) NOT NULL,

    currency CHAR(3) NOT NULL,

    opening_balance NUMERIC(19,4) NOT NULL DEFAULT 0,

    opening_balance_date DATE NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_accounts_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT chk_accounts_type
        CHECK (
            account_type IN (
                'CHECKING',
                'SAVINGS',
                'CREDIT_CARD',
                'BROKERAGE',
                'CASH',
                'OTHER'
            )
        ),

    CONSTRAINT chk_accounts_status
        CHECK (
            status IN (
                'ACTIVE',
                'ARCHIVED'
            )
        )
);

-- ============================================================
-- ACCOUNT NAME UNIQUENESS
-- ============================================================

CREATE UNIQUE INDEX uq_accounts_user_name
ON accounts (user_id, LOWER(name));

-- ============================================================
-- CATEGORIES
-- ============================================================

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID,

    name VARCHAR(100) NOT NULL,

    category_type VARCHAR(30) NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_categories_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT chk_categories_type
        CHECK (
            category_type IN (
                'FIXED',
                'VARIABLE',
                'INVESTMENT',
                'OTHER'
            )
        ),

    CONSTRAINT chk_categories_status
        CHECK (
            status IN (
                'ACTIVE',
                'ARCHIVED'
            )
        )
);

-- ============================================================
-- CATEGORY UNIQUENESS
-- ============================================================

CREATE UNIQUE INDEX uq_categories_user_name
ON categories (user_id, LOWER(name))
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX uq_categories_system_name
ON categories (LOWER(name))
WHERE user_id IS NULL;

-- ============================================================
-- PAYMENT METHODS
-- ============================================================

CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,

    name VARCHAR(100) NOT NULL,

    method_type VARCHAR(30) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_payment_methods_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT chk_payment_methods_type
        CHECK (
            method_type IN (
                'CREDIT_CARD',
                'DEBIT_CARD',
                'BANK_TRANSFER',
                'CASH',
                'ACH',
                'OTHER'
            )
        )
);

-- ============================================================
-- PAYMENT METHOD NAME UNIQUENESS
-- ============================================================

CREATE UNIQUE INDEX uq_payment_methods_user_name
ON payment_methods (user_id, LOWER(name));


-- ============================================================
-- FINANCIAL TRANSACTIONS
-- ============================================================

CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,

    account_id UUID NOT NULL,

    category_id UUID,

    payment_method_id UUID,

    transaction_type VARCHAR(30) NOT NULL,

    amount NUMERIC(19,4) NOT NULL,

    currency CHAR(3) NOT NULL,

    transaction_date DATE NOT NULL,

    description VARCHAR(255),

    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_transactions_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT fk_transactions_account
        FOREIGN KEY (account_id)
        REFERENCES accounts(id),

    CONSTRAINT fk_transactions_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id),

    CONSTRAINT fk_transactions_payment_method
        FOREIGN KEY (payment_method_id)
        REFERENCES payment_methods(id),

    CONSTRAINT chk_transactions_type
        CHECK (
            transaction_type IN (
                'INCOME',
                'EXPENSE',
                'INVESTMENT'
            )
        ),

    CONSTRAINT chk_transactions_amount
        CHECK (amount > 0)
);

-- ============================================================
-- INCOME DETAILS
-- ============================================================

CREATE TABLE income_details (
    transaction_id UUID PRIMARY KEY,

    pay_period VARCHAR(30) NOT NULL,

    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    pay_date DATE NOT NULL,

    gross_pay NUMERIC(19,4) NOT NULL,
    bonus NUMERIC(19,4) NOT NULL DEFAULT 0,
    taxes NUMERIC(19,4) NOT NULL DEFAULT 0,
    insurance_deduction NUMERIC(19,4) NOT NULL DEFAULT 0,

    net_pay NUMERIC(19,4) NOT NULL,

    notes TEXT,

    CONSTRAINT fk_income_details_transaction
        FOREIGN KEY (transaction_id)
        REFERENCES financial_transactions(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_income_pay_period
        CHECK (
            pay_period IN (
                'BIWEEKLY',
                'MONTHLY'
            )
        ),

    CONSTRAINT chk_income_dates
        CHECK (
            period_end >= period_start
        ),

    CONSTRAINT chk_income_amounts
        CHECK (
            gross_pay >= 0
            AND bonus >= 0
            AND taxes >= 0
            AND insurance_deduction >= 0
            AND net_pay >= 0
        )
);


-- ============================================================
-- INVESTMENT DETAILS
-- ============================================================

CREATE TABLE investment_details (
    transaction_id UUID PRIMARY KEY,

    investment_type VARCHAR(30) NOT NULL,

    transaction_action VARCHAR(20) NOT NULL,

    security_name VARCHAR(200),

    symbol VARCHAR(30),

    quantity NUMERIC(19,8),

    price_per_unit NUMERIC(19,8),

    CONSTRAINT fk_investment_details_transaction
        FOREIGN KEY (transaction_id)
        REFERENCES financial_transactions(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_investment_type
        CHECK (
            investment_type IN (
                'STOCK',
                'ETF',
                'MUTUAL_FUND',
                'BOND',
                'RETIREMENT',
                'OTHER'
            )
        ),

    CONSTRAINT chk_investment_action
        CHECK (
            transaction_action IN (
                'BUY',
                'SELL',
                'CONTRIBUTION',
                'WITHDRAWAL',
                'OTHER'
            )
        ),

    CONSTRAINT chk_investment_quantity
        CHECK (
            quantity IS NULL OR quantity >= 0
        ),

    CONSTRAINT chk_investment_price
        CHECK (
            price_per_unit IS NULL OR price_per_unit >= 0
        )
);


-- ============================================================
-- TRANSFERS
-- ============================================================

CREATE TABLE transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,

    source_account_id UUID NOT NULL,

    destination_account_id UUID NOT NULL,

    amount NUMERIC(19,4) NOT NULL,

    currency CHAR(3) NOT NULL,

    transfer_date DATE NOT NULL,

    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_transfers_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT fk_transfers_source_account
        FOREIGN KEY (source_account_id)
        REFERENCES accounts(id),

    CONSTRAINT fk_transfers_destination_account
        FOREIGN KEY (destination_account_id)
        REFERENCES accounts(id),

    CONSTRAINT chk_transfers_amount
        CHECK (amount > 0),

    CONSTRAINT chk_transfers_different_accounts
        CHECK (
            source_account_id <> destination_account_id
        )
);


-- ============================================================
-- RECURRING PAYMENTS
-- ============================================================

CREATE TABLE recurring_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,

    name VARCHAR(150) NOT NULL,

    amount NUMERIC(19,4) NOT NULL,

    currency CHAR(3) NOT NULL,

    category_id UUID,

    account_id UUID,

    payment_method_id UUID,

    frequency VARCHAR(30) NOT NULL,

    start_date DATE NOT NULL,

    end_date DATE,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_recurring_payments_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT fk_recurring_payments_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id),

    CONSTRAINT fk_recurring_payments_account
        FOREIGN KEY (account_id)
        REFERENCES accounts(id),

    CONSTRAINT fk_recurring_payments_payment_method
        FOREIGN KEY (payment_method_id)
        REFERENCES payment_methods(id),

    CONSTRAINT chk_recurring_payment_amount
        CHECK (amount > 0),

    CONSTRAINT chk_recurring_payment_frequency
        CHECK (
            frequency IN (
                'WEEKLY',
                'BIWEEKLY',
                'MONTHLY',
                'QUARTERLY',
                'YEARLY'
            )
        ),

    CONSTRAINT chk_recurring_payment_status
        CHECK (
            status IN (
                'ACTIVE',
                'PAUSED',
                'CANCELLED',
                'COMPLETED'
            )
        ),

    CONSTRAINT chk_recurring_payment_dates
        CHECK (
            end_date IS NULL OR end_date >= start_date
        )
);


-- ============================================================
-- PAYMENT OCCURRENCES
-- ============================================================

CREATE TABLE payment_occurrences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    recurring_payment_id UUID,

    due_date DATE NOT NULL,

    expected_amount NUMERIC(19,4) NOT NULL,

    actual_amount NUMERIC(19,4),

    status VARCHAR(20) NOT NULL DEFAULT 'UPCOMING',

    paid_transaction_id UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_occurrences_recurring_payment
        FOREIGN KEY (recurring_payment_id)
        REFERENCES recurring_payments(id),

    CONSTRAINT fk_occurrences_paid_transaction
        FOREIGN KEY (paid_transaction_id)
        REFERENCES financial_transactions(id),

    CONSTRAINT chk_occurrences_expected_amount
        CHECK (expected_amount > 0),

    CONSTRAINT chk_occurrences_actual_amount
        CHECK (
            actual_amount IS NULL OR actual_amount >= 0
        ),

    CONSTRAINT chk_occurrences_status
        CHECK (
            status IN (
                'UPCOMING',
                'PAID',
                'MISSED',
                'SKIPPED',
                'CANCELLED'
            )
        )
);

CREATE INDEX idx_transactions_user_id
    ON financial_transactions(user_id);

CREATE INDEX idx_transactions_account_id
    ON financial_transactions(account_id);

CREATE INDEX idx_transactions_category_id
    ON financial_transactions(category_id);

CREATE INDEX idx_transactions_date
    ON financial_transactions(transaction_date);

CREATE INDEX idx_transactions_type
    ON financial_transactions(transaction_type);

CREATE INDEX idx_transfers_user_id
    ON transfers(user_id);

CREATE INDEX idx_transfers_date
    ON transfers(transfer_date);

CREATE INDEX idx_recurring_payments_user_id
    ON recurring_payments(user_id);

CREATE INDEX idx_payment_occurrences_due_date
    ON payment_occurrences(due_date);

CREATE INDEX idx_payment_occurrences_status
    ON payment_occurrences(status);