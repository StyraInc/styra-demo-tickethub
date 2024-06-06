import { Input, ToInput } from "@styra/opa";
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

  evaluate<In extends Input | ToInput, Res>(
    path?: string,
    input?: In,
  ): Promise<Res> {
    if (!this.policy) throw new Error("WasmSDK not initizalized");
    let inp: Input | undefined;
    if (input !== undefined && implementsToInput(input)) {
      inp = input.toInput();
    } else {
      inp = input;
    }
    return promise<Res>(this.policy?.evaluate(inp, path));
  }

  evaluateDefault<In extends Input | ToInput, Res>(input?: In): Promise<Res> {
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

function promise<Res>(rs: ResultSet): Promise<Res> {
  return new Promise((resolve, reject) => {
    if (rs?.length > 1)
      throw new Error(`expected one result, got ${rs?.length}`);
    if (rs?.length === 1) resolve(rs[0]?.result as Res);
    return reject("empty result");
  });
}
