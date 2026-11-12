export function last<T>(values: readonly T[]): T {
  const value = values.at(-1);
  if (value === undefined) throw new Error("runtime_values_empty");
  return value;
}
