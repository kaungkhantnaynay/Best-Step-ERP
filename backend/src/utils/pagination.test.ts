import { describe, expect, it } from "vitest";
import { AppError } from "./app-error.js";
import {
  decodeCursor,
  encodeCursor,
  getNextCursor,
  parseCursorPagination,
  parsePagePagination,
} from "./pagination.js";

describe("pagination helpers", () => {
  it("caps page pagination limits", () => {
    expect(parsePagePagination({ page: "2", limit: "500" })).toEqual({
      page: 2,
      limit: 100,
      skip: 100,
    });
  });

  it("rejects malformed page values", () => {
    expect(() => parsePagePagination({ page: "nope" })).toThrow(AppError);
  });

  it("encodes and decodes cursors", () => {
    const cursor = encodeCursor({ id: "item-1", createdAt: "2026-05-29T00:00:00.000Z" });

    expect(decodeCursor(cursor)).toEqual({
      id: "item-1",
      createdAt: "2026-05-29T00:00:00.000Z",
    });
  });

  it("rejects malformed cursors", () => {
    expect(() => parseCursorPagination({ cursor: "not-base64" })).toThrow(AppError);
  });

  it("returns a next cursor when rows exceed the limit", () => {
    const rows = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const cursor = getNextCursor(rows, 2, (row) => ({ id: row.id }));

    expect(decodeCursor(cursor)).toEqual({ id: "b" });
  });
});
