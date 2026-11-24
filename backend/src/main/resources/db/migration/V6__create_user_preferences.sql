
CREATE TABLE user_preferences (
                                  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

                                  user_id UUID NOT NULL UNIQUE,

                                  country_code CHAR(2) NOT NULL DEFAULT 'IN',

                                  display_currency CHAR(3) NOT NULL DEFAULT 'INR',

                                  time_zone VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',

                                  locale VARCHAR(20) NOT NULL DEFAULT 'en-IN',

                                  date_format VARCHAR(20) NOT NULL DEFAULT 'DD/MM/YYYY',

                                  time_format VARCHAR(3) NOT NULL DEFAULT '12H',

                                  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                  CONSTRAINT fk_user_preferences_user
                                      FOREIGN KEY (user_id)
                                          REFERENCES users(id)
                                          ON DELETE CASCADE,

                                  CONSTRAINT chk_user_preferences_time_format
                                      CHECK (time_format IN ('12H', '24H'))
);

CREATE INDEX idx_user_preferences_country
    ON user_preferences(country_code);
