export function stringifyRecursive(data: unknown, space: string | number = 2): string {
  return JSON.stringify(
    data,
    (_key, value) => {
      if (value instanceof Map) {
        return Object.fromEntries(value);
      }
      if (value instanceof Set) {
        return Array.from(value);
      }
      return value;
    },
    space
  );
}
