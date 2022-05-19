import { Contract, utils } from "ethers";
import {
  EXCHANGE_CONTRACT_ABI,
  EXCHANGE_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "../constants";

/* addLiquidity is to add liquidity to the exchange,
 When adding initial liquidity, user decides the ether and CD tokens to add
 to the exchange. If Adding liquidity after the initial liquidity has already been added
 we calculate the crypto dev tokens we can add, 
 given the eth we want to add by keeping the ratios the same
 */
export const addLiquidity = async (
  signer,
  addCDAmountWei,
  addEtherAmountWei
) => {
  try {
    //new instance of the token contract
    const tokenContract = new Contract(
      TOKEN_CONTRACT_ADDRESS,
      TOKEN_CONTRACT_ABI,
      signer
    );
    //new instance of the exchange contract
    const exchangeContract = new Contract(
      EXCHANGE_CONTRACT_ADDRESS,
      EXCHANGE_CONTRACT_ABI,
      signer
    );
    /* CD tokens are an ERC20, user needs to give the contract allowance
     to take the required number tokens out of contract*/
    let tx = await tokenContract.approve(
      EXCHANGE_CONTRACT_ADDRESS,
      addCDAmountWei.toString()
    );
    await tx.wait();
    // After the contract has the approval add the ether and cd tokens in the liquidity
    tx = await exchangeContract.addLiquidity(addCDAmountWei, {
      value: addEtherAmountWei,
    });
    await tx.wait();
  } catch (err) {
    console.error(err);
  }
};

/*
calculateCD calculates the CD tokens that need to be added to the liquidity
 */
export const calculateCD = async (
  _addEther = "0",
  etherBalanceContract,
  cdTokenReserve
) => {
  /* _addEther is a string, we convert it to a Bignumber 
  by using the parseEther function from ethers.js*/
  const _addEtherAmountWei = utils.parseEther(_addEther);
  // Ratio stays the same when we add liquiidty
  const cryptoDevTokenAmount = _addEtherAmountWei
    .mul(cdTokenReserve)
    .div(etherBalanceContract);
  return cryptoDevTokenAmount;
};