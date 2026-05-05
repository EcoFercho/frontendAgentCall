export function splitRuleValues(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function joinRuleValues(values: string[]) {
  return values.join(", ");
}
