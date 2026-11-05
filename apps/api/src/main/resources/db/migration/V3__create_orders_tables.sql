-- Orders: a confirmed purchase and its lines. Money is integer cents (USD).
-- Each line copies the coffee name and unit price, so a later catalog change never alters a past order.
-- There is no user: the product has no accounts. Only the status "confirmed" exists.

CREATE TABLE orders (
  id                    UUID        NOT NULL DEFAULT gen_random_uuid(),
  status                TEXT        NOT NULL,
  payment_method        TEXT        NOT NULL,
  zip_code              TEXT        NOT NULL,
  street                TEXT        NOT NULL,
  number                TEXT        NOT NULL,
  complement            TEXT,
  neighborhood          TEXT        NOT NULL,
  city                  TEXT        NOT NULL,
  state                 TEXT        NOT NULL,
  subtotal_in_cents     INTEGER     NOT NULL,
  delivery_fee_in_cents INTEGER     NOT NULL,
  total_in_cents        INTEGER     NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT pk_orders PRIMARY KEY (id),
  CONSTRAINT ck_orders_status CHECK (status IN ('confirmed')),
  CONSTRAINT ck_orders_payment_method CHECK (payment_method IN ('credit_card', 'debit_card', 'cash')),
  CONSTRAINT ck_orders_state_two_uppercase_letters CHECK (state ~ '^[A-Z]{2}$'),
  CONSTRAINT ck_orders_subtotal_in_cents_not_negative CHECK (subtotal_in_cents >= 0),
  CONSTRAINT ck_orders_delivery_fee_in_cents_not_negative CHECK (delivery_fee_in_cents >= 0),
  CONSTRAINT ck_orders_total_is_subtotal_plus_fee CHECK (total_in_cents = subtotal_in_cents + delivery_fee_in_cents)
);

-- order_items.id grows with each insert, so the lines of an order keep the order they were created in.
CREATE TABLE order_items (
  id                  BIGINT  GENERATED ALWAYS AS IDENTITY,
  order_id            UUID    NOT NULL,
  coffee_id           UUID    NOT NULL,
  coffee_name         TEXT    NOT NULL,
  unit_price_in_cents INTEGER NOT NULL,
  quantity            INTEGER NOT NULL,
  line_total_in_cents INTEGER NOT NULL,
  CONSTRAINT pk_order_items PRIMARY KEY (id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_coffee FOREIGN KEY (coffee_id) REFERENCES coffees (id) ON DELETE RESTRICT,
  CONSTRAINT uq_order_items_order_coffee UNIQUE (order_id, coffee_id),
  CONSTRAINT ck_order_items_quantity_between_1_and_99 CHECK (quantity BETWEEN 1 AND 99),
  CONSTRAINT ck_order_items_unit_price_in_cents_not_negative CHECK (unit_price_in_cents >= 0),
  CONSTRAINT ck_order_items_line_total_is_unit_price_times_quantity CHECK (line_total_in_cents = unit_price_in_cents * quantity)
);

-- The foreign key to coffees is checked on every delete of a coffee; this index keeps that check cheap.
CREATE INDEX ix_order_items_coffee_id ON order_items (coffee_id);
