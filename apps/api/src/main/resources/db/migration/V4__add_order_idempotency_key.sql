-- Idempotent order creation (spec 032): a client may send an Idempotency-Key with an order. The key
-- and a fingerprint of the request are stored with the order, and the unique constraint makes a
-- repeated request find the first order, also when two requests arrive at the same time. Orders
-- without a key keep both columns null, and a unique constraint allows many nulls.
ALTER TABLE orders
  ADD COLUMN idempotency_key     UUID,
  ADD COLUMN request_fingerprint TEXT;

ALTER TABLE orders
  ADD CONSTRAINT uq_orders_idempotency_key UNIQUE (idempotency_key),
  ADD CONSTRAINT ck_orders_key_and_fingerprint_together
    CHECK ((idempotency_key IS NULL) = (request_fingerprint IS NULL));
