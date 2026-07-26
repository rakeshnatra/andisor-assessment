function toCamel(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

export function keysToCamel(input: any): any {
  if (Array.isArray(input)) {
    return input.map(keysToCamel);
  }
  if (input !== null && typeof input === 'object' && !(input instanceof Date)) {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [toCamel(key), keysToCamel(value)]),
    );
  }
  return input;
}