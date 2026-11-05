-- Catalog: tags, coffees, and the tags of each coffee.
-- Prices are integer cents (USD). The database stores no image: the app finds photos by slug.

CREATE TABLE tags (
  id       UUID    NOT NULL DEFAULT gen_random_uuid(),
  slug     TEXT    NOT NULL,
  name     TEXT    NOT NULL,
  position INTEGER NOT NULL,
  CONSTRAINT pk_tags PRIMARY KEY (id),
  CONSTRAINT uq_tags_slug UNIQUE (slug),
  CONSTRAINT uq_tags_position UNIQUE (position)
);

CREATE TABLE coffees (
  id             UUID    NOT NULL DEFAULT gen_random_uuid(),
  slug           TEXT    NOT NULL,
  name           TEXT    NOT NULL,
  description    TEXT    NOT NULL,
  price_in_cents INTEGER NOT NULL,
  position       INTEGER NOT NULL,
  CONSTRAINT pk_coffees PRIMARY KEY (id),
  CONSTRAINT uq_coffees_slug UNIQUE (slug),
  CONSTRAINT uq_coffees_position UNIQUE (position),
  CONSTRAINT ck_coffees_price_in_cents_positive CHECK (price_in_cents > 0)
);

CREATE TABLE coffee_tags (
  coffee_id UUID NOT NULL,
  tag_id    UUID NOT NULL,
  CONSTRAINT pk_coffee_tags PRIMARY KEY (coffee_id, tag_id),
  CONSTRAINT fk_coffee_tags_coffee FOREIGN KEY (coffee_id) REFERENCES coffees (id),
  CONSTRAINT fk_coffee_tags_tag FOREIGN KEY (tag_id) REFERENCES tags (id)
);

-- Filtering by tag reads coffee_tags by tag_id (the primary key covers coffee_id first).
CREATE INDEX ix_coffee_tags_tag_id ON coffee_tags (tag_id);
