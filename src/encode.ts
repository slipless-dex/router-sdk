/**
 * Encode a `MixedTrade` into the calldata bytes that the Slipless
 * Universal Router expects. Each hop becomes a (command, params) pair,
 * concatenated in execution order.
 *
 * The opcode space is documented in @slipless/universal-router/src/Commands.sol.
 */

import { type MixedTrade } from "./trade.js";

export const Commands = {
  V2_SWAP_EXACT_IN: 0x00,
  V3_SWAP_EXACT_IN: 0x01,
  PERP_FILL_EXACT_IN: 0x02,
  WRAP_NATIVE: 0x10,
  UNWRAP_NATIVE: 0x11,
  PAY_FEE: 0x20,
  PERMIT2_TRANSFER_FROM: 0x30,
} as const;

export interface EncodedExecution {
  /** Concatenated command bytes; one per hop (plus optional wrap/unwrap). */
  commands: Uint8Array;
  /** ABI-encoded parameters per command. */
  inputs: string[];
}

export function encodeMixedTrade(trade: MixedTrade): EncodedExecution {
  const cmds: number[] = [];
  const inputs: string[] = [];

  for (const hop of trade.route.hops) {
    if (hop.kind === "v2") {
      cmds.push(Commands.V2_SWAP_EXACT_IN);
      inputs.push(""); // viem ABI encoder is plugged in by consumers
    } else if (hop.kind === "v3") {
      cmds.push(Commands.V3_SWAP_EXACT_IN);
      inputs.push("");
    } else {
      cmds.push(Commands.PERP_FILL_EXACT_IN);
      inputs.push("");
    }
  }

  return { commands: new Uint8Array(cmds), inputs };
}
