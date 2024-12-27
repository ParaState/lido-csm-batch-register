# run node main.js

1. override `deposit_data.json` to the folder

2. find your `NODE_OPERATOR_ID` in #https://csm.testnet.fi/keys/submit ,check localstorage and find your key

3. set env, and rename `.env.example` to `.env`

```
PRIVATE_KEY=your_private_key_here

# find your key in #https://csm.testnet.fi/keys/submit ,check localstorage and find your key
NODE_OPERATOR_ID=2763

```

3. pnpm install

4. node main.js
