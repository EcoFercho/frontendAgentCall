const API_URL = "http://localhost:3000/api";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
type RequestOptions = {
  timeoutMs?: number;
};

export async function apiRequest<T>(
  path: string,
  method: HttpMethod,
  body?: unknown,
  token?: string,
  options?: RequestOptions
): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = options?.timeoutMs ?? 15000;
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`La solicitud excedió el tiempo límite de ${Math.round(timeoutMs / 1000)}s.`);
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorText = await response.text();

    if (errorText) {
      try {
        const parsed = JSON.parse(errorText) as { message?: string | string[] };
        if (Array.isArray(parsed.message)) {
          throw new Error(parsed.message.join(", "));
        }
        if (parsed.message) {
          throw new Error(parsed.message);
        }
      } catch {
        throw new Error(errorText);
      }
    }

    throw new Error("No se pudo completar la solicitud");
  }

  return response.json() as Promise<T>;
}
