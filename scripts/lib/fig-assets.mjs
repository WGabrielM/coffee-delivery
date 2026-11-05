// Turns a decoded Figma document into the assets of the app: icons, logo, illustration, and the
// matching of the coffee photos. Pure functions over the message of fig-file.mjs, so they can be
// tested without the `.fig` file. Used by extract-figma-assets.mjs.

/** The slugs of the catalog seed (apps/api, spec 004), in grid order. */
export const COFFEE_SLUGS = [
  "traditional-espresso",
  "american-espresso",
  "creamy-espresso",
  "iced-espresso",
  "coffee-with-milk",
  "latte",
  "cappuccino",
  "macchiato",
  "mochaccino",
  "hot-chocolate",
  "cuban",
  "hawaiian",
  "arabic",
  "irish",
];

/** The coffee names as the Figma cards spell them (Portuguese), mapped to the slugs. */
export const FIGMA_COFFEE_NAMES = {
  "Expresso Tradicional": "traditional-espresso",
  "Expresso Americano": "american-espresso",
  "Expresso Cremoso": "creamy-espresso",
  "Expresso Gelado": "iced-espresso",
  "Café com Leite": "coffee-with-milk",
  Latte: "latte",
  Capuccino: "cappuccino",
  Macchiato: "macchiato",
  Mocaccino: "mochaccino",
  "Chocolate Quente": "hot-chocolate",
  Cubano: "cuban",
  Havaiano: "hawaiian",
  Árabe: "arabic",
  Irlandês: "irish",
};

/** The icon names of the app, in the order of the spec. */
export const ICON_NAMES = [
  "shopping-cart-fill",
  "timer-fill",
  "package-fill",
  "coffee-fill",
  "map-pin-fill",
  "map-pin-line",
  "currency-dollar",
  "trash",
  "plus-bold",
  "minus-bold",
  "credit-card",
  "money",
  "bank",
];

/** `Type=currenc-dollar-regular` (the Figma name, with its typo) becomes `currency-dollar`. */
export function normalizeIconName(figmaName) {
  return figmaName
    .replace(/^Type=/, "")
    .replace(/-regular$/, "")
    .replace(/^currenc-/, "currency-");
}

const idOf = (guid) => `${guid.sessionID}:${guid.localID}`;

/** Indexes the nodes by guid and by parent so the tree can be walked. */
export function indexDocument(message) {
  const byId = new Map();
  const children = new Map();
  for (const node of message.nodeChanges) {
    byId.set(idOf(node.guid), node);
    if (node.parentIndex === undefined) continue;
    const parent = idOf(node.parentIndex.guid);
    if (!children.has(parent)) children.set(parent, []);
    children.get(parent).push(node);
  }
  return {
    byId,
    children: (node) => children.get(idOf(node.guid)) ?? [],
    blobs: message.blobs,
    nodes: message.nodeChanges,
  };
}

/** Every node below `node`, depth first. */
export function* descendants(index, node) {
  for (const child of index.children(node)) {
    yield child;
    yield* descendants(index, child);
  }
}

const trim = (value) => String(Number(value.toFixed(3)));

/** Converts a Figma path blob (0 close, 1 move, 2 line, 3 quadratic, 4 cubic) into SVG path data. */
export function pathData(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const letters = { 1: ["M", 2], 2: ["L", 2], 3: ["Q", 4], 4: ["C", 6] };
  const parts = [];
  let offset = 0;
  while (offset < bytes.length) {
    const command = bytes[offset];
    offset += 1;
    if (command === 0) {
      parts.push("Z");
      continue;
    }
    const [letter, count] = letters[command] ?? [];
    if (letter === undefined)
      throw new Error(`Unknown path command ${command} at byte ${offset - 1}.`);
    const values = [];
    for (let index = 0; index < count; index += 1) {
      values.push(trim(view.getFloat32(offset, true)));
      offset += 4;
    }
    parts.push(`${letter}${values.join(" ")}`);
  }
  return parts.join("");
}

const channel = (value) =>
  Math.round(value * 255)
    .toString(16)
    .padStart(2, "0");

/** `#RRGGBB` from a Figma color with channels from 0 to 1. */
export function hexColor({ r, g, b }) {
  return `#${channel(r)}${channel(g)}${channel(b)}`.toUpperCase();
}

const IDENTITY = { m00: 1, m01: 0, m02: 0, m10: 0, m11: 1, m12: 0 };

/** The product of two affine transforms: `parent` applied after `child`. */
export function multiply(parent, child) {
  return {
    m00: parent.m00 * child.m00 + parent.m01 * child.m10,
    m01: parent.m00 * child.m01 + parent.m01 * child.m11,
    m02: parent.m00 * child.m02 + parent.m01 * child.m12 + parent.m02,
    m10: parent.m10 * child.m00 + parent.m11 * child.m10,
    m11: parent.m10 * child.m01 + parent.m11 * child.m11,
    m12: parent.m10 * child.m02 + parent.m11 * child.m12 + parent.m12,
  };
}

/** An SVG `transform` attribute value, or `undefined` for the identity. */
export function svgTransform(transform) {
  const { m00, m10, m01, m11, m02, m12 } = transform;
  const values = [m00, m10, m01, m11, m02, m12].map(trim);
  return values.join(" ") === "1 0 0 1 0 0" ? undefined : `matrix(${values.join(" ")})`;
}

/** The solid color a node is filled with, with its opacity. */
function solidFill(node) {
  const paint = (node.fillPaints ?? []).find(
    (candidate) => candidate.type === "SOLID" && candidate.visible !== false,
  );
  if (paint === undefined) return undefined;
  return { color: hexColor(paint.color), opacity: (paint.opacity ?? 1) * (node.opacity ?? 1) };
}

/**
 * The outlines to draw for the vectors below `root`: one entry per fill geometry, with the
 * transform accumulated from `root` down, in painting order. A node that has its own fill paint
 * is drawn and not entered (a boolean operation already holds the merged outline).
 */
export function outlines(index, root) {
  return collectOutlines(index, index.children(root));
}

/** The outlines of the given nodes, each one placed relative to a parent that sits at the origin. */
export function collectOutlines(index, nodes) {
  const found = [];
  function visit(node, parentTransform) {
    if (node.visible === false) return;
    const transform = multiply(parentTransform, node.transform ?? IDENTITY);
    const fill = solidFill(node);
    if (node.fillGeometry?.length > 0 && fill !== undefined) {
      for (const geometry of node.fillGeometry) {
        found.push({
          node,
          transform,
          fill,
          styleID: geometry.styleID ?? 0,
          evenOdd: geometry.windingRule === "ODD",
          d: pathData(index.blobs[geometry.commandsBlob].bytes),
        });
      }
      return;
    }
    for (const child of index.children(node)) visit(child, transform);
  }
  for (const node of nodes) visit(node, IDENTITY);
  return found;
}

function pathElement(outline, fillAttribute) {
  const attributes = [`d="${outline.d}"`];
  const transform = svgTransform(outline.transform);
  if (transform !== undefined) attributes.push(`transform="${transform}"`);
  attributes.push(fillAttribute);
  if (outline.fill.opacity !== 1) attributes.push(`fill-opacity="${trim(outline.fill.opacity)}"`);
  if (outline.evenOdd) attributes.push('fill-rule="evenodd"');
  return `<path ${attributes.join(" ")}/>`;
}

/** A 32x32 icon that is drawn in `currentColor`, from one of the symbols of the Style Guide. */
export function iconSvg(index, symbol) {
  const paths = outlines(index, symbol).map((outline) =>
    pathElement(outline, 'fill="currentColor"'),
  );
  if (paths.length === 0) throw new Error(`The icon ${symbol.name} has no outline.`);
  const { x, y } = symbol.size;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${trim(x)}" height="${trim(y)}" ` +
    `viewBox="0 0 ${trim(x)} ${trim(y)}" fill="currentColor">${paths.join("")}</svg>\n`
  );
}

/** The color of the style a fill override points to (for example `Brand/Purple`). */
function styleColor(index, styleGuid) {
  const style = index.byId.get(idOf(styleGuid));
  const fill = style === undefined ? undefined : solidFill(style);
  if (fill === undefined) throw new Error(`The fill style ${idOf(styleGuid)} has no solid color.`);
  return fill.color;
}

/** An SVG that keeps its own colors, from a vector node or from the vectors of a frame. */
export function colorSvg(index, node) {
  const isVector = node.fillGeometry?.length > 0 && solidFill(node) !== undefined;
  // A lone vector is drawn at the origin of its own SVG, so its position on the page is dropped.
  const list = isVector
    ? collectOutlines(index, [{ ...node, transform: IDENTITY }])
    : outlines(index, node);

  const overrides = new Map(
    (node.vectorData?.styleOverrideTable ?? [])
      .filter((entry) => entry.styleIdForFill !== undefined)
      .map((entry) => [entry.styleID, styleColor(index, entry.styleIdForFill.guid)]),
  );
  const paths = list.map((outline) => {
    const color = overrides.get(outline.styleID) ?? outline.fill.color;
    return pathElement(outline, `fill="${color}"`);
  });
  const { x, y } = node.size;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${trim(x)}" height="${trim(y)}" ` +
    `viewBox="0 0 ${trim(x)} ${trim(y)}">${paths.join("")}</svg>\n`
  );
}

const hexOf = (hash) => Buffer.from(hash).toString("hex");

/** The hash of the first image paint of the node or of its descendants. */
function imageHash(index, node) {
  for (const candidate of [node, ...descendants(index, node)]) {
    const paint = (candidate.fillPaints ?? []).find((entry) => entry.type === "IMAGE");
    if (paint !== undefined) return hexOf(paint.image.hash);
  }
  return undefined;
}

/**
 * The 14 coffee cards of the Home screen with the photo each one shows. A card is an instance of
 * the `Type=Catalog` symbol: its title is a text override (or the symbol's own text), and its photo
 * is the symbol chosen for the nested `Coffee` instance (an override, or the symbol's default).
 */
export function findCoffeeCards(index) {
  const catalog = index.nodes.find(
    (node) => node.type === "SYMBOL" && node.name === "Type=Catalog",
  );
  if (catalog === undefined) throw new Error("The symbol Type=Catalog is not in the file.");
  const parts = [...descendants(index, catalog)];
  const title = parts.find((node) => node.type === "TEXT" && node.name === "Name");
  const photo = parts.find((node) => node.type === "INSTANCE" && node.name === "Coffee");
  if (title === undefined || photo === undefined) {
    throw new Error("The Type=Catalog symbol has no Name text or Coffee instance.");
  }

  const instances = index.nodes.filter(
    (node) => node.type === "INSTANCE" && idOf(node.symbolData.symbolID) === idOf(catalog.guid),
  );
  return instances.map((card) => {
    const overrides = card.symbolData.symbolOverrides ?? [];
    const forPart = (part) =>
      overrides.filter((entry) => idOf(entry.guidPath.guids.at(-1)) === idOf(part.guid));
    const text = forPart(title).find((entry) => entry.textData)?.textData.characters;
    const symbolGuid =
      forPart(photo).find((entry) => entry.overriddenSymbolID)?.overriddenSymbolID ??
      photo.symbolData.symbolID;
    const symbol = index.byId.get(idOf(symbolGuid));
    return {
      card,
      title: text ?? title.textData.characters,
      symbolName: symbol.name,
      hash: imageHash(index, symbol),
      x: card.transform.m02,
      y: card.transform.m12,
    };
  });
}

/** The cards in reading order of the grid (rows first, then columns). */
export function inGridOrder(cards) {
  return cards.toSorted((a, b) => a.y - b.y || a.x - b.x);
}
