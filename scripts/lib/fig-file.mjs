// Reads a Figma `.fig` file offline, with no dependency: the ZIP container, the `fig-kiwi` canvas,
// and the Kiwi binary encoding Figma uses for the document tree. Used by extract-figma-assets.mjs.
import * as zlib from "node:zlib";

const { inflateRawSync } = zlib;
const ZIP_END_OF_CENTRAL_DIRECTORY = 0x06054b50;
const ZSTD_MAGIC = [0x28, 0xb5, 0x2f, 0xfd];

/** The entries of a ZIP buffer as a map of file name to its uncompressed bytes. */
export function readZip(buffer) {
  let end = -1;
  for (let index = buffer.length - 22; index >= 0; index -= 1) {
    if (buffer.readUInt32LE(index) === ZIP_END_OF_CENTRAL_DIRECTORY) {
      end = index;
      break;
    }
  }
  if (end < 0) throw new Error("Not a ZIP container: end of central directory not found.");

  const count = buffer.readUInt16LE(end + 10);
  let offset = buffer.readUInt32LE(end + 16);
  const files = new Map();
  for (let entry = 0; entry < count; entry += 1) {
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString("utf8", offset + 46, offset + 46 + nameLength);
    offset += 46 + nameLength + extraLength + commentLength;
    if (name.endsWith("/")) continue;

    const dataStart =
      localOffset +
      30 +
      buffer.readUInt16LE(localOffset + 26) +
      buffer.readUInt16LE(localOffset + 28);
    const raw = buffer.subarray(dataStart, dataStart + compressedSize);
    if (method === 0) files.set(name, raw);
    else if (method === 8) files.set(name, inflateRawSync(raw));
    else throw new Error(`ZIP entry ${name} uses the unsupported method ${method}.`);
  }
  return files;
}

/** Splits a `fig-kiwi` canvas into its chunks (the schema first, then the document) and inflates them. */
export function readCanvasChunks(canvas) {
  const prelude = canvas.toString("latin1", 0, 8);
  if (prelude !== "fig-kiwi" && prelude !== "fig-jam.") {
    throw new Error(`Not a Figma canvas: the magic bytes are "${prelude}".`);
  }
  const chunks = [];
  let offset = 12; // 8 magic bytes and a 4-byte version
  while (offset + 4 <= canvas.length) {
    const length = canvas.readUInt32LE(offset);
    const data = canvas.subarray(offset + 4, offset + 4 + length);
    offset += 4 + length;
    chunks.push(isZstd(data) ? zstdDecompress(data) : inflateRawSync(data));
  }
  return chunks;
}

function zstdDecompress(data) {
  if (typeof zlib.zstdDecompressSync !== "function") {
    throw new Error(
      `This .fig file uses zstd, which needs Node 22.15 or newer (this is ${process.version}).`,
    );
  }
  return zlib.zstdDecompressSync(data);
}

function isZstd(data) {
  return ZSTD_MAGIC.every((byte, index) => data[index] === byte);
}

const BUILT_IN_TYPES = ["bool", "byte", "int", "uint", "float", "string", "int64", "uint64"];
const KINDS = ["ENUM", "STRUCT", "MESSAGE"];

/** A cursor over Kiwi-encoded bytes with the primitive readers of the format. */
export class KiwiReader {
  constructor(bytes) {
    this.bytes = bytes;
    this.offset = 0;
  }

  byte() {
    if (this.offset >= this.bytes.length) throw new Error("Kiwi data ended unexpectedly.");
    const value = this.bytes[this.offset];
    this.offset += 1;
    return value;
  }

  varUint() {
    let result = 0;
    let shift = 0;
    for (;;) {
      const byte = this.byte();
      result += (byte & 0x7f) * 2 ** shift;
      if ((byte & 0x80) === 0) return result;
      shift += 7;
    }
  }

  varInt() {
    const value = this.varUint();
    return value % 2 === 1 ? -(value + 1) / 2 : value / 2;
  }

  varFloat() {
    if (this.bytes[this.offset] === 0) {
      this.offset += 1;
      return 0;
    }
    let bits = this.byte() | (this.byte() << 8) | (this.byte() << 16) | (this.byte() << 24);
    bits = (bits << 23) | (bits >>> 9);
    const view = new DataView(new ArrayBuffer(4));
    view.setInt32(0, bits);
    return view.getFloat32(0);
  }

  string() {
    const start = this.offset;
    while (this.byte() !== 0) {
      // keep reading until the terminating zero
    }
    return Buffer.from(this.bytes.subarray(start, this.offset - 1)).toString("utf8");
  }

  slice(length) {
    const value = this.bytes.subarray(this.offset, this.offset + length);
    this.offset += length;
    return value;
  }
}

/** Decodes the binary Kiwi schema into a list of definitions. */
export function decodeSchema(bytes) {
  const reader = new KiwiReader(bytes);
  const count = reader.varUint();
  const definitions = [];
  for (let index = 0; index < count; index += 1) {
    const name = reader.string();
    const kind = KINDS[reader.byte()];
    const fields = [];
    const fieldCount = reader.varUint();
    for (let field = 0; field < fieldCount; field += 1) {
      fields.push({
        name: reader.string(),
        type: reader.varInt(),
        isArray: reader.byte() === 1,
        value: reader.varUint(),
      });
    }
    definitions.push({ name, kind, fields });
  }
  for (const definition of definitions) {
    for (const field of definition.fields) {
      field.type = field.type < 0 ? BUILT_IN_TYPES[~field.type] : definitions[field.type].name;
    }
  }
  return definitions;
}

/** Decodes a message of the named root definition (Figma uses `Message`). */
export function decodeMessage(definitions, rootName, bytes) {
  const byName = new Map(definitions.map((definition) => [definition.name, definition]));
  const reader = new KiwiReader(bytes);

  function readValue(type) {
    switch (type) {
      case "bool":
        return reader.byte() === 1;
      case "byte":
        return reader.byte();
      case "int":
        return reader.varInt();
      case "uint":
        return reader.varUint();
      case "float":
        return reader.varFloat();
      case "string":
        return reader.string();
      case "int64":
      case "uint64":
        return reader.varUint();
      default:
        return readDefined(byName.get(type));
    }
  }

  function readDefined(definition) {
    if (definition.kind === "ENUM") {
      const value = reader.varUint();
      return definition.fields.find((field) => field.value === value)?.name ?? value;
    }
    const result = {};
    if (definition.kind === "STRUCT") {
      for (const field of definition.fields) result[field.name] = readField(field);
      return result;
    }
    for (;;) {
      const id = reader.varUint();
      if (id === 0) return result;
      const field = definition.fields.find((candidate) => candidate.value === id);
      if (field === undefined) throw new Error(`${definition.name} has no field with id ${id}.`);
      result[field.name] = readField(field);
    }
  }

  function readField(field) {
    if (!field.isArray) return readValue(field.type);
    const length = reader.varUint();
    if (field.type === "byte") return reader.slice(length);
    const items = [];
    for (let index = 0; index < length; index += 1) items.push(readValue(field.type));
    return items;
  }

  return readDefined(byName.get(rootName));
}

/** Opens a `.fig` file: the document message and the images stored by hash. */
export function openFig(buffer) {
  const files = readZip(buffer);
  const canvas = files.get("canvas.fig");
  if (canvas === undefined) throw new Error("The .fig file has no canvas.fig entry.");

  const [schemaBytes, dataBytes] = readCanvasChunks(canvas);
  const message = decodeMessage(decodeSchema(schemaBytes), "Message", dataBytes);
  const images = new Map();
  for (const [name, bytes] of files) {
    if (name.startsWith("images/")) images.set(name.slice("images/".length), bytes);
  }
  return { message, images };
}
