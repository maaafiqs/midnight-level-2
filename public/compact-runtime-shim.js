/**
 * @midnight-ntwrk/compact-runtime — Browser Shim
 *
 * This file provides a lightweight browser-compatible implementation of the
 * Compact runtime APIs used by the compiled contract binding in
 * managed/contract/index.js.
 *
 * The @midnight-ntwrk/compact-runtime package is not published on the public
 * npm registry — it is only available inside a full Midnight SDK environment.
 * This shim allows the Compact-compiled contract binding to be loaded and
 * inspected in the browser (circuit metadata, ledger state logic) without
 * requiring the full native SDK.
 *
 * Real ZK proof generation is delegated to the Lace wallet via
 * api.getProvingProvider() from @midnight-ntwrk/dapp-connector-api.
 */

// ─── Version Check ───────────────────────────────────────────────────────────

export function checkRuntimeVersion(requiredVersion) {
  console.debug(`[compact-runtime shim] Contract requires runtime v${requiredVersion}`);
}

// ─── Error Types ─────────────────────────────────────────────────────────────

export class CompactError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CompactError';
  }
}

export function typeError(circuitName, argDesc, location, expectedType, actualValue) {
  throw new CompactError(
    `${circuitName}: argument ${argDesc} at ${location}: expected ${expectedType}, got ${JSON.stringify(actualValue)}`
  );
}

// ─── Type Descriptors ────────────────────────────────────────────────────────

/** Boolean type descriptor */
export const CompactTypeBoolean = {
  alignment() { return [0]; },
  fromValue(val) {
    if (Array.isArray(val)) return val[0] !== 0;
    if (val && typeof val === 'object' && 'value' in val) return val.value[0] !== 0;
    return Boolean(val);
  },
  toValue(v) { return [v ? 1 : 0]; },
};

/** Unsigned integer type descriptor */
export class CompactTypeUnsignedInteger {
  constructor(max, byteSize) {
    this.max = max;
    this.byteSize = byteSize;
  }
  alignment() { return new Array(this.byteSize).fill(0); }
  fromValue(val) {
    if (Array.isArray(val)) {
      let result = 0n;
      for (let i = val.length - 1; i >= 0; i--) result = result * 256n + BigInt(val[i] ?? 0);
      return result;
    }
    if (val && typeof val === 'object' && 'value' in val) return this.fromValue(val.value);
    return BigInt(val ?? 0);
  }
  toValue(v) {
    const bytes = [];
    let n = BigInt(v);
    for (let i = 0; i < this.byteSize; i++) {
      bytes.push(Number(n & 0xffn));
      n >>= 8n;
    }
    return bytes;
  }
}

/** Bytes type descriptor */
export class CompactTypeBytes {
  constructor(size) {
    this.size = size;
  }
  alignment() { return new Array(this.size).fill(0); }
  fromValue(val) {
    if (Array.isArray(val)) return new Uint8Array(val.slice(0, this.size));
    if (val && typeof val === 'object' && 'value' in val) return this.fromValue(val.value);
    return new Uint8Array(this.size);
  }
  toValue(v) {
    const arr = v instanceof Uint8Array ? Array.from(v) : new Array(this.size).fill(0);
    return arr.slice(0, this.size);
  }
}

// ─── StateValue ───────────────────────────────────────────────────────────────

export class StateValue {
  constructor(tag, data) {
    this.tag = tag;
    this.data = data;
  }
  static newNull() { return new StateValue('null', null); }
  static newArray() { return new StateValue('array', []); }
  static newCell(descriptor) { return new StateValue('cell', descriptor); }

  arrayPush(val) {
    if (this.tag !== 'array') throw new CompactError('StateValue.arrayPush: not an array');
    return new StateValue('array', [...this.data, val]);
  }

  encode() {
    return JSON.stringify({ tag: this.tag, data: this.data });
  }

  static decode(str) {
    try {
      const { tag, data } = JSON.parse(str);
      return new StateValue(tag, data);
    } catch {
      return StateValue.newNull();
    }
  }
}

// ─── ContractState ────────────────────────────────────────────────────────────

export class ContractState {
  constructor() {
    this.data = new ChargedState(StateValue.newArray());
    this._operations = new Map();
  }
  setOperation(name, op) {
    this._operations.set(name, op);
  }
}

// ─── ChargedState ─────────────────────────────────────────────────────────────

export class ChargedState {
  constructor(stateValue) {
    this.state = stateValue instanceof StateValue ? stateValue : StateValue.newArray();
  }
}

// ─── ContractOperation ────────────────────────────────────────────────────────

export class ContractOperation {
  constructor() { this.name = 'ContractOperation'; }
}

// ─── CostModel ────────────────────────────────────────────────────────────────

export class CostModel {
  static initialCostModel() {
    return { gas: 0n, fee: 0n };
  }
}

export function emptyRunningCost() {
  return { gas: 0n, steps: 0 };
}

// ─── QueryContext ─────────────────────────────────────────────────────────────

export class QueryContext {
  constructor(chargedState, contractAddress) {
    this.state = chargedState instanceof ChargedState ? chargedState : new ChargedState(chargedState);
    this.contractAddress = contractAddress;
  }
}

// ─── Circuit Context ──────────────────────────────────────────────────────────

export function dummyContractAddress() {
  return { bytes: new Uint8Array(32) };
}

export function createCircuitContext(contractAddress, coinPublicKey, chargedState, privateState) {
  return {
    currentQueryContext: new QueryContext(
      chargedState instanceof ChargedState ? chargedState : new ChargedState(chargedState),
      contractAddress
    ),
    currentPrivateState: privateState ?? {},
    currentZswapLocalState: { coinPublicKey: coinPublicKey ?? new Uint8Array(32) },
    costModel: CostModel.initialCostModel(),
    gasCost: emptyRunningCost(),
  };
}

// ─── queryLedgerState ─────────────────────────────────────────────────────────
//
// Interprets a mini stack-machine instruction set used by the Compact-compiled
// contract to read and write ledger state cells.
//
// Supported opcodes (subset used by ZkNumberGuesser contract):
//   { push: { storage, value } }   — push a value onto the stack
//   { dup: { n } }                 — duplicate item n positions from top
//   { idx: { path } }              — index into state by path
//   { ins: { n } }                 — insert top item n levels into state
//   { popeq: { result } }          — pop and compare

export function queryLedgerState(context, partialProofData, instructions) {
  const stack = [];
  const state = context?.currentQueryContext?.state?.state ?? StateValue.newArray();

  for (const instr of instructions) {
    if (instr.push) {
      stack.push(instr.push.value);
    } else if (instr.dup) {
      const n = instr.dup.n ?? 0;
      stack.push(stack[stack.length - 1 - n]);
    } else if (instr.idx) {
      // Index into current state — return a cell value
      const path = instr.idx.path ?? [];
      let current = state;
      for (const step of path) {
        if (step.tag === 'value' && current?.data?.state?.data) {
          current = current.data.state.data[0]; // simplified navigation
        }
      }
      stack.push(current);
    } else if (instr.ins) {
      // Mutate the state at depth n — simplified: just pop the value
      const n = instr.ins.n ?? 1;
      for (let i = 0; i < n + 1 && stack.length > 0; i++) stack.pop();
    } else if (instr.popeq) {
      const val = stack.pop();
      if (instr.popeq.result !== undefined) {
        instr.popeq.result = val;
      }
    }
  }

  if (partialProofData) {
    partialProofData.publicTranscript = partialProofData.publicTranscript ?? [];
    partialProofData.publicTranscript.push({ ops: instructions });
  }

  return stack.length > 0 ? stack[stack.length - 1] : state;
}
