import { Contract } from "ethers";
import {
  EXCHANGE_CONTRACT_ABI,
  EXCHANGE_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "../constants";

/*getAmountOfTokensReceivedFromSwap
Returns the number of Eth/Crypto Dev tokens that can be recieved 
when the user swaps _swapAmountWEI amount of Eth/Crypto Dev tokens
*/
export const getAmountOfTokensReceivedFromSwap = async (
  _swapAmountWei,
  provider,
  ethSelected,
  ethBalance,
  reservedCD
) => {
  //new instance of the exchange contract
  const exchangeContract = new Contract(
    EXCHANGE_CONTRACT_ADDRESS,
    EXCHANGE_CONTRACT_ABI,
    provider
  );
  let amountOfTokens;
  /* If ETH is selected our input value is Eth and our input amount is
   _swapAmountWei
   input reserve is the ethBalance of the contract
   output reserveis the  Crypto Dev token reserve*/
  if (ethSelected) {
    amountOfTokens = await exchangeContract.getAmountOfTokens(
      _swapAmountWei,
      ethBalance,
      reservedCD
    );
  } else {
    /* If ETH is not selected input value is Crypto Dev tokens 
    input amount is _swapAmountWei 
    input reserve is the Crypto Dev tokenreserve of the contract 
     output reserve is the ethBalance*/
    amountOfTokens = await exchangeContract.getAmountOfTokens(
      _swapAmountWei,
      reservedCD,
      ethBalance
    );
  }

  return amountOfTokens;
};

/*swapTokens
  Swaps  swapAmountWei of Eth/Crypto Dev tokens with tokenToBeRecievedAfterSwap amount of Eth/Crypto Dev tokens
*/
export const swapTokens = async (
  signer,
  swapAmountWei,
  tokenToBeRecievedAfterSwap,
  ethSelected
) => {
  //new instance of the exchange contract
  const exchangeContract = new Contract(
    EXCHANGE_CONTRACT_ADDRESS,
    EXCHANGE_CONTRACT_ABI,
    signer
  );
  const tokenContract = new Contract(
    TOKEN_CONTRACT_ADDRESS,
    TOKEN_CONTRACT_ABI,
    signer
  );
  let tx;
  /* If Eth is selected call the ethToCryptoDevToken function 
  else call the cryptoDevTokenToEth function contract
  pass the swapAmount as a value to the function
  the ether is paid to the contract (not a value we are passing to the function)*/
  if (ethSelected) {
    tx = await exchangeContract.ethToCryptoDevToken(
      tokenToBeRecievedAfterSwap,
      {
        value: swapAmountWei,
      }
    );
  } else {
    // user approval for  swapAmountWei  the contract is an ERC20
    tx = await tokenContract.approve(
      EXCHANGE_CONTRACT_ADDRESS,
      swapAmountWei.toString()
    );
    await tx.wait();
    /* call cryptoDebTokenToEth function to take in swapAmounWei of tokens 
    and send back tokenToBeRecievedAfterSwap amount of ether to the user*/
    tx = await exchangeContract.cryptoDevTokenToEth(
      swapAmountWei,
      tokenToBeRecievedAfterSwap
    );
  }
  await tx.wait();
};