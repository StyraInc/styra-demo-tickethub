import { describe, before, after, it } from "node:test";
import assert from "node:assert";
import { readFile } from "fs/promises";
import { MockAgent, setGlobalDispatcher } from "undici";
import { Shell, $, tmpdir, tmpfile } from "zx";
import { WasmSDK } from "../src/wasm";

describe("evaluate", async () => {
  const policy = `
package test

import rego.v1

# METADATA
# entrypoint: true
p_bool if true

# METADATA
# entrypoint: true
p_bool_builtin if json.is_valid(input.foo)

# METADATA
# entrypoint: true
p_bool_false if input == false

has_type.type := type_name(input)

compound_input.foo := "bar" if input == {"name": "alice", "list": [1, 2, true]}

compound_result.allowed := true
`;
  const slash = `package has["weird/package"].but
import rego.v1

# METADATA
# entrypoint: true
it_is := true`;
  let $$: Shell;
  let sdk: WasmSDK;

  before(async () => {
    const tmp = tmpdir();
    $$ = $({
      verbose: true,
      cwd: tmp,
    });
    const policyFile = tmpfile("policy.rego", policy);
    const policyFile2 = tmpfile("second.rego", slash);
    // NOTE(sr): We need these extra entrypoint args:
    // - test/p_bool should be entrypoint 0, i.e. the default
    // - prefixes can't be made entrypoints via metadata
    await $$`opa build --target wasm --entrypoint test/p_bool --entrypoint test/compound_input --entrypoint test/has_type ${policyFile} ${policyFile2}`;
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

  it("default can be called without input", async () => {
    const res = await sdk.evaluateDefault();
    assert.strictEqual(res, true);
  });

  it("default can be called with input", async () => {
    const res = await sdk.evaluateDefault("this is ignored by the rule");
    assert.strictEqual(res, true);
  });

  it("can be called with input==false", async () => {
    const res = await sdk.evaluate("test/p_bool_false", false);
    assert.strictEqual(res, true);
  });

  it("supports rules with slashes", async () => {
    const res = await sdk.evaluate("has/weird/package/but/it_is"); // TODO(sr): This is a bug, https://github.com/open-policy-agent/opa/issues/6794
    assert.strictEqual(res, true);
  });

  it("supports input/result types", async () => {
    interface myInput {
      name: string;
      list: any[];
    }
    interface myResult {
      foo: string;
    }
    const inp: myInput = { name: "alice", list: [1, 2, true] };
    const res = await sdk.evaluate<myInput, myResult>(
      "test/compound_input",
      inp,
    );
    assert.deepStrictEqual(res, { foo: "bar" });
  });

  it("supports input of type bool", async () => {
    interface typeResult {
      type: string;
    }
    const inp = true;
    const res = await sdk.evaluate<boolean, typeResult>("test/has_type", inp);
    assert.deepStrictEqual(res, { type: "boolean" });
  });

  it("calls stringify on a class as input", async () => {
    class A {
      // These are so that JSON.stringify() returns the right thing.
      name: string;
      list: any[];

      constructor(name: string, list: any[]) {
        this.name = name;
        this.list = list;
      }
    }
    const inp = new A("alice", [1, 2, true]);

    interface myResult {
      foo: string;
    }
    const res = await sdk.evaluate<A, myResult>("test/compound_input", inp);
    assert.deepStrictEqual(res, { foo: "bar" });
  });

  it("supports input class implementing ToInput", async () => {
    class A implements ToInput {
      // These are so that JSON.stringify() doesn't return the right thing.
      private n: string;
      private l: any[];

      constructor(name: string, list: any[]) {
        this.n = name;
        this.l = list;
      }

      toInput(): Input {
        return { name: this.n, list: this.l };
      }
    }
    const inp = new A("alice", [1, 2, true]);

    interface myResult {
      foo: string;
    }
    const res = await sdk.evaluate<A, myResult>("test/compound_input", inp);
    assert.deepStrictEqual(res, { foo: "bar" });
  });

  after(async () => {
    await $$`rm bundle.tar.gz policy.wasm`;
  });
});
