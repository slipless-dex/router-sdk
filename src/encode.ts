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
  commands: Uint8Array;
  inputs: string[];
}

export function encodeMixedTrade(trade: MixedTrade): EncodedExecution {
  const hops = trade.route.hops;
  const commands = new Uint8Array(hops.length);
  const inputs: string[] = new Array(hops.length);

  for (let i = 0; i < hops.length; i++) {
    const hop = hops[i]!;
    switch (hop.kind) {
      case "v2": commands[i] = Commands.V2_SWAP_EXACT_IN; break;
      case "v3": commands[i] = Commands.V3_SWAP_EXACT_IN; break;
      case "perp": commands[i] = Commands.PERP_FILL_EXACT_IN; break;
    }
    inputs[i] = "";
  }

  return { commands, inputs };
}
