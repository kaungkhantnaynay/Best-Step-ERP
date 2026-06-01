import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";
import { env } from "../config/env.js";

export const requestContext: RequestHandler = (request, response, next) => {
  const incomingRequestId = request.header(env.REQUEST_ID_HEADER);
  const requestId = incomingRequestId?.trim() || randomUUID();

  request.requestId = requestId;
  response.setHeader(env.REQUEST_ID_HEADER, requestId);

  next();
};
