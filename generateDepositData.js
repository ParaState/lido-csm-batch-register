require("dotenv").config();

const { GENERATE_PRIVATE_KEY, CLUSTER_NODE_URL } = process.env;

const winston = require("winston");
const axios = require("axios");
const fs = require("fs");

const GENERATE_KEYS = 0;
const GENERATE_DEPOSIT_DATA = 1;
const GENERATE_EXIT_DATA = 2;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const logger = winston.createLogger({
  level: "info",
  format: winston.format.simple(),
  transports: [new winston.transports.Console(), new winston.transports.File({ filename: "generateDepositData.log" })],
});

const clusterNodeABI = require("./abi/clusterNodeABI.json");
const erc20ABI = require("./abi/erc20ABI.json");
const networkABI = require("./abi/networkABI.json");

const ethers = require("ethers");

const axiosInstance = axios.create({
  timeout: 60 * 1000,
  baseURL: CLUSTER_NODE_URL,
});

const clusterNodeAddress = "0xf0455Aca6B61109098562610e89C7ca22c12Bb43";
const erc20Address = "0x95AC0C8Bba72Be4296195C985F85Df98fD1ef84a";

// // generate holesky rpc and call function
const provider = new ethers.JsonRpcProvider("https://ethereum-holesky-rpc.publicnode.com");

const clusterNodeContract = new ethers.Contract(clusterNodeAddress, clusterNodeABI, provider);

const wallet = new ethers.Wallet(GENERATE_PRIVATE_KEY, provider);

console.log("🚀 ~ wallet:", wallet.address);

const approveCount = 5;
const validatorCount = 5;
const paySubscriptionFee = 59400000000000000n;

async function getActionFee(actionType) {
  const signer = wallet.connect(provider);
  const fee = await clusterNodeContract.connect(signer).getActionFee(actionType);
  console.log("🚀 ~ getActionFee ~ fee:", fee);

  return fee;
}

async function approve(address, amount) {
  const signer = wallet.connect(provider);
  const erc20Contract = new ethers.Contract(erc20Address, erc20ABI, signer);
  const tx = await erc20Contract.connect(signer).approve(address, amount);

  logger.info(`🚀 ~ approve ~ tx: ${tx.hash}`);
  await tx.wait();
}

async function queryValidatorStatus(status, action, txid) {
  const { data } = await axiosInstance.get(`/server/validator/${status}/${action}/${txid}`);

  return data.data;
}

async function getInitiatorStatus() {
  const { data } = await axiosInstance.get(`/server/initiator/status`);

  return data.data;
}

async function generateDepositData(pk, validatorCount, opIds, amount, address) {
  const signer = wallet.connect(provider);

  const tx = await clusterNodeContract.connect(signer).generateDepositData(pk, validatorCount, opIds, amount, address);
  logger.info(`generateDepositData txid: ${tx.hash}`);
  await tx.wait();

  return tx.hash;
}

async function registerValidator(
  validatorPublicKeys,
  validatorOperatorIds,
  validatorSharedKeys,
  validatorEncryptKeys,
  paySubscriptionFee
) {
  const signer = wallet.connect(provider);
  const networkContract = new ethers.Contract(networkAddress, networkABI, signer);
  const tx = await networkContract
    .connect(signer)
    .registerValidator(
      validatorPublicKeys,
      validatorOperatorIds,
      validatorSharedKeys,
      validatorEncryptKeys,
      paySubscriptionFee
    );

  logger.info(`registerValidator txid: ${tx.hash}`);
  await tx.wait();
}

async function main() {
  const result = await getInitiatorStatus();
  logger.info("🚀 ~ main ~ getInitiatorStatus:", result);

  const fee = await getActionFee(GENERATE_DEPOSIT_DATA);

  const totalFee = fee * BigInt(approveCount);

  await approve(clusterNodeAddress, totalFee);

  const txIds = [];

  for (let i = 0; i < Math.floor(approveCount / validatorCount); i++) {
    // for (let i = 0; i < 1; i++) {
    const txid = await generateDepositData(
      result.cluster_pubkey,
      validatorCount,
      [12, 14, 15, 16],
      ethers.parseEther("32"),
      // wallet.address
      "0xF0179dEC45a37423EAD4FaD5fCb136197872EAd9"
    );
    txIds.push(txid);
  }

  const filename = `generateDepositData-${Date.now()}.json`;

  try {
    fs.writeFileSync(filename, JSON.stringify(txIds, null, 2));
    logger.info(`Successfully wrote txIds to ${filename}`);
  } catch (err) {
    logger.error("Error writing txIds to file:", err);
  }

  console.log("success");
  console.log("sleep 10s...");
  await sleep(10 * 1000);

  // await approve(networkAddress, paySubscriptionFee * BigInt(approveCount));

  // for (const txid of txIds) {
  //   const result = await queryValidatorStatus("all", "all", txid);
  //   console.log("🚀 ~ main ~ result:", result);

  //   await registerValidator(result.validator_public_keys, result.validator_operator_ids, result.validator_shared_keys, result.validator_encrypt_keys, paySubscriptionFee);
  // }

  // await approveClusterNode(totalFee);

  // // const needAmount = await getRequiredBondForNextKeys(10);

  // const batchSize = 10;
  // for (let i = 0; i < depositData.length; i += batchSize) {
  //   const depositDataChunk = depositData.slice(i, i + batchSize);

  //   const needAmount = await getRequiredBondForNextKeys(depositDataChunk.length);

  //   console.log("🚀 calling addValidatorKeysETH", i, i + batchSize);

  //   // console.log(depositDataChunk);
  //   await addValidatorKeysETH(depositDataChunk, needAmount);
  //   // console.log(depositDataChunk.length);
  // }
}

main();
