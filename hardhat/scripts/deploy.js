const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });
const { CRYPTO_DEV_TOKEN_CONTRACT_ADDRESS } = require("../constants");

async function main() {
  const cryptoDevTokenAddress = CRYPTO_DEV_TOKEN_CONTRACT_ADDRESS;

/*  ContractFactory in ethers.js is an abstraction used to deploy 
    new Smart contracts 
    
    exchangeContract is a factory for instances of the exchange contract
    */

  const exchangeContract = await ethers.getContractFactory("Exchange");

  // deploy the contract
  const deployedExchangeContract = await exchangeContract.deploy(
    cryptoDevTokenAddress
  );
  await deployedExchangeContract.deployed();

  // print the address of the contract
  console.log("Exchange Contract Address:", deployedExchangeContract.address);
}

// Call the main function and catch any errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });