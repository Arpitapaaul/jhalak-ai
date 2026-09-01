import { network } from "hardhat";

async function main() {
  const { viem } = await network.connect();

  const contract = await viem.deployContract("FaceVerification");

  console.log("FaceVerification deployed to:");
  console.log(contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});