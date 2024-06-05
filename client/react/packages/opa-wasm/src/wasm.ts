import { Input, ToInput, Result } from "@styra/opa";
import { loadPolicy, LoadedPolicy, ResultSet } from "./wasm-sdk";

export class WasmSDK {
  private source: string;
  private policy?: LoadedPolicy;

  constructor(source: string) {
    this.source = source;
  }

  async init(): Promise<void> {
    this.policy = await loadPolicy(fetch(this.source));
  }

  evaluate(path?: string, input?: Input): Promise<Result> {
    if (!this.policy) throw new Error("WasmSDK not initizalized");
    if (input && implementsToInput(input)) input = input.toInput();
    return promise(this.policy?.evaluate(input, path));
  }

  evaluateDefault(input?: Input): Promise<Result> {
    return this.evaluate(undefined, input);
  }

  setData(data: { [k: string]: any }) {
    if (!this.policy) throw new Error("WasmSDK not initizalized");
    this.policy.setData(data);
  }
}

function implementsToInput(object: any): object is ToInput {
  const u = object as ToInput;
  return u.toInput !== undefined && typeof u.toInput == "function";
}

function promise(rs: ResultSet): Promise<Result> {
  return new Promise((resolve, reject) => {
    if (rs?.length > 1)
      throw new Error(`expected one result, got ${rs?.length}`);
    if (rs?.length === 1) resolve(rs[0]?.result as Result);
    return reject("empty result");
  });
}
