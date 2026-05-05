/**
 * `MixedRoute` is a chain of hops that may span V2 pairs, V3 pools, and
 * perp markets. Each hop carries enough type information to route to the
 * right `getOutputAmount` implementation at quote time.
 *
 * The discriminated union keeps the API simple at the call-site: callers
 * build a route, ask it for an output, and the protocol-specific quoter
 * is dispatched internally.
 */

import { CurrencyAmount, Token } from "@slipless/sdk-core";
import { Pair } from "@slipless/v2-sdk";
import { V3Pool } from "@slipless/v3-sdk";

export type Hop =
  | { kind: "v2"; pair: Pair }
  | { kind: "v3"; pool: V3Pool }
  | { kind: "perp"; market: PerpQuoter };

/**
 * Adapter exposed by `@slipless/sdk` so router-sdk doesn't depend on it
 * directly; consumers wrap their orderbook in this minimal interface.
 */
export interface PerpQuoter {
  readonly id: string;
  readonly baseAsset: Token;
  readonly quoteAsset: Token;
  quoteExactIn(input: CurrencyAmount<Token>): {
    output: CurrencyAmount<Token>;
    next: PerpQuoter;
  };
}

export class MixedRoute {
  readonly hops: readonly Hop[];
  readonly input: Token;
  readonly output: Token;
  readonly path: readonly Token[];

  constructor(hops: readonly Hop[], input: Token, output: Token) {
    if (hops.length === 0) throw new Error("MixedRoute: empty hops");
    const path: Token[] = [input];
    for (let i = 0; i < hops.length; i++) {
      const cur = path[i]!;
      const hop = hops[i]!;
      const next = nextTokenFor(hop, cur);
      path.push(next);
    }
    if (!path[path.length - 1]!.equals(output)) {
      throw new Error("MixedRoute: terminal token does not match output");
    }
    this.hops = hops;
    this.input = input;
    this.output = output;
    this.path = path;
  }
}

function nextTokenFor(hop: Hop, current: Token): Token {
  switch (hop.kind) {
    case "v2": {
      const p = hop.pair;
      if (p.token0.equals(current)) return p.token1;
      if (p.token1.equals(current)) return p.token0;
      throw new Error("MixedRoute: V2 hop disconnected");
    }
    case "v3": {
      const p = hop.pool;
      if (p.token0.equals(current)) return p.token1;
      if (p.token1.equals(current)) return p.token0;
      throw new Error("MixedRoute: V3 hop disconnected");
    }
    case "perp": {
      const m = hop.market;
      if (m.quoteAsset.equals(current)) return m.baseAsset;
      if (m.baseAsset.equals(current)) return m.quoteAsset;
      throw new Error("MixedRoute: perp hop disconnected");
    }
  }
}
