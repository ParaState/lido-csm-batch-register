require("dotenv").config();

const { GENERATE_PRIVATE_KEY, CLUSTER_NODE_URL, PROVIDER_URL } = process.env;

const winston = require("winston");
const axios = require("axios");
const fs = require("fs");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const logger = winston.createLogger({
  level: "info",
  format: winston.format.simple(),
  transports: [new winston.transports.Console(), new winston.transports.File({ filename: "registerValidator.log" })],
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
const networkAddress = "0x34637C3bE556BD8fD6A6a741669a501B79A79e3B";

// // generate holesky rpc and call function
const provider = new ethers.JsonRpcProvider(PROVIDER_URL);

const clusterNodeContract = new ethers.Contract(clusterNodeAddress, clusterNodeABI, provider);

const wallet = new ethers.Wallet(GENERATE_PRIVATE_KEY, provider);

console.log("🚀 ~ wallet:", wallet.address);

const approveCount = 5;
const validatorCount = 5;
const minFee = 59400000000000000n;
const paySubscriptionFee = minFee * 10n;

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
    .batchRegisterValidator(
      validatorPublicKeys,
      validatorOperatorIds,
      validatorSharedKeys,
      validatorEncryptKeys,
      validatorPublicKeys.length,
      paySubscriptionFee
    );

  logger.info(`registerValidator txid: ${tx.hash}`);
  await tx.wait(2); // Wait for 2 block confirmations
}

function sort_and_make_operator_detail(operators) {
  operators = operators.sort((o1, o2) => {
    return o1.operator_id - o2.operator_id;
  });

  const validatorOperatorIds = operators.map((operator) => BigInt(operator.operator_id));
  const validatorSharedKeys = operators.map((operator) => operator.shared_key);
  const validatorEncryptKeys = operators.map((operator) => operator.encrypt_key);

  return {
    validatorOperatorIds,
    validatorSharedKeys,
    validatorEncryptKeys,
  };
}

async function main() {
  const filename = "generateDepositData-1737947094619.json";
  const txIds = JSON.parse(fs.readFileSync(filename, "utf8"));

  logger.info(`txIds.length: ${txIds.length}`);

  await approve(networkAddress, paySubscriptionFee * BigInt(approveCount));

  const result = await queryValidatorStatus("all", "all", txIds[0]);

  logger.info("queryValidatorStatus");

  // const validators = []

  const pubkeys = [];
  let operatorIds = [];
  const sharesPublicKeys = [];
  const sharesEncrypteds = [];
  const deposit_datas = [];

  for (const validator of result) {
    const { pubkey, operators, deposit_data } = validator;

    const { validatorOperatorIds, validatorSharedKeys, validatorEncryptKeys } =
      sort_and_make_operator_detail(operators);

    // console.log(`----------------------------------------- ${validator.pubkey}`)
    // const validatorPublicKeys = validator.pubkey;
    // const validatorOperatorIds = validator.operators.map((operator) => BigInt(operator.operator_id));
    // const validatorSharedKeys = validator.operators.map((operator) => operator.shared_key);
    // const validatorEncryptKeys = validator.operators.map((operator) => operator.encrypt_key);

    // console.log( `pubkeys: `,validator.pubkey )
    // console.log( `operator ids: `, validator.operators.map((operator) => BigInt(operator.operator_id)))
    // console.log( `share keys: `, validator.operators.map((operator) => operator.shared_key))

    // await registerValidator(
    //   validatorPublicKeys,
    //   validatorOperatorIds,
    //   validatorSharedKeys,
    //   validatorEncryptKeys,
    //   paySubscriptionFee
    // );
    // console.log( pubkey, validatorOperatorIds, validatorSharedKeys, validatorEncryptKeys, paySubscriptionFee )

    pubkeys.push(pubkey);
    operatorIds = validatorOperatorIds;
    sharesPublicKeys.push(validatorSharedKeys);
    sharesEncrypteds.push(validatorEncryptKeys);

    deposit_datas.push(JSON.parse(deposit_data));
    // validators.push({
    //   pubkey,
    //   validatorOperatorIds,
    //   validatorSharedKeys,
    //   validatorEncryptKeys,
    // })
    // console.log(`-----------------------------------------`)
    // await sleep(2000);
  }

  // console.log(
  //     pubkeys,
  //     operatorIds,
  //     sharesPublicKeys,
  //     sharesEncrypteds,
  //     paySubscriptionFee
  //   )

  await registerValidator(pubkeys, operatorIds, sharesPublicKeys, sharesEncrypteds, paySubscriptionFee);

  console.log(JSON.stringify(deposit_datas));

  // for (const txid of txIds) {
  //   const validator = result.find((item) => item.generate_txid === txid);
  //   // console.log("🚀 ~ main ~ validator:", validator);

  //   const validatorPublicKeys = validator.pubkey;
  //   const validatorOperatorIds = validator.operators.map((operator) => BigInt(operator.operator_id));
  //   const validatorSharedKeys = validator.operators.map((operator) => operator.shared_key);
  //   const validatorEncryptKeys = validator.operators.map((operator) => operator.encrypt_key);
  //   // logger.info(`registerValidator ${txid}`);
  //   // logger.info(`validatorPublicKeys: ${validatorPublicKeys}`);
  //   // logger.info(`validatorOperatorIds: ${validatorOperatorIds}`);
  //   // logger.info(`validatorSharedKeys: ${validatorSharedKeys}`);
  //   // logger.info(`validatorEncryptKeys: ${validatorEncryptKeys}`);

  //   console.log( `pubkeys: `,validatorPublicKeys )
  //   console.log( `operator ids: `, validatorOperatorIds)
  //   console.log( `share keys: `, validatorSharedKeys)

  //   // await registerValidator(
  //   //   validatorPublicKeys,
  //   //   validatorOperatorIds,
  //   //   validatorSharedKeys,
  //   //   validatorEncryptKeys,
  //   //   paySubscriptionFee
  //   // );

  //   logger.info(`registerValidator ${txid} end`);
  // }

  console.log("success");
}

main();
