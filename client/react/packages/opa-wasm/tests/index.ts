import { describe, before, after, it } from "node:test";
import assert from "node:assert";
import { readFile } from "fs/promises";
import { MockAgent, setGlobalDispatcher } from "undici";
import { Shell, $, tmpdir, tmpfile } from "zx";
import { WasmSDK } from "../src/wasm";

describe("evaluate", async () => {
  const policy = `package test
import rego.v1
p_bool if true
p_bool_builtin if json.is_valid(input.foo)
`;
  let $$: Shell;
  let sdk: WasmSDK;

  before(async () => {
    const tmp = tmpdir();
    $$ = $({
      verbose: true,
      cwd: tmp,
    });
    const policyFile = tmpfile("policy.rego", policy);
    await $$`opa build --target wasm --entrypoint test/p_bool --entrypoint test/p_bool_builtin ${policyFile}`;
    await $$`tar zxvf bundle.tar.gz /policy.wasm`;
    const wasm = await readFile(tmp + "/policy.wasm");

    const agent = new MockAgent();
    agent.disableNetConnect();
    agent
      .get("https://opa.home")
      .intercept({
        path: "/policy.wasm",
        method: "GET",
      })
      .reply(200, wasm, {
        headers: { "content-type": "application/wasm" },
      });
    setGlobalDispatcher(agent);
    sdk = new WasmSDK("https://opa.home/policy.wasm");
    await sdk.init();
  });

  it("can be called without types, without input", async () => {
    const res = await sdk.evaluate("test/p_bool");
    assert.strictEqual(res, true);
  });

  it("can be called without types, with builtin", async () => {
    const res = await sdk.evaluate("test/p_bool_builtin", { foo: '"bar"' });
    assert.strictEqual(res, true);
  });

  after(async () => {
    await $$`rm bundle.tar.gz policy.wasm`;
  });
});
