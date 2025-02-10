# Run node lido-csm-batch-add-validator-key.js (MVP)

1. override `deposit_data.json` to the folder

2. find your `NODE_OPERATOR_ID` in #https://csm.testnet.fi/keys/submit ,check localstorage and find your key

3. set env, and rename `.env.example` to `.env`

```
PRIVATE_KEY=your_private_key_here

# find your key in #https://csm.testnet.fi/keys/submit ,check localstorage and find your key
NODE_OPERATOR_ID=2763

```

3. `pnpm install`

4. `node lido-csm-batch-add-validator-key.js`

# Run node generateDepositData.js

1. pnpm install

2. set env, and rename `.env.example` to `.env`

```
GENERATE_PRIVATE_KEY=your_private_key_here

CLUSTER_NODE_URL=http://127.0.0.1:7777
```

3. node `generateDepositData.js`

4. and you will get json file like `generateDepositData-1737859348838.json`

# Run node registerValidator.js

1. pnpm install

2. edit `registerValidator.js`, and rename your `generateDepositData-1737859348838.json` in `main` function

3. make sure you have enough `DVT` and `ETH` in your wallet, and `node registerValidator.js`
