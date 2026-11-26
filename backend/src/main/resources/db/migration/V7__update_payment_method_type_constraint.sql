
-- Update supported payment method types.

ALTER TABLE payment_methods
DROP CONSTRAINT IF EXISTS chk_payment_methods_type;

ALTER TABLE payment_methods
    ADD CONSTRAINT chk_payment_methods_type
        CHECK (
            method_type IN (
                            'CASH',
                            'DEBIT_CARD',
                            'CREDIT_CARD',
                            'BANK_TRANSFER',
                            'ACH',
                            'DIGITAL_WALLET',
                            'OTHER'
                )
            );
