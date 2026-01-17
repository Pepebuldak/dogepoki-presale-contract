import { ethers } from "hardhat";

async function main() {
  const [owner] = await ethers.getSigners();
  console.log("[Owner account address]: " + owner.address);

  const presaleAddress = "0x35E9a42D63a08BD22A260DA272Ef930973Ed7a7f";
  const presaleContract = await ethers.getContractAt("Presale", presaleAddress);

  const endTime = 1768658817; // presale end time
  await presaleContract.changeSaleTimes(0, endTime);
  await presaleContract.withdrawRemainingTokens();

  console.log("end Presale");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
