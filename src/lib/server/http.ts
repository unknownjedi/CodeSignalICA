import { NextResponse } from "next/server";

export function json(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function errorJson(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function notFound(message = "Not found"): NextResponse {
  return errorJson(message, 404);
}

export function badRequest(message: string): NextResponse {
  return errorJson(message, 400);
}

export function serverError(message = "Something went wrong."): NextResponse {
  return errorJson(message, 500);
}
