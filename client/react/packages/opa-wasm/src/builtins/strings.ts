export function isValidJSON(str: string): boolean | undefined {
  if (typeof str !== "string") {
    return;
  }
  try {
    JSON.parse(str);
  } catch (err) {
    return err instanceof SyntaxError ? false : undefined;
  }
  return true;
}
