import { builtins as builtinFuncs } from "./builtins";
// Based on npm-opa-wasm:
// Copyright 2018 The OPA Authors.  All rights reserved.
// Use of this source code is governed by an Apache2
// license that can be found in the LICENSE file.

/**
 * Stringifies and loads an object into OPA's Memory
 */
function _loadJSON(
  wasmInstance: WebAssembly.Instance,
  memory: WebAssembly.Memory,
  value: ArrayBuffer | any,
): number {
  if (value === undefined) {
    return 0;
  }

  let valueBuf;
  if (value instanceof ArrayBuffer) {
    valueBuf = new Uint8Array(value);
  } else {
    const valueAsText = JSON.stringify(value);
    valueBuf = new TextEncoder().encode(valueAsText);
  }

  const valueBufLen = valueBuf.byteLength;
  const rawAddr = callExport(wasmInstance, "opa_malloc", valueBufLen);
  const memoryBuffer = new Uint8Array(memory.buffer);
  memoryBuffer.set(valueBuf, rawAddr);

  const parsedAddr = callExport(
    wasmInstance,
    "opa_json_parse",
    rawAddr,
    valueBufLen,
  );

  if (parsedAddr === 0) {
    throw "failed to parse json value";
  }
  return parsedAddr;
}

/**
 * Dumps and parses a JSON object from OPA's Memory
 */
function _dumpJSON<T>(
  wasmInstance: WebAssembly.Instance,
  memory: WebAssembly.Memory,
  addr: number,
): T {
  const rawAddr = callExport(wasmInstance, "opa_json_dump", addr);
  return _dumpJSONRaw<T>(memory, rawAddr);
}

/**
 * Parses a JSON object from wasm instance's memory
 * @param {WebAssembly.Memory} memory
 * @param {number} addr
 * @returns {object}
 */
function _dumpJSONRaw<T>(memory: WebAssembly.Memory, addr: number): T {
  const buf = new Uint8Array(memory.buffer);

  let idx = addr;

  while (buf[idx] !== 0) {
    idx++;
  }

  const utf8View = new Uint8Array(memory.buffer, addr, idx - addr);
  const jsonAsText = new TextDecoder().decode(utf8View);

  return JSON.parse(jsonAsText);
}

/**
 * _builtinCall dispatches the built-in function. The built-in function
 * arguments are loaded from Wasm and back in using JSON serialization.
 */
function _builtinCall(
  wasmInstance: WebAssembly.Instance,
  memory: WebAssembly.Memory,
  builtins: { [builtinId: number]: string },
  customBuiltins: { [builtinName: string]: CallableFunction },
  builtinId: number,
  ...argArray: any
) {
  const builtinName = builtins[builtinId];
  if (!builtinName) return;

  const impl =
    builtinFuncs[builtinName] || builtinName
      ? customBuiltins[builtinName]
      : undefined;

  if (impl === undefined) {
    throw {
      message:
        "not implemented: built-in function " +
        builtinId +
        ": " +
        builtins[builtinId],
    };
  }

  const args = argArray.map((a: number) => _dumpJSON(wasmInstance, memory, a));
  const result = impl(...args);
  return _loadJSON(wasmInstance, memory, result);
}

export type ResultSet = [
  {
    result: any;
  },
];

type Env = {
  instance: WebAssembly.Instance;
  builtins: { [builtinId: number]: string };
};

/**
 * _importObject builds the WebAssembly.Imports
 */
function _importObject(
  env: Env,
  memory: WebAssembly.Memory,
  customBuiltins: { [builtinName: string]: Function },
): WebAssembly.Imports {
  const addr2string = stringDecoder(memory);

  return {
    env: {
      memory,
      opa_abort: function (addr: number) {
        throw addr2string(addr);
      },
      opa_println: function (addr: number) {
        console.log(addr2string(addr));
      },
      opa_builtin0: function (builtinId: number, _ctx: any) {
        return _builtinCall(
          env.instance,
          memory,
          env.builtins,
          customBuiltins,
          builtinId,
        );
      },
      opa_builtin1: function (builtinId: number, _ctx: any, arg1: any) {
        return _builtinCall(
          env.instance,
          memory,
          env.builtins,
          customBuiltins,
          builtinId,
          arg1,
        );
      },
      opa_builtin2: function (
        builtinId: number,
        _ctx: any,
        arg1: any,
        arg2: any,
      ) {
        return _builtinCall(
          env.instance,
          memory,
          env.builtins,
          customBuiltins,
          builtinId,
          arg1,
          arg2,
        );
      },
      opa_builtin3: function (
        builtinId: number,
        _ctx: any,
        arg1: any,
        arg2: any,
        arg3: any,
      ) {
        return _builtinCall(
          env.instance,
          memory,
          env.builtins,
          customBuiltins,
          builtinId,
          arg1,
          arg2,
          arg3,
        );
      },
      opa_builtin4: function (
        builtinId: number,
        _ctx: any,
        arg1: any,
        arg2: any,
        arg3: any,
        arg4: any,
      ) {
        return _builtinCall(
          env.instance,
          memory,
          env.builtins,
          customBuiltins,
          builtinId,
          arg1,
          arg2,
          arg3,
          arg4,
        );
      },
    },
  };
}

/**
 * _preparePolicy checks the ABI version and loads the built-in functions
 * @returns
 */
function _preparePolicy(
  env: Env,
  wasm: WebAssembly.WebAssemblyInstantiatedSource,
  memory: WebAssembly.Memory,
): {
  policy: WebAssembly.Instance;
  minorVersion: number;
} {
  env.instance = wasm.instance;
  const abiVersion = (
    env.instance.exports["opa_wasm_abi_version"] as WebAssembly.Global
  )?.value;
  if (abiVersion !== 1) {
    throw `unsupported ABI version ${abiVersion}`;
  }

  const abiMinorVersionGlobal =
    env.instance.exports["opa_wasm_abi_minor_version"];
  const abiMinorVersion = (abiMinorVersionGlobal as WebAssembly.Global)?.value;
  if (!abiMinorVersion) console.error("opa_wasm_abi_minor_version undefined");

  const builtins: { [k: string]: number } = _dumpJSON(
    env.instance,
    memory,
    callExport(env.instance, "builtins"),
  );

  env.builtins = {};

  for (const key of Object.keys(builtins)) {
    const b = builtins[key] as number; // NOTE(sr): We know isn't undefined, don't we?
    env.builtins[b] = key;
  }

  return { policy: env.instance, minorVersion: abiMinorVersion };
}

/**
 * _loadPolicy can take in either an ArrayBuffer or WebAssembly.Module
 * as its first argument, a WebAssembly.Memory for the second parameter,
 * and an object mapping string names to additional builtin functions for
 * the third parameter.
 * It will return a Promise, depending on the input type the promise
 * resolves to both a compiled WebAssembly.Module and its first WebAssembly.Instance
 * or to the WebAssemblyInstance.
 */
async function _loadPolicy(
  source: Response | PromiseLike<Response>,
  memory: WebAssembly.Memory,
  customBuiltins: { [builtinName: string]: Function },
): Promise<{
  policy: WebAssembly.Instance;
  minorVersion: number;
}> {
  const env = {} as Env; // XXX(sr): `instance` will be set late
  const wasm = await WebAssembly.instantiateStreaming(
    source,
    _importObject(env, memory, customBuiltins),
  );

  return _preparePolicy(env, wasm, memory);
}

/**
 * LoadedPolicy is a wrapper around a WebAssembly.Instance and WebAssembly.Memory
 * for a compiled Rego policy. There are helpers to run the wasm instance and
 * handle the output from the policy wasm.
 */
export class LoadedPolicy {
  private minorVersion: number;
  private mem: WebAssembly.Memory;
  private wasmInstance: WebAssembly.Instance;
  private dataAddr: number;
  private baseHeapPtr: number;
  private dataHeapPtr: number;
  private entrypoints?: { [k: string]: number };

  /**
   * Loads and initializes a compiled Rego policy.
   */
  constructor(
    policy: WebAssembly.Instance,
    memory: WebAssembly.Memory,
    minorVersion: number,
  ) {
    this.minorVersion = minorVersion;
    this.mem = memory;

    // Depending on how the wasm was instantiated "policy" might be a
    // WebAssembly Instance or be a wrapper around the Module and
    // Instance. We only care about the Instance.
    //this.wasmInstance = policy.instance ? policy.instance : policy;
    this.wasmInstance = policy;

    this.dataAddr = _loadJSON(this.wasmInstance, this.mem, {});
    this.baseHeapPtr = callExport(this.wasmInstance, "opa_heap_ptr_get");
    this.dataHeapPtr = this.baseHeapPtr;
    this.entrypoints = _dumpJSON(
      this.wasmInstance,
      this.mem,
      callExport(this.wasmInstance, "entrypoints"),
    );
  }

  /**
   * Evaluates the loaded policy with the given input and
   * return the result set. This should be re-used for multiple evaluations
   * of the same policy with different inputs.
   *
   * To call a non-default entrypoint in your WASM specify it as the second
   * param. A list of entrypoints can be accessed with the `this.entrypoints`
   * property.
   * @param {any | ArrayBuffer} input input to be evaluated in form of `object`, literal primitive or ArrayBuffer (last is assumed to be a well-formed stringified JSON)
   * @param {number | string} entrypoint ID or name of the entrypoint to call (optional)
   */
  evaluate(
    input: any | ArrayBuffer,
    entrypoint: number | string = 0,
  ): ResultSet {
    // determine entrypoint ID
    if (typeof entrypoint === "number") {
      // used as-is
    } else if (typeof entrypoint === "string") {
      if (
        Object.prototype.hasOwnProperty.call(this.entrypoints, entrypoint) &&
        this.entrypoints
      ) {
        entrypoint = this.entrypoints[entrypoint] as number;
      } else {
        throw `entrypoint ${entrypoint} is not valid in this instance`;
      }
    } else {
      throw `entrypoint value is an invalid type, must be either string or number`;
    }

    // ABI 1.2 fastpath
    // TODO(sr): drop the slow path code
    if (this.minorVersion >= 2) {
      // write input into memory, adjust heap pointer
      let inputBuf = null;
      let inputLen = 0;
      let inputAddr = 0;
      if (input !== undefined) {
        if (input instanceof ArrayBuffer) {
          inputBuf = new Uint8Array(input);
        } else {
          const inputAsText = JSON.stringify(input);
          inputBuf = new TextEncoder().encode(inputAsText);
        }

        inputAddr = this.dataHeapPtr;
        inputLen = inputBuf.byteLength;
        const delta = inputAddr + inputLen - this.mem.buffer.byteLength;
        if (delta > 0) {
          const pages = roundup(delta);
          this.mem.grow(pages);
        }
        const buf = new Uint8Array(this.mem.buffer);
        buf.set(inputBuf, this.dataHeapPtr);
      }

      // opa_eval will update the Instance heap pointer to the value below
      const heapPtr = this.dataHeapPtr + inputLen;

      const ret = callExport(
        this.wasmInstance,
        "opa_eval",
        0,
        entrypoint,
        this.dataAddr,
        inputAddr,
        inputLen,
        heapPtr,
        0,
      );
      return _dumpJSONRaw(this.mem, ret);
    }

    // Reset the heap pointer before each evaluation
    callExport(this.wasmInstance, "opa_heap_ptr_set", this.dataHeapPtr);

    // Load the input data
    const inputAddr = _loadJSON(this.wasmInstance, this.mem, input);

    // Setup the evaluation context
    const ctxAddr = callExport(this.wasmInstance, "opa_eval_ctx_new");
    callExport(this.wasmInstance, "opa_eval_ctx_set_input", ctxAddr, inputAddr);
    callExport(
      this.wasmInstance,
      "opa_eval_ctx_set_data",
      ctxAddr,
      this.dataAddr,
    );
    callExport(
      this.wasmInstance,
      "opa_eval_ctx_set_entrypoint",
      ctxAddr,
      entrypoint,
    );

    // Actually evaluate the policy
    callExport(this.wasmInstance, "eval", ctxAddr);

    // Retrieve the result
    const resultAddr = callExport(
      this.wasmInstance,
      "opa_eval_ctx_get_result",
      ctxAddr,
    );
    return _dumpJSON<ResultSet>(this.wasmInstance, this.mem, resultAddr);
  }

  /**
   * Loads data for use in subsequent evaluations.
   * @param {object | ArrayBuffer} data  data in form of `object` or ArrayBuffer (last is assumed to be a well-formed stringified JSON)
   */
  setData(data: object | ArrayBuffer) {
    callExport(this.wasmInstance, "opa_heap_ptr_set", this.baseHeapPtr);
    this.dataAddr = _loadJSON(this.wasmInstance, this.mem, data);
    this.dataHeapPtr = callExport(this.wasmInstance, "opa_heap_ptr_get");
  }
}

/**
 * Takes in either an ArrayBuffer or WebAssembly.Module
 * and will return a Promise of a LoadedPolicy object which
 * can be used to evaluate the policy.
 */
export async function loadPolicy(
  source: Response | PromiseLike<Response>,
  memoryDescriptor: WebAssembly.MemoryDescriptor = { initial: 5 },
  customBuiltins: { [k: string]: CallableFunction } = {},
): Promise<LoadedPolicy> {
  const memory = new WebAssembly.Memory(memoryDescriptor);
  const { policy, minorVersion } = await _loadPolicy(
    source,
    memory,
    customBuiltins,
  );
  return new LoadedPolicy(policy, memory, minorVersion);
}

function callExport(w: WebAssembly.Instance, func: string, ...args: any): any {
  const exp = w.exports[func];
  if (!exp) throw new Error(`expected export ${func} not found`);
  return (exp as CallableFunction)(...args);
}

function roundup(bytes: number) {
  const pageSize = 64 * 1024;
  return Math.ceil(bytes / pageSize);
}

// TODO(sr): use TextDecoder
function stringDecoder(mem: WebAssembly.Memory) {
  return function (addr: number) {
    const i8 = new Int8Array(mem.buffer);
    let s = "";
    while (i8[addr] !== 0) {
      s += String.fromCharCode(i8[addr++] as number); // NB(sr): We know this isn't undefined
    }
    return s;
  };
}
