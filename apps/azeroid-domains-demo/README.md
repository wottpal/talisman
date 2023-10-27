# AZERO.ID Domains Demo

This is a quick & dirty PoC of resolving domains ↔ wallet addresses via AZERO.ID **without** using `@polkadot/api`.

## Run the demo

```
yarn dev
```

## Register your own testnet domain

You can do that over at our [testnet](https://tzero.id) ([docs](https://docs.azero.id/testnet)). This testnet instance is Discord-gated, please head over and join [our Discord](https://discord.com/invite/azero-id), ping me, and I'll assign you a tester role.

## Implementation notes

- I mainly used the `makeContractCaller` helper from `packages/balances-substrate-psp22/src/SubstratePsp22Module.ts` with our own ABIs & deployment addresses ([docs](https://docs.azero.id/developers/deployments)) in the two helper functions [`resolveAddressToDomain`](./src/utils/resolveAddressToDomain.ts) & [`resolveDomainToAddress`](./src/utils/resolveDomainToAddress.ts).

- Though, I've improved the decoding of the call results a bit, and I would recommend you doing this in `SubstratePsp22Module` as well. This just makes decoding ink! errors & return types way more reliable with less boilerplate. I've added useful helpers from [`contracts-ui`](https://github.com/paritytech/contracts-ui). Find them at [`decodeHelpers.ts`](./src/utils/decodeHelpers.ts) and go forward and reuse/refactor them if you like.

- Also, as you don't have access to a fully decorated `api.registry` instance, you'd likely want to use something like `jsonAbi.registry as TypeRegistry` instead of `new TypeRegistry()` as your registry to correctly decode ink! errors.
