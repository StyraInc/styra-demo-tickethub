import { isValidJSON } from "./strings";
export const builtins: { [k: string]: CallableFunction } = {
  "json.is_valid": isValidJSON,
};
