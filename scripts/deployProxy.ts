import { ethers } from "hardhat";
import { IERC20_ABI, deployProxy } from "./common";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("[Deployer account address]: " + deployer.address);

  // Chainlink contract address (ETH/USD), Sepolia
  const priceFeedAddress = process.env.PRICE_FEED_ADDRESS;
  const usdtAddress = process.env.USDT_ADDRESS;
  const saleTokenAddress = process.env.SALE_TOKEN_ADDRESS;
  if (!priceFeedAddress || !saleTokenAddress || !usdtAddress) return;

  // Deploy the Presale contract first to get its address
  const presaleAddress = await deployProxy(
    "Presale",
    [], // Constructor arguments
    [priceFeedAddress, usdtAddress] // Initialize arguments
  );
  console.log(`Presale deployed to: ${presaleAddress}`);

  const presaleContract = await ethers.getContractAt("Presale", presaleAddress);
  // set receiver wallet address and max tokens to buy
  await presaleContract.changePaymentWallet(
    "0xC4689a5772Cd5cb59F282a16847a439e83c5f311"
  );
  await presaleContract.changeMaxTokensToBuy(2000000000000);
  await presaleContract.setDynamicTimeFlag(true);
  await presaleContract.setTimeConstant(ethers.BigNumber.from("432000")); // 5 days
  console.log("Presale initialized");

  // Deploy the StakingManager contract with the presale address
  const rewardTokensPerBlock = ethers.BigNumber.from(
    "10000000000000000000000000"
  ); // 10,000,000 token

  const lockedTime = 259200000; // 100 month seconds
  const endBlock = 32689230; // about 5 years
  const stakingManagerAddress = await deployProxy(
    "stakingManager",
    [], // Constructor arguments
    [
      saleTokenAddress, // ERC20 token
      presaleAddress, // Use the deployed presale contract address
      rewardTokensPerBlock,
      lockedTime,
      endBlock,
    ], // Initialize arguments
    "__stakingManager_init"
  );
  console.log(`StakingManager deployed to: ${stakingManagerAddress}`);

  const stakingContract = await ethers.getContractAt(
    "stakingManager",
    stakingManagerAddress
  );
  await stakingContract.setBoostedRewardMultiplier(3);
  await stakingContract.setTrustedSigner(
    "0xd97603C6771C654DDd9957844CB0040764F1dC97"
  );

  const noOfTokens = ethers.BigNumber.from("120000000000000000000000000000000"); // Provided token amount
  const tokenContract = await ethers.getContractAt(
    IERC20_ABI,
    saleTokenAddress
  );
  await tokenContract.approve(presaleAddress, noOfTokens);
  const currentAllowance = await tokenContract.allowance(
    deployer.address,
    presaleAddress
  );
  console.log(`Current allowance: ${currentAllowance.toString()}`);

  // Start the claim process in the Presale contract
  const startTime = 1744719350;
  const endTime = 1767052800;

  await presaleContract.startClaim(
    startTime,
    endTime,
    noOfTokens, // Number of tokens to add to the contract
    saleTokenAddress, // ERC20 token address
    stakingManagerAddress
  );
  console.log(`Claim process started in Presale contract`);

  const roundStartTime = 1744719962;
  const roundDuration = 432000; // 5 days
  const totalRounds = 40;
  const totalAmount = ethers.BigNumber.from("120000000000000"); // 120 trillion

  const roundsPrice = [];
  const roundsAmount = [];
  const roundsEndTS = [];

  let price = 5000000000; // Initial price($0.000000005)
  const increment = totalAmount.div(totalRounds);
  let amount = increment;
  let amountSum = ethers.BigNumber.from(0);

  for (let i = 0; i < totalRounds; i++) {
    // Add price and amount for this round
    roundsPrice.push(Math.round(price));
    roundsAmount.push(amount);
    roundsEndTS.push(roundStartTime + (i + 1) * roundDuration);

    amountSum = amountSum.add(amount);
    // Increase price by 10% for next round
    price = price * 1.1;
    amount = amount.add(increment);
  }

  await presaleContract.changeRoundsData([
    roundsAmount,
    roundsPrice,
    roundsEndTS,
  ]);

  console.log(`NEXT_PUBLIC_STAKING_MANAGER_CONTRACT=${stakingManagerAddress}`);
  console.log(`NEXT_PUBLIC_PRESALE_CONTRACT=${presaleAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
