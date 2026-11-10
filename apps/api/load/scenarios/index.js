// Every scenario in this folder is exported here. Profiles run all of them, so a new endpoint's
// scenario is part of every load test. A test fails when a scenario file is missing from this list.
export { getApiInfo } from "./get-api-info.js";
export { listCoffees } from "./coffees-list.js";
export { getCheckoutConfig } from "./checkout-config.js";
export { createOrder } from "./orders-create.js";
export { getOrder } from "./orders-get.js";
export { quoteOrder } from "./orders-quote.js";
