const ethers = require("ethers");

const LidoABI = require("../abi/LidoABI.json");

// 1. Provider Setup
const provider = new ethers.JsonRpcProvider("https://ethereum-holesky-rpc.publicnode.com");

const nodeOperatorAddedEventABI = LidoABI.filter((abi) => abi.type === "event" && abi.name === "NodeOperatorAdded");

const nodeOperatorAddedInterface = new ethers.Interface(nodeOperatorAddedEventABI);

async function parseNodeOperatorId(txHash) {
  try {
    const transactionReceipt = await provider.getTransactionReceipt(txHash);

    if (!transactionReceipt) {
      console.error("tx hash not found");
      return;
    }

    console.log("transaction receipt:", transactionReceipt);
    parseEventsFromReceipt(transactionReceipt);
  } catch (error) {
    console.error("get transaction receipt error:", error);
  }
}

function parseEventsFromReceipt(transactionReceipt) {
  if (transactionReceipt && transactionReceipt.logs) {
    transactionReceipt.logs.forEach((log) => {
      try {
        // Try to parse the log using the NodeOperatorAdded event interface
        const parsedLog = nodeOperatorAddedInterface.parseLog(log);

        // Check if the parsed event name is "NodeOperatorAdded"
        if (parsedLog && parsedLog.name === "NodeOperatorAdded") {
          console.log("find NodeOperatorAdded event:");
          console.log("event name:", parsedLog.name);
          console.log("full event args:", parsedLog.args);

          // extract nodeOperatorId
          const nodeOperatorId = parsedLog.args.nodeOperatorId;
          console.log("node operator id:", nodeOperatorId.toString()); // Convert to string for display

          // you can handle nodeOperatorId here, for example, store it to a variable or perform other operations
        } else {
          // if the parsing is successful, but not the "NodeOperatorAdded" event, you can ignore or record it
          if (parsedLog) {
            console.log(`parse other event: ${parsedLog.name}, ignore other events except NodeOperatorAdded`);
          }
        }
      } catch (error) {
        // If parsing fails, it may be because the log doesn't match the NodeOperatorAdded event ABI, ignore it
        console.error("parse log error:", error);
      }
    });
  }
}

module.exports = {
  parseNodeOperatorId,
};
