import { AppError } from "./app-error.js";

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

function toPositiveInteger(value: unknown, fallback: number) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(400, "INVALID_PAGINATION", "Pagination values must be positive integers");
  }

  return parsed;
}

export function parseLimit(value: unknown, maxLimit = MAX_LIMIT) {
  return Math.min(toPositiveInteger(value, DEFAULT_LIMIT), maxLimit);
}

export function parsePagePagination(query: { page?: unknown; limit?: unknown }) {
  const page = toPositiveInteger(query.page, 1);
  const limit = parseLimit(query.limit);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

export function encodeCursor(payload: Record<string, string>) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeCursor(cursor: unknown) {
  if (cursor === undefined || cursor === null || cursor === "") {
    return undefined;
  }

  if (typeof cursor !== "string") {
    throw new AppError(400, "INVALID_CURSOR", "Cursor must be a string");
  }

  try {
    return JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as Record<string, string>;
  } catch {
    throw new AppError(400, "INVALID_CURSOR", "Cursor is malformed");
  }
}

export function parseCursorPagination(query: { cursor?: unknown; limit?: unknown }) {
  return {
    cursor: decodeCursor(query.cursor),
    limit: parseLimit(query.limit),
  };
}

export function getNextCursor<T>(
  rows: T[],
  limit: number,
  pickCursor: (row: T) => Record<string, string>,
) {
  if (rows.length <= limit) {
    return undefined;
  }

  return encodeCursor(pickCursor(rows[limit - 1]));
}
