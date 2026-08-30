-- ============================================================
-- FinanceFlow
-- Development Seed Data
-- PostgreSQL 18.6
-- ============================================================


-- ============================================================
-- SYSTEM CATEGORIES
-- ============================================================

INSERT INTO categories (
    user_id,
    name,
    category_type,
    status
)
VALUES

-- Fixed Spending
(NULL, 'Rent', 'FIXED', 'ACTIVE'),
(NULL, 'Utilities', 'FIXED', 'ACTIVE'),
(NULL, 'Internet', 'FIXED', 'ACTIVE'),
(NULL, 'Phone', 'FIXED', 'ACTIVE'),
(NULL, 'Insurance', 'FIXED', 'ACTIVE'),
(NULL, 'Subscriptions', 'FIXED', 'ACTIVE'),

-- Variable Spending
(NULL, 'Restaurants', 'VARIABLE', 'ACTIVE'),
(NULL, 'Groceries', 'VARIABLE', 'ACTIVE'),
(NULL, 'Entertainment', 'VARIABLE', 'ACTIVE'),
(NULL, 'Shopping', 'VARIABLE', 'ACTIVE'),
(NULL, 'Travel', 'VARIABLE', 'ACTIVE'),
(NULL, 'Fuel Costs', 'VARIABLE', 'ACTIVE'),
(NULL, 'Car Maintenance', 'VARIABLE', 'ACTIVE'),

-- Investments
(NULL, 'Brokerage', 'INVESTMENT', 'ACTIVE');

-- ============================================================
-- VERIFY SYSTEM CATEGORIES
-- ============================================================

SELECT
    name,
    category_type,
    status
FROM categories
WHERE user_id IS NULL
ORDER BY category_type, name;