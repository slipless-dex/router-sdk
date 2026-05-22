import { CurrencyAmount, Token } from "@slipless/sdk-core";
import { Pair } from "@slipless/v2-sdk";
import { V3Pool } from "@slipless/v3-sdk";

export type Hop =
  | { kind: "v2"; pair: Pair }
  | { kind: "v3"; pool: V3Pool }
  | { kind: "perp"; market: PerpQuoter };

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
    let current = input;
    for (let i = 0; i < hops.length; i++) {
      current = nextTokenFor(hops[i]!, current);
      path.push(current);
    }
    if (!current.equals(output)) {
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
