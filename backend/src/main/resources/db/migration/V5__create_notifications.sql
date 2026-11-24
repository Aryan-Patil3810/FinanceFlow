
-- ============================================================
-- FinanceFlow
-- V5: Notifications
-- ============================================================

CREATE TABLE notifications (
                               id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

                               user_id UUID NOT NULL,

                               title VARCHAR(150) NOT NULL,

                               message TEXT NOT NULL,

                               notification_type VARCHAR(30) NOT NULL,

                               reference_type VARCHAR(40),

                               reference_id UUID,

                               is_read BOOLEAN NOT NULL DEFAULT FALSE,

                               read_at TIMESTAMPTZ,

                               deduplication_key VARCHAR(200),

                               created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

                               CONSTRAINT fk_notifications_user
                                   FOREIGN KEY (user_id)
                                       REFERENCES users(id),

                               CONSTRAINT chk_notifications_type
                                   CHECK (
                                       notification_type IN (
                                                             'PAYMENT_DUE',
                                                             'PAYMENT_OVERDUE',
                                                             'PAYMENT_COMPLETED',
                                                             'SYSTEM'
                                           )
                                       ),

                               CONSTRAINT chk_notifications_reference_type
                                   CHECK (
                                       reference_type IS NULL OR
                                       reference_type IN (
                                                          'PAYMENT_OCCURRENCE',
                                                          'RECURRING_PAYMENT',
                                                          'TRANSACTION'
                                           )
                                       ),

                               CONSTRAINT chk_notifications_read_at
                                   CHECK (
                                       (is_read = FALSE AND read_at IS NULL)
                                           OR
                                       (is_read = TRUE AND read_at IS NOT NULL)
                                       )
);

-- User notification history
CREATE INDEX idx_notifications_user_created
    ON notifications(user_id, created_at DESC);

-- Unread notification lookup
CREATE INDEX idx_notifications_user_unread
    ON notifications(user_id, created_at DESC)
    WHERE is_read = FALSE;

-- Prevent duplicate reminder generation
CREATE UNIQUE INDEX uq_notifications_deduplication
    ON notifications(user_id, deduplication_key)
    WHERE deduplication_key IS NOT NULL;
