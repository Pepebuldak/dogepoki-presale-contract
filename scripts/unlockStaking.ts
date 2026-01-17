import { ethers } from "hardhat";

async function main() {
  const [owner] = await ethers.getSigners();
  console.log("[Owner account address]: " + owner.address);

  const stakingManagerAddress = "0xfE8cE2053c5cb667Bb472635BfF3Cf8869060b93";
  const stakingManagerContract = await ethers.getContractAt(
    "stakingManager",
    stakingManagerAddress
  );
  await stakingManagerContract.setLockedTime(60); // 1min
  await stakingManagerContract.setBoostedRewardMultiplier(3);
  await stakingManagerContract.setHarvestLock(false);

  console.log("Staking manager unlocked");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
