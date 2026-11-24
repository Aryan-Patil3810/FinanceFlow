ALTER TABLE categories
DROP CONSTRAINT IF EXISTS chk_categories_type;

ALTER TABLE categories
    ADD CONSTRAINT chk_categories_type
        CHECK (
            category_type IN (
                              'FIXED',
                              'VARIABLE',
                              'INVESTMENT',
                              'INCOME'
                )
            );