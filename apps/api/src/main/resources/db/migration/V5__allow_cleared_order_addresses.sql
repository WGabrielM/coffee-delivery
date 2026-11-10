-- Orders: the address is kept only as long as it is needed (spec 038). Once an order is older than the
-- retention period, the job clears the seven address columns and sets address_cleared_at. Items,
-- totals, payment method, and dates stay. The existing orders are not changed.

ALTER TABLE orders
  ALTER COLUMN zip_code DROP NOT NULL,
  ALTER COLUMN street DROP NOT NULL,
  ALTER COLUMN number DROP NOT NULL,
  ALTER COLUMN neighborhood DROP NOT NULL,
  ALTER COLUMN city DROP NOT NULL,
  ALTER COLUMN state DROP NOT NULL,
  ADD COLUMN address_cleared_at TIMESTAMPTZ;

-- The columns are null only for a cleared order, and a cleared order has none of them. The other
-- rules of the address (the state is two capital letters) still hold for an order that has one.
ALTER TABLE orders
  ADD CONSTRAINT ck_orders_address_present_until_cleared CHECK (
    (address_cleared_at IS NULL
      AND zip_code IS NOT NULL AND street IS NOT NULL AND number IS NOT NULL
      AND neighborhood IS NOT NULL AND city IS NOT NULL AND state IS NOT NULL)
    OR
    (address_cleared_at IS NOT NULL
      AND zip_code IS NULL AND street IS NULL AND number IS NULL AND complement IS NULL
      AND neighborhood IS NULL AND city IS NULL AND state IS NULL)
  );
