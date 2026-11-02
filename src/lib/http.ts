import { isTeacher } from "./auth";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export function ok<T>(data: T, status = 200): Response {
  return Response.json({ success: true, data } satisfies ApiResponse<T>, { status });
}

export function fail(error: string, status = 400, headers?: HeadersInit): Response {
  return Response.json({ success: false, error } satisfies ApiResponse<never>, { status, headers });
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/** Returns a 401 response when the caller is not the teacher. */
export async function requireTeacher(): Promise<Response | null> {
  return (await isTeacher()) ? null : fail("Faça login como professor.", 401);
}

/** Logs unexpected errors and returns a generic message to the client. */
export function serverError(context: string, error: unknown): Response {
  console.error(`[api] ${context}`, error);
  const message = error instanceof Error && error.message.startsWith("Banco de dados") ? error.message : "Erro interno. Tente novamente.";
  return fail(message, 500);
}
