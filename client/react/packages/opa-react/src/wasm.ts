import { LoadedPolicy, loadPolicy } from "@open-policy-agent/opa-wasm";
import { Input, Result } from "@styra/opa";

export class WasmSDK {
  private source: string;
  private policy: LoadedPolicy;

  constructor(source: string) {
    this.source = source;
  }

  async init(): Promise<void> {
    this.policy = await fetch(this.source)
      .then((response) => response.arrayBuffer())
      .then((b) => loadPolicy(b));
  }

  async evaluate(_path: string, input: Input): Promise<Result> {
    return this.policy.evaluate(input);
  }
}
