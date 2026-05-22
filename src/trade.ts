import { CurrencyAmount, Percent, Price, TradeType, Token, ZERO } from "@slipless/sdk-core";

import { MixedRoute, type Hop } from "./mixed-route.js";

const ONE = new Percent(1n);
const ZERO_PCT = new Percent(0n);

export class MixedTrade {
  readonly route: MixedRoute;
  readonly tradeType: TradeType;
  readonly inputAmount: CurrencyAmount<Token>;
  readonly outputAmount: CurrencyAmount<Token>;
  readonly executionPrice: Price<Token, Token>;
  readonly priceImpact: Percent;
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
    this.priceImpact = ZERO_PCT;
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
    const result = this.outputAmount.multiply(ONE.subtract(slippage));
    return CurrencyAmount.fromFractionalAmount(
      this.outputAmount.currency,
      result.numerator,
      result.denominator,
    );
  }

  maximumAmountIn(slippage: Percent): CurrencyAmount<Token> {
    if (slippage.lessThan(ZERO)) throw new RangeError("slippage must be non-negative");
    const result = this.inputAmount.multiply(ONE.add(slippage));
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
    case "v2": return hop.pair.getOutputAmount(input, factory, initCodeHash)[0];
    case "v3": return hop.pool.getOutputAmount(input)[0];
    case "perp": return hop.market.quoteExactIn(input).output;
  }
}
