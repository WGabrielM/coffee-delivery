// The rectangles the pixel comparison with the design ignores. A mask is only for text that is
// different on purpose: the design is in Portuguese and in reais, the app is in English and in
// dollars. A mask must cover text and nothing else: never an image, an icon, a border, or a
// background (review rule of spec 029). The coordinates are in the pixels of the 1440 px design
// frames. Each rectangle is the union of the text in the design and in the app, plus 2 px.

export type Mask = {
  x: number;
  y: number;
  width: number;
  height: number;
  /** The element it covers, and why its pixels differ. */
  why: string;
};

export type Screen = "home" | "checkout" | "checkout-filled" | "success";

/** A rectangle from the corner of its union box, grown by 2 px on every side. */
function text(x: number, y: number, width: number, height: number, why: string): Mask {
  return { x: x - 2, y: y - 2, width: width + 4, height: height + 4, why };
}

// The coffee cards: four columns 288 px apart from x=160, rows 350 px apart from y=759 (the top of
// the card). Inside a card, from its top: the tags, the name, the description (up to three lines),
// and, on the purchase row, the price. The counter and the cart button are not masked.
const CARD_COLUMNS = 4;
const CARD_COUNT = 14;

function cardMasks(): Mask[] {
  const result: Mask[] = [];
  for (let index = 0; index < CARD_COUNT; index += 1) {
    const x = 160 + (index % CARD_COLUMNS) * 288;
    const y = 759 + Math.floor(index / CARD_COLUMNS) * 350;
    const card = `card ${index + 1}`;
    result.push(
      {
        x: x + 28,
        y: y + 127,
        width: 200,
        height: 26,
        why: `${card}: tags (TRADICIONAL, GELADO...): the label is in another language`,
      },
      {
        x: x + 24,
        y: y + 169,
        width: 208,
        height: 22,
        why: `${card}: coffee name (Expresso Tradicional): translated`,
      },
      {
        x: x + 24,
        y: y + 201,
        width: 208,
        height: 58,
        why: `${card}: description (up to three lines): translated`,
      },
      {
        x: x + 22,
        y: y + 277,
        width: 74,
        height: 22,
        why: `${card}: price (R$ 9,90 and $9.90): another currency`,
      },
    );
  }
  return result;
}

/** The placeholders of the empty form, in Portuguese in the design and in English in the app. */
const placeholders: Mask[] = [
  text(213, 313, 55, 11, "ZIP code field: placeholder CEP"),
  text(213, 372, 37, 10, "Street field: placeholder Rua"),
  text(213, 429, 50, 11, "Number field: placeholder Número"),
  text(213, 487, 88, 14, "Neighborhood field: placeholder Bairro"),
  text(425, 487, 42, 14, "City field: placeholder Cidade"),
  text(713, 488, 32, 10, "State field: placeholder UF"),
];

/** The parts of the checkout that both frames share: the headings, the cards, and the summary. */
const checkoutText: Mask[] = [
  text(160, 147, 169, 17, "left column heading: Complete seu pedido"),
  text(832, 146, 156, 15, "right column heading: Cafés selecionados"),
  text(231, 225, 145, 17, "address card title: Endereço de Entrega"),
  text(231, 249, 339, 15, "address card line: Informe o endereço onde deseja receber seu pedido"),
  text(424, 429, 88, 14, "Complement field: placeholder Complemento"),
  text(702, 429, 48, 13, "Complement field: hint Opcional"),
  text(231, 609, 81, 17, "payment card title: Pagamento"),
  text(230, 633, 415, 15, "payment card line: O pagamento é feito na entrega..."),
  text(244, 701, 114, 12, "payment option label: CARTÃO DE CRÉDITO"),
  text(435, 701, 106, 12, "payment option label: CARTÃO DE DÉBITO"),
  text(626, 702, 53, 11, "payment option label: DINHEIRO"),
  text(960, 235, 147, 16, "first summary row, name: Expresso Tradicional"),
  text(1182, 233, 54, 16, "first summary row, price: R$ 9,90"),
  text(1172, 361, 64, 16, "second summary row, price: R$ 19,80"),
  text(
    992,
    398,
    8,
    12,
    "second summary row, counter value: the design mock shows 1 beside the price of two coffees; the app shows the real 2",
  ),
  text(1068, 272, 55, 10, "first summary row, Remove label: REMOVER"),
  text(1068, 400, 55, 10, "second summary row, Remove label: REMOVER"),
  text(872, 483, 84, 11, "summary line label: Total de itens"),
  text(1179, 480, 61, 17, "summary line value: R$ 29,70"),
  text(873, 516, 48, 14, "summary line label: Entrega"),
  text(1188, 513, 52, 17, "summary line value: R$ 3,50"),
  text(1161, 547, 79, 21, "summary total value: R$ 33,20"),
  text(
    990,
    611,
    132,
    12,
    "Confirm order button label: CONFIRMAR PEDIDO (the button itself is not masked)",
  ),
];

export const masks: Record<Screen, Mask[]> = {
  home: [
    text(162, 200, 568, 125, "hero title: Encontre o café perfeito para qualquer hora do dia"),
    text(
      160,
      335,
      540,
      67,
      "hero subtitle: Com o Coffee Delivery você recebe seu café onde estiver, a qualquer hora",
    ),
    text(205, 464, 200, 17, "benefit 1 text: Compra simples e segura"),
    text(482, 464, 248, 17, "benefit 2 text: Embalagem mantém o café intacto"),
    text(205, 516, 185, 17, "benefit 3 text: Entrega rápida e rastreada"),
    text(482, 516, 230, 17, "benefit 4 text: O café chega fresquinho até você"),
    text(161, 686, 191, 25, "list title: Nossos cafés"),
    ...cardMasks(),
  ],
  checkout: [...placeholders, ...checkoutText],
  "checkout-filled": checkoutText,
  success: [
    text(161, 191, 350, 24, "title: Uhu! Pedido confirmado"),
    text(160, 234, 478, 21, "subtitle: Agora é só aguardar que logo o café chegará até você"),
    text(
      245,
      338,
      308,
      39,
      "row 1 text: Entrega em Rua João Daniel Martinelli, 102 / Farrapos - Porto Alegre, RS",
    ),
    text(244, 412, 140, 36, "row 2 text: Previsão de entrega / 20 min - 30 min"),
    text(244, 486, 161, 36, "row 3 text: Pagamento na entrega / Cartão de Crédito"),
  ],
};
