require("dotenv").config();

// read deposit_data-1731978879.json, it's an array of objects, has 100 objects
// split into 10 files
// each file has 10 objects
// name the files deposit_data-1731978879-1.json, deposit_data-1731978879-2.json, etc.

const depositData = require("./deposit_data.json");
const ethers = require("ethers");

const { PRIVATE_KEY, NODE_OPERATOR_ID, PROVIDER_URL } = process.env;
const nodeOperatorId = +NODE_OPERATOR_ID;
const LidoABI = require("./abi/LidoABI.json");
const AccountingABI = require("./abi/accountingABI.json");

const lidoAddress = "0x4562c3e63c2e586cD1651B958C22F88135aCAd4f";
const accountingAddress = "0xc093e53e8F4b55A223c18A2Da6fA00e60DD5EFE1";

// generate holesky rpc and call function
const provider = new ethers.JsonRpcProvider(PROVIDER_URL);

const lidoContract = new ethers.Contract(lidoAddress, LidoABI, provider);

const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

console.log("🚀 ~ wallet:", wallet.address);

// async function
async function addValidatorKeysETH(depositDataChunk, needAmount) {
  const signer = await wallet.connect(provider);

  // TODO: get node operator id from the network
  const keysCount = depositDataChunk.length;
  const publicKeys = "0x" + depositDataChunk.map((deposit) => deposit.pubkey).join("");
  const signatures = "0x" + depositDataChunk.map((deposit) => deposit.signature).join("");

  console.log("🚀 ~ addValidatorKeysETH running...");

  const tx = await lidoContract.connect(signer).addValidatorKeysETH(nodeOperatorId, keysCount, publicKeys, signatures, {
    value: needAmount,
  });
  // console.log("🚀 ~ addValidatorKeysETH ~ tx:", tx);
  await tx.wait();

  console.log("🚀 ~ addValidatorKeysETH ~ tx: success", tx.hash);
}

async function getRequiredBondForNextKeys(length) {
  const signer = await wallet.connect(provider);
  const accountingContract = new ethers.Contract(accountingAddress, AccountingABI, signer);
  const result = await accountingContract.connect(signer).getRequiredBondForNextKeys(nodeOperatorId, length);
  const ether = ethers.formatEther(result);
  console.log(`🚀 ~ run ${length} keys need ether:`, ether);
  return result;
}

async function main() {
  // const needAmount = await getRequiredBondForNextKeys(10);

  const batchSize = 25;
  for (let i = 0; i < depositData.length; i += batchSize) {
    const depositDataChunk = depositData.slice(i, i + batchSize);

    const needAmount = await getRequiredBondForNextKeys(depositDataChunk.length);

    console.log("🚀 calling addValidatorKeysETH", i, i + batchSize);

    // console.log(depositDataChunk);
    await addValidatorKeysETH(depositDataChunk, needAmount);
    // console.log(depositDataChunk.length);
  }
}

main();
