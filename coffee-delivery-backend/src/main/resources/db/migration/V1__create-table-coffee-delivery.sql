CREATE TABLE coffee_delivery(
    id bigserial NOT NULL,
    name VARCHAR(50) NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    description VARCHAR(100) NOT NULL,
    coffeetype VARCHAR(100) NOT NULL,

    PRIMARY KEY(id)
);