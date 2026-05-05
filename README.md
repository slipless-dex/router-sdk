<div align="center">
  <a href="https://slipless.xyz">
    <img src=".github/logo.svg" width="140" alt="Slipless" />
  </a>
</div>

<h1 align="center">@slipless/router-sdk</h1>

<p align="center"><strong>Mixed routes across V2, V3, and perp markets. Encodes for the Universal Router.</strong></p>

<p align="center">
  <a href="https://github.com/slipless-dex/router-sdk/actions"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/slipless-dex/router-sdk/ci.yml?branch=main&style=flat-square&color=5cd8ff&label=ci"></a>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-ff6bdb?style=flat-square"></a>
  <a href="https://www.npmjs.com/package/@slipless/router-sdk"><img alt="npm" src="https://img.shields.io/npm/v/@slipless/router-sdk?style=flat-square&color=b965ff&label=npm"></a>
</p>

<p align="center">
  <a href="https://slipless.xyz">Site</a> &middot;
  <a href="https://app.slipless.xyz">App</a> &middot;
  <a href="https://docs.slipless.xyz">Docs</a> &middot;
  <a href="https://twitter.com/slipless">Twitter</a>
</p>

---

Compose `@slipless/v2-sdk` pairs, `@slipless/v3-sdk` pools, and Slipless perp markets into a single `MixedTrade`. Encodes the result for the Universal Router.

```ts
import { MixedRoute, MixedTrade, Commands, encodeMixedTrade } from "@slipless/router-sdk";

const route = new MixedRoute(
  [
    { kind: "v2", pair: usdcWeth },
    { kind: "v3", pool: wethDai },
    { kind: "perp", market: ethPerp },
  ],
  USDC,
  ETH_PERP_BASE,
);

const trade = MixedTrade.exactIn(route, CurrencyAmount.fromRawAmount(USDC, 1_000_000_000n), factory, initCodeHash);
console.log(trade.outputAmount.toExact());
console.log(trade.minimumAmountOut(new Percent(50, 10_000)).toExact());

const encoded = encodeMixedTrade(trade);
// Pass `encoded.commands` and `encoded.inputs` into UniversalRouter.execute(...)
```

## License

MIT © Slipless Labs
