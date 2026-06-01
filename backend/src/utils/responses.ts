import type { Response } from "express";

export function sendOk<T>(response: Response, data: T) {
  response.status(200).json({ data });
}

export function sendCreated<T>(response: Response, data: T) {
  response.status(201).json({ data });
}
