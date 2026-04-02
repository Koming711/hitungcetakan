/**
 * Convert camelCase keys to snake_case for Supabase compatibility.
 */
export function toSnakeCase<T = Record<string, unknown>>(obj: Record<string, unknown>): T {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
    result[snakeKey] = value
  }
  return result as T
}

/**
 * Convert snake_case keys to camelCase for frontend compatibility.
 * Works on single objects and arrays.
 */
export function toCamelCase<T = Record<string, unknown>>(data: unknown): T {
  if (Array.isArray(data)) {
    return data.map((item) => toCamelCase(item)) as T
  }
  if (data !== null && typeof data === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())
      result[camelKey] = value
    }
    return result as T
  }
  return data as T
}
