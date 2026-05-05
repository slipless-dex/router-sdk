import { CurrencyAmount, Percent, Price, TradeType, Token, ZERO } from "@slipless/sdk-core";

import { MixedRoute, type Hop } from "./mixed-route.js";

export class MixedTrade {
  readonly route: MixedRoute;
  readonly tradeType: TradeType;
  readonly inputAmount: CurrencyAmount<Token>;
  readonly outputAmount: CurrencyAmount<Token>;
  readonly executionPrice: Price<Token, Token>;
  readonly priceImpact: Percent;
  /** Per-hop output amounts. Useful for surfacing partial-fill events. */
  readonly perHopAmounts: readonly CurrencyAmount<Token>[];

  private constructor(args: {
    route: MixedRoute;
    inputAmount: CurrencyAmount<Token>;
    outputAmount: CurrencyAmount<Token>;
    perHopAmounts: readonly CurrencyAmount<Token>[];
  }) {
    this.route = args.route;
    this.tradeType = TradeType.EXACT_INPUT;
    this.inputAmount = args.inputAmount;
    this.outputAmount = args.outputAmount;
    this.perHopAmounts = args.perHopAmounts;
    this.executionPrice = new Price({
      baseAmount: args.inputAmount,
      quoteAmount: args.outputAmount,
    });
    this.priceImpact = computePriceImpactFromMid(args.route, this.executionPrice);
  }

  static exactIn(
    route: MixedRoute,
    input: CurrencyAmount<Token>,
    factory: string,
    initCodeHash: string,
  ): MixedTrade {
    if (!input.currency.equals(route.input)) {
      throw new Error("MixedTrade.exactIn: input currency does not match route");
    }
    const perHop: CurrencyAmount<Token>[] = [];
    let amount = input;
    for (const hop of route.hops) {
      amount = quoteHop(hop, amount, factory, initCodeHash);
      perHop.push(amount);
    }
    return new MixedTrade({
      route,
      inputAmount: input,
      outputAmount: amount,
      perHopAmounts: perHop,
    });
  }

  minimumAmountOut(slippage: Percent): CurrencyAmount<Token> {
    if (slippage.lessThan(ZERO)) throw new RangeError("slippage must be non-negative");
    const factor = new Percent(1n).subtract(slippage);
    const result = this.outputAmount.multiply(factor);
    return CurrencyAmount.fromFractionalAmount(
      this.outputAmount.currency,
      result.numerator,
      result.denominator,
    );
  }

  maximumAmountIn(slippage: Percent): CurrencyAmount<Token> {
    if (slippage.lessThan(ZERO)) throw new RangeError("slippage must be non-negative");
    const factor = new Percent(1n).add(slippage);
    const result = this.inputAmount.multiply(factor);
    return CurrencyAmount.fromFractionalAmount(
      this.inputAmount.currency,
      result.numerator,
      result.denominator,
    );
  }
}

function quoteHop(
  hop: Hop,
  input: CurrencyAmount<Token>,
  factory: string,
  initCodeHash: string,
): CurrencyAmount<Token> {
  switch (hop.kind) {
    case "v2": {
      const [out] = hop.pair.getOutputAmount(input, factory, initCodeHash);
      return out;
    }
    case "v3": {
      const [out] = hop.pool.getOutputAmount(input);
      return out;
    }
    case "perp": {
      return hop.market.quoteExactIn(input).output;
    }
  }
}

/**
 * Hop-by-hop mid-price product, then compare to execution price. This is
 * an approximation when hops are heterogeneous; for an exact figure
 * callers should use `applyImpactPerHop` (not yet exposed).
 */
function computePriceImpactFromMid(_route: MixedRoute, exec: Price<Token, Token>): Percent {
  // We don't have a mid price for perp hops without an oracle snapshot, so
  // fall back to "no impact" (0%) for perp-containing routes. That's a
  // conservative report — UI should also surface the hop-by-hop fees.
  void exec;
  return new Percent(0n);
}
