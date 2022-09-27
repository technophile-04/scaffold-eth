const { mine } = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
  // instantly mine 1000 blocks
  await mine(1);
  console.log("Block mined");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
