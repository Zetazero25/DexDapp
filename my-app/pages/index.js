import { BigNumber, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import styles from "../styles/Home.module.css";
import { addLiquidity, calculateCD } from "../utils/addLiquidity";
import {
  getCDTokensBalance,
  getEtherBalance,
  getLPTokensBalance,
  getReserveOfCDTokens,
} from "../utils/getAmounts";
import {
  getTokensAfterRemove,
  removeLiquidity,
} from "../utils/removeLiquidity";
import { swapTokens, getAmountOfTokensReceivedFromSwap } from "../utils/swap";

export default function Home() {
  /* General state variables */
  /* loading = true when the transaction is mining 
   loading = false when the transaction is mined*/
  const [loading, setLoading] = useState(false);
  /* two tabs- Liquidity Tab and Swap Tab. This variable keeps track of the tab the user is on
  if Tab = true the user is on Liquidity Tab else user is on Swap Tab*/
  const [liquidityTab, setLiquidityTab] = useState(true);
  // variable is the 0 using BigNumber 
  const zero = BigNumber.from(0);
  /* Variables to keep track of amount:
   ethBalance keeps track of the amount of Eth in the user's account*/
  const [ethBalance, setEtherBalance] = useState(zero);
  // reservedCD keeps track of the tokens Reserve balance of the Exchange contract
  const [reservedCD, setReservedCD] = useState(zero);
  // Keeps track of ether balance in contract
  const [etherBalanceContract, setEtherBalanceContract] = useState(zero);
  // cdBalance is  amount of CD tokens inthe users account
  const [cdBalance, setCDBalance] = useState(zero);
  // lpBalance is amount of LP tokens in the users account
  const [lpBalance, setLPBalance] = useState(zero);
  /*Variables to track liquidity to be added or removed */
  // addEther is amount of Ether that user wants to add to liquidity
  const [addEther, setAddEther] = useState(zero);
  // addCDTokens keeps track of  amount of CD tokens the user wants to add to liquidity
  const [addCDTokens, setAddCDTokens] = useState(zero);
  // removeEther is amount of Ether that is be sent back to user based on number of LP tokens
  const [removeEther, setRemoveEther] = useState(zero);
  /* removeCD is amount of Crypto Dev tokens that is sent back to user 
  based on number of LP tokens that he withdraws*/
  const [removeCD, setRemoveCD] = useState(zero);
  // amount of LP tokens the user wants to remove from liquidity
  const [removeLPTokens, setRemoveLPTokens] = useState("0");
  /* Variables to keep track of swaps */
  // Amount that user wants to swap
  const [swapAmount, setSwapAmount] = useState("");
  // This keeps track of the number of tokens that the user would recieve after a swap completes
  const [tokenToBeRecievedAfterSwap, setTokenToBeRecievedAfterSwap] =
    useState(zero);
  /* Keeps track if Eth or Crypto Dev token is selected 
  if Eth is selected the user wants to swap Eth forCrypto Dev tokens
   vice versa if Eth is not selected*/
  const [ethSelected, setEthSelected] = useState(true);
  //Connect Wallet
  // Use the Web3 Modal for connecting to Metamask
  const web3ModalRef = useRef();
  // walletConnected tracks if  wallet is connected or not
  const [walletConnected, setWalletConnected] = useState(false);

  
   //getAmounts call various functions to retrive amounts for ethbalance/LP tokens
  
  const getAmounts = async () => {
    try {
      const provider = await getProviderOrSigner(false);
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      // get the amount of eth in the user's account
      const _ethBalance = await getEtherBalance(provider, address);
      // get the amount of Crypto Dev tokens held by  user
      const _cdBalance = await getCDTokensBalance(provider, address);
      // get the amount of Crypto Dev LP tokens held by user
      const _lpBalance = await getLPTokensBalance(provider, address);
      // get the amount of CD tokens that are in the reserve of Exchange contract
      const _reservedCD = await getReserveOfCDTokens(provider);
      // Get the ether reserves in contract
      const _ethBalanceContract = await getEtherBalance(provider, null, true);
      setEtherBalance(_ethBalance);
      setCDBalance(_cdBalance);
      setLPBalance(_lpBalance);
      setReservedCD(_reservedCD);
      setReservedCD(_reservedCD);
      setEtherBalanceContract(_ethBalanceContract);
    } catch (err) {
      console.error(err);
    }
  };

  /*
  SWAPITY SWAP 

   _swapTokens
  swaps swapAmountWei of Eth/Crypto Dev tokens with tokenToBeRecievedAfterSwap amount of Eth/Crypto Dev tokens.
*/
  const _swapTokens = async () => {
    try {
      // Convert the amount entered to a BigNumber (use the parseEther library from ethers.js)
      const swapAmountWei = utils.parseEther(swapAmount);
      // Check if user entered zero (use the `eq` method from BigNumber class in ethers.js)
      if (!swapAmountWei.eq(zero)) {
        const signer = await getProviderOrSigner(true);
        setLoading(true);
        // Call swapTokens function from the utils folder
        await swapTokens(
          signer,
          swapAmountWei,
          tokenToBeRecievedAfterSwap,
          ethSelected
        );
        setLoading(false);
        // Get updated amounts after swap
        await getAmounts();
        setSwapAmount("");
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setSwapAmount("");
    }
  };

  /*
    _getAmountOfTokensReceivedFromSwap
  Returns the number of Eth/Crypto Dev tokens that can be recieved 
    when user swaps _swapAmountWEI amount of Eth/Crypto Dev tokens
 */
  const _getAmountOfTokensReceivedFromSwap = async (_swapAmount) => {
    try {
      // Convert the amount entered to a BigNumber (use the parseEther library from ethers.js)
      const _swapAmountWEI = utils.parseEther(_swapAmount.toString());
      /*Check if the user entered zer0  (use the 'eq' method from BigNumber class in ethers.js)*/
      if (!_swapAmountWEI.eq(zero)) {
        const provider = await getProviderOrSigner();
        // Get the amount of ether in contract
        const _ethBalance = await getEtherBalance(provider, null, true);
        // Call `getAmountOfTokensReceivedFromSwap` from utils folder
        const amountOfTokens = await getAmountOfTokensReceivedFromSwap(
          _swapAmountWEI,
          provider,
          ethSelected,
          _ethBalance,
          reservedCD
        );
        setTokenToBeRecievedAfterSwap(amountOfTokens);
      } else {
        setTokenToBeRecievedAfterSwap(zero);
      }
    } catch (err) {
      console.error(err);
    }
  };


  // ADD LIQUIDITY FUNCTIONS

  /* _addLiquidity helps add liquidity to the exchange*/
  
  const _addLiquidity = async () => {
    try {
      // Convert ether amount entered by user to Bignumber
      const addEtherWei = utils.parseEther(addEther.toString());
      // Check if  values are zero
      if (!addCDTokens.eq(zero) && !addEtherWei.eq(zero)) {
        const signer = await getProviderOrSigner(true);
        setLoading(true);
        // call  addLiquidity function from  utils folder
        await addLiquidity(signer, addCDTokens, addEtherWei);
        setLoading(false);
        // Reinitialize  CD tokens
        setAddCDTokens(zero);
        // Get amounts for all values after liquidity has been added
        await getAmounts();
      } else {
        setAddCDTokens(zero);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setAddCDTokens(zero);
    }
  };


  //REMOVE LIQUIDITY FUNCTIONS 

  /**
    _removeLiquidity
    Removes the removeLPTokensWei amount of LP tokens from 
   liquidity and the calculated amount of ether and CD tokens
   */
  const _removeLiquidity = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      // Convert  LP tokens entered by user to a BigNumber
      const removeLPTokensWei = utils.parseEther(removeLPTokens);
      setLoading(true);
      // Call  removeLiquidity function from  utils folder
      await removeLiquidity(signer, removeLPTokensWei);
      setLoading(false);
      await getAmounts();
      setRemoveCD(zero);
      setRemoveEther(zero);
    } catch (err) {
      console.error(err);
      setLoading(false);
      setRemoveCD(zero);
      setRemoveEther(zero);
    }
  };

  /**
    _getTokensAfterRemove 
   Calculates the amount of Ether and CD tokens
   that would be returned back to user after he removes removeLPTokenWei amount
   of LP tokens from contract
   */
  const _getTokensAfterRemove = async (_removeLPTokens) => {
    try {
      const provider = await getProviderOrSigner();
      // Convert the LP tokens entered by the user to a BigNumber
      const removeLPTokenWei = utils.parseEther(_removeLPTokens);
      // Get Eth reserves within exchange contract
      const _ethBalance = await getEtherBalance(provider, null, true);
      // Get crypto dev token reserves from  contract
      const cryptoDevTokenReserve = await getReserveOfCDTokens(provider);
      // Call  getTokensAfterRemove from utils folder
      const { _removeEther, _removeCD } = await getTokensAfterRemove(
        provider,
        removeLPTokenWei,
        _ethBalance,
        cryptoDevTokenReserve
      );
      setRemoveEther(_removeEther);
      setRemoveCD(_removeCD);
    } catch (err) {
      console.error(err);
    }
  };

  

  
      //connectWallet -- Connects the MetaMask wallet

  const connectWallet = async () => {
    try {
      // prompts the user to connect wallet
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

 
   // @param {*} needSigner - True if you need the signer, default false otherwise
  
  const getProviderOrSigner = async (needSigner = false) => {
    // Connect to Metamask
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // If user is not connected to Rinkeby network show error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("Change the network to Rinkeby");
      throw new Error("Change network to Rinkeby");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  //when the value of walletConnected changes - useEffect will be called
  useEffect(() => {
    // if wallet is not connected create instance of Web3Modal and connect MetaMask wallet
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
      getAmounts();
    }
  }, [walletConnected]);

  
      //renderButton -- returns button based on the state of dapp

  const renderButton = () => {
    // If wallet is not connected return a button which allows user to connect wallet
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      );
    }

    // loading button
    if (loading) {
      return <button className={styles.button}>Loading...</button>;
    }

    if (liquidityTab) {
      return (
        <div>
          <div className={styles.description}>
            You have:
            <br />
            {/* Convert the BigNumber to string (use the formatEther function from ethers.js) */}
            {utils.formatEther(cdBalance)} Crypto Dev Tokens
            <br />
            {utils.formatEther(ethBalance)} Ether
            <br />
            {utils.formatEther(lpBalance)} Crypto Dev LP tokens
          </div>
          <div>
            {/* If reserved CD is zero:
            render the state for liquidity zero where we ask user
            how much liquidity he wants to add 
            else render the state where liquidity is not zero and
            calculate based on the Eth amount, how much CD tokens can be added */}
            {utils.parseEther(reservedCD.toString()).eq(zero) ? (
              <div>
                <input
                  type="number"
                  placeholder="Amount of Ether"
                  onChange={(e) => setAddEther(e.target.value || "0")}
                  className={styles.input}
                />
                <input
                  type="number"
                  placeholder="Amount of CryptoDev tokens"
                  onChange={(e) =>
                    setAddCDTokens(
                      BigNumber.from(utils.parseEther(e.target.value || "0"))
                    )
                  }
                  className={styles.input}
                />
                <button className={styles.button1} onClick={_addLiquidity}>
                  Add
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="number"
                  placeholder="Amount of Ether"
                  onChange={async (e) => {
                    setAddEther(e.target.value || "0");
                    /* calculate the number of CD tokens that
                    can be added given  e.target.value amount of Eth*/
                    const _addCDTokens = await calculateCD(
                      e.target.value || "0",
                      etherBalanceContract,
                      reservedCD
                    );
                    setAddCDTokens(_addCDTokens);
                  }}
                  className={styles.input}
                />
                <div className={styles.inputDiv}>
                  {/* Convert BigNumber to string (use the formatEther function from ethers.js )*/}
                  {`You will need ${utils.formatEther(addCDTokens)} Crypto Dev
                  Tokens`}
                </div>
                <button className={styles.button1} onClick={_addLiquidity}>
                  Add
                </button>
              </div>
            )}
            <div>
              <input
                type="number"
                placeholder="Amount of LP Tokens"
                onChange={async (e) => {
                  setRemoveLPTokens(e.target.value || "0");
                  /* Calculate the amount of Ether and CD tokens that the user would recieve
                  after he removes e.target.value amount of LP tokens */
                  await _getTokensAfterRemove(e.target.value || "0");
                }}
                className={styles.input}
              />
              <div className={styles.inputDiv}>
                {/* Convert the BigNumber to string (use the formatEther function from ethers.js) */}
                {`You will get ${utils.formatEther(removeCD)} Crypto
              Dev Tokens and ${utils.formatEther(removeEther)} Eth`}
              </div>
              <button className={styles.button1} onClick={_removeLiquidity}>
                Remove
              </button>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div>
          <input
            type="number"
            placeholder="Amount"
            onChange={async (e) => {
              setSwapAmount(e.target.value || "");
              // Calculate the amount of tokens user would recieve after swap
              await _getAmountOfTokensReceivedFromSwap(e.target.value || "0");
            }}
            className={styles.input}
            value={swapAmount}
          />
          <select
            className={styles.select}
            name="dropdown"
            id="dropdown"
            onChange={async () => {
              setEthSelected(!ethSelected);
              // Initialize values back to zero
              await _getAmountOfTokensReceivedFromSwap(0);
              setSwapAmount("");
            }}
          >
            <option value="eth">Ethereum</option>
            <option value="cryptoDevToken">Crypto Dev Token</option>
          </select>
          <br />
          <div className={styles.inputDiv}>
            {/* Convert BigNumber to string (use the formatEther function from ethers.js) */}
            {ethSelected
              ? `You will get ${utils.formatEther(
                  tokenToBeRecievedAfterSwap
                )} Crypto Dev Tokens`
              : `You will get ${utils.formatEther(
                  tokenToBeRecievedAfterSwap
                )} Eth`}
          </div>
          <button className={styles.button1} onClick={_swapTokens}>
            Swap
          </button>
        </div>
      );
    }
  };

  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="Exchange-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs Portfolio Exchange!</h1>
          <div className={styles.description}>
            Exchange Ethereum &#60;&#62; Crypto Dev Tokens
          </div>
          <div>
            <button
              className={styles.button}
              onClick={() => {
                setLiquidityTab(!liquidityTab);
              }}
            >
              Liquidity
            </button>
            <button
              className={styles.button}
              onClick={() => {
                setLiquidityTab(false);
              }}
            >
              Swap
            </button>
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./cryptodev.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Justice
      </footer>
    </div>
  );
}
