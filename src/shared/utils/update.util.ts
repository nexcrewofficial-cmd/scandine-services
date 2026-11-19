/** Flatten validated objects so partial nested edits preserve sibling fields. */
export function flattenUpdate(
  input: Record<string, unknown>,
  prefix = "",
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    ) {
      Object.assign(
        result,
        flattenUpdate(value as Record<string, unknown>, path),
      );
    } else {
      result[path] = value;
    }
  }
  return result;
}
