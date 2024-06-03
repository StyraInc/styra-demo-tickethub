import { Input, Result } from "@styra/opa";
import { loadPolicy, LoadedPolicy } from "./wasm-sdk";

export class WasmSDK {
  private source: string;
  private policy?: LoadedPolicy;

  constructor(source: string) {
    this.source = source;
  }

  async init(): Promise<void> {
    this.policy = await loadPolicy(fetch(this.source));
  }

  evaluate(path: string, input: Input): Promise<Result> {
    if (!this.policy) throw new Error("WasmSDK not initizalized");
    const resultSet = this.policy?.evaluate(input, path);
    if (resultSet?.length != 1)
      throw new Error(`expected one result, got ${resultSet?.length}`);
    return resultSet[0].result;
  }

  setData(data: { [k: string]: any }) {
    if (!this.policy) throw new Error("WasmSDK not initizalized");
    this.policy.setData(data);
  }
}
