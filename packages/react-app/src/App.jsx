import { Button, Col, Menu, Row, Spin } from "antd";
import useTokenPagination from "token-pagination-hooks";
import "antd/dist/antd.css";
import {
  useBalance,
  useContractLoader,
  useContractReader,
  useGasPrice,
  useOnBlock,
  useUserProviderAndSigner,
} from "eth-hooks";
import { useExchangeEthPrice } from "eth-hooks/dapps/dex";
import React, { useCallback, useEffect, useState } from "react";
import { Link, Route, Switch, useLocation } from "react-router-dom";
import "./App.css";
import {
  Account,
  Contract,
  Faucet,
  GasGauge,
  Header,
  Ramp,
  ThemeSwitch,
  NetworkDisplay,
  FaucetHint,
  NetworkSwitch,
} from "./components";
import { NETWORKS, ALCHEMY_KEY } from "./constants";
import externalContracts from "./contracts/external_contracts";
// contracts
import deployedContracts from "./contracts/hardhat_contracts.json";
import { Transactor, Web3ModalSetup } from "./helpers";
import { Home, ExampleUI, Hints, Subgraph } from "./views";
import { useStaticJsonRPC } from "./hooks";
import { NFTsMinted } from "./components/NFTsMinted";
import { fetchCLBNFTs, fetchELBNFTs } from "./utils";

const { ethers } = require("ethers");
/*
    Welcome to 🏗 scaffold-eth !

    Code:
    https://github.com/scaffold-eth/scaffold-eth

    Support:
    https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA
    or DM @austingriffith on twitter or telegram

    You should get your own Alchemy.com & Infura.io ID and put it in `constants.js`
    (this is your connection to the main Ethereum network for ENS etc.)


    🌏 EXTERNAL CONTRACTS:
    You can also bring in contract artifacts in `constants.js`
    (and then use the `useExternalContractLoader()` hook!)
*/

/// 📡 What chain are your contracts deployed to?
const initialNetwork = NETWORKS.optimism; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)

// 😬 Sorry for all the console logging
const DEBUG = true;
const NETWORKCHECK = true;
const USE_BURNER_WALLET = true; // toggle burner wallet feature
const USE_NETWORK_SELECTOR = false;

const web3Modal = Web3ModalSetup();

// 🛰 providers
const providers = [
  "https://eth-mainnet.gateway.pokt.network/v1/lb/611156b4a585a20035148406",
  `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`,
  "https://rpc.scaffoldeth.io:48544",
];

function App(props) {
  // specify all the chains your app is available on. Eg: ['localhost', 'mainnet', ...otherNetworks ]
  // reference './constants.js' for other networks
  const networkOptions = [initialNetwork.name, "mainnet", "rinkeby"];
  const [clbData, setClbData] = useState(null);
  const [elbData, setElbData] = useState(null);

  const [elbLoading, setElbLoading] = useState(false);
  const [clbLoading, setClbLoading] = useState(false);

  const {
    updateToken: updateELBNextPageToken,
    currentToken: currentELBPageToken,
    changePageNumber: changeELBPageNumber,
    pageNumber: elbPageNumber,
  } = useTokenPagination({
    defaultPageNumber: 1,
    defaultPageSize: 6,
  });

  const {
    updateToken: updateCLBNextPageToken,
    currentToken: currentCLBPageToken,
    changePageNumber: changeCLBPageNumber,
    pageNumber: clbPageNumber,
  } = useTokenPagination({
    defaultPageNumber: 1,
    defaultPageSize: 6,
  });

  const [injectedProvider, setInjectedProvider] = useState();
  const [address, setAddress] = useState();
  const [selectedNetwork, setSelectedNetwork] = useState(networkOptions[0]);
  const location = useLocation();

  const targetNetwork = NETWORKS[selectedNetwork];

  // 🔭 block explorer URL
  const blockExplorer = targetNetwork.blockExplorer;

  // load all your providers
  const localProvider = useStaticJsonRPC([
    process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : targetNetwork.rpcUrl,
  ]);
  const mainnetProvider = useStaticJsonRPC(providers);

  if (DEBUG) console.log(`Using ${selectedNetwork} network`);

  // 🛰 providers
  if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");

  const logoutOfWeb3Modal = async () => {
    await web3Modal.clearCachedProvider();
    if (injectedProvider && injectedProvider.provider && typeof injectedProvider.provider.disconnect == "function") {
      await injectedProvider.provider.disconnect();
    }
    setTimeout(() => {
      window.location.reload();
    }, 1);
  };

  /* 💵 This hook will get the price of ETH from 🦄 Uniswap: */
  const price = useExchangeEthPrice(targetNetwork, mainnetProvider);

  /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice(targetNetwork, "fast");
  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userProviderAndSigner = useUserProviderAndSigner(injectedProvider, localProvider, USE_BURNER_WALLET);
  const userSigner = userProviderAndSigner.signer;

  useEffect(() => {
    async function getAddress() {
      if (userSigner) {
        const newAddress = await userSigner.getAddress();
        setAddress(newAddress);
      }
    }
    getAddress();
  }, [userSigner]);

  // You can warn the user if you would like them to be on a specific network
  const localChainId = localProvider && localProvider._network && localProvider._network.chainId;
  const selectedChainId =
    userSigner && userSigner.provider && userSigner.provider._network && userSigner.provider._network.chainId;

  // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks

  // The transactor wraps transactions and provides notificiations
  const tx = Transactor(userSigner, gasPrice);

  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
  const yourLocalBalance = useBalance(localProvider, address);

  // Just plug in different 🛰 providers to get your balance on different chains:
  const yourMainnetBalance = useBalance(mainnetProvider, address);

  // const contractConfig = useContractConfig();

  const contractConfig = { deployedContracts: deployedContracts || {}, externalContracts: externalContracts || {} };

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider, contractConfig);

  // If you want to make 🔐 write transactions to your contracts, use the userSigner:
  const writeContracts = useContractLoader(userSigner, contractConfig, localChainId);

  // EXTERNAL CONTRACT EXAMPLE:
  //
  // If you want to bring in the mainnet DAI contract it would look like:
  const mainnetContracts = useContractLoader(mainnetProvider, contractConfig);

  // If you want to call a function on a new block
  useOnBlock(mainnetProvider, () => {
    console.log(`⛓ A new mainnet block is here: ${mainnetProvider._lastBlockNumber}`);
  });

  // Then read your DAI balance like:
  const myMainnetDAIBalance = useContractReader(mainnetContracts, "DAI", "balanceOf", [
    "0x34aA3F359A9D614239015126635CE7732c18fDF3",
  ]);

  // keep track of a variable from the contract in the local React state:
  const purpose = useContractReader(readContracts, "YourContract", "purpose");

  /*
  const addressFromENS = useResolveName(mainnetProvider, "austingriffith.eth");
  console.log("🏷 Resolved austingriffith.eth as:",addressFromENS)
  */

  //
  // 🧫 DEBUG 👨🏻‍🔬
  //
  useEffect(() => {
    if (
      DEBUG &&
      mainnetProvider &&
      address &&
      selectedChainId &&
      yourLocalBalance &&
      yourMainnetBalance &&
      readContracts &&
      writeContracts &&
      mainnetContracts
    ) {
      console.log("_____________________________________ 🏗 scaffold-eth _____________________________________");
      console.log("🌎 mainnetProvider", mainnetProvider);
      console.log("🏠 localChainId", localChainId);
      console.log("👩‍💼 selected address:", address);
      console.log("🕵🏻‍♂️ selectedChainId:", selectedChainId);
      console.log("💵 yourLocalBalance", yourLocalBalance ? ethers.utils.formatEther(yourLocalBalance) : "...");
      console.log("💵 yourMainnetBalance", yourMainnetBalance ? ethers.utils.formatEther(yourMainnetBalance) : "...");
      console.log("📝 readContracts", readContracts);
      console.log("🌍 DAI contract on mainnet:", mainnetContracts);
      console.log("💵 yourMainnetDAIBalance", myMainnetDAIBalance);
      console.log("🔐 writeContracts", writeContracts);
    }
  }, [
    mainnetProvider,
    address,
    selectedChainId,
    yourLocalBalance,
    yourMainnetBalance,
    readContracts,
    writeContracts,
    mainnetContracts,
    localChainId,
    myMainnetDAIBalance,
  ]);

  const loadWeb3Modal = useCallback(async () => {
    const provider = await web3Modal.connect();
    setInjectedProvider(new ethers.providers.Web3Provider(provider));

    provider.on("chainChanged", chainId => {
      console.log(`chain changed to ${chainId}! updating providers`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    provider.on("accountsChanged", () => {
      console.log(`account changed!`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    // Subscribe to session disconnection
    provider.on("disconnect", (code, reason) => {
      console.log(code, reason);
      logoutOfWeb3Modal();
    });
    // eslint-disable-next-line
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  const faucetAvailable = localProvider && localProvider.connection && targetNetwork.name.indexOf("local") !== -1;

  const usersELBNFTsElement = elbData && (
    <NFTsMinted data={elbData} setPageNumber={changeELBPageNumber} pageNumber={elbPageNumber} loading={elbLoading} />
  );

  const usersCLBNFTsElement = clbData && (
    <NFTsMinted data={clbData} setPageNumber={changeCLBPageNumber} pageNumber={clbPageNumber} loading={clbLoading} />
  );

  useEffect(() => {
    if (address) {
      (async () => {
        setClbLoading(true);
        console.log("currentCLBPageToken:", currentCLBPageToken);
        let clbDataRes = await fetchCLBNFTs(address, currentCLBPageToken, 6);
        console.log("pageKey", clbDataRes.pageKey);
        updateCLBNextPageToken(clbDataRes.pageKey);
        setClbData(clbDataRes);
        console.log("called me");
        console.log(`CLB DATA`, clbDataRes);
        setClbLoading(false);
      })();
    }
  }, [address, currentCLBPageToken, updateCLBNextPageToken]);

  useEffect(() => {
    if (address) {
      (async () => {
        setElbLoading(true);
        console.log("currentELBPageToken:", currentELBPageToken);
        let elbDataRes = await fetchELBNFTs(address, currentELBPageToken, 6);
        console.log("pageKey", elbDataRes.pageKey);
        updateELBNextPageToken(elbDataRes.pageKey);
        setElbData(elbDataRes);
        console.log("called me");
        console.log(`ELB DATA`, elbDataRes);
        setElbLoading(false);
      })();
    }
  }, [address, currentELBPageToken, updateELBNextPageToken]);

  return (
    <div className="App">
      {/* ✏️ Edit the header and change the title to your project name */}
      <Header>
        {/* 👨‍💼 Your account is in the top right with a wallet at connect options */}
        <div style={{ position: "relative", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", flex: 1 }}>
            {USE_NETWORK_SELECTOR && (
              <div style={{ marginRight: 20 }}>
                <NetworkSwitch
                  networkOptions={networkOptions}
                  selectedNetwork={selectedNetwork}
                  setSelectedNetwork={setSelectedNetwork}
                />
              </div>
            )}
            <Account
              useBurner={USE_BURNER_WALLET}
              address={address}
              localProvider={localProvider}
              userSigner={userSigner}
              mainnetProvider={mainnetProvider}
              price={price}
              web3Modal={web3Modal}
              loadWeb3Modal={loadWeb3Modal}
              logoutOfWeb3Modal={logoutOfWeb3Modal}
              blockExplorer={blockExplorer}
            />
          </div>
        </div>
      </Header>
      {yourLocalBalance.lte(ethers.BigNumber.from("0")) && (
        <FaucetHint localProvider={localProvider} targetNetwork={targetNetwork} address={address} />
      )}
      <NetworkDisplay
        NETWORKCHECK={NETWORKCHECK}
        localChainId={localChainId}
        selectedChainId={selectedChainId}
        targetNetwork={targetNetwork}
        logoutOfWeb3Modal={logoutOfWeb3Modal}
        USE_NETWORK_SELECTOR={USE_NETWORK_SELECTOR}
      />

      <Switch>
        <Route exact path="/">
          <div>
            <h1>
              🐼 Mint{" "}
              <a
                href="https://twitter.com/AlexPartyPanda/status/1569980247629770753?s=20&t=EWjxHwWJb4NQ3c9HDkWDwg"
                target="_blank"
                rel="noreferrer"
              >
                bears
              </a>{" "}
              in batches to support the{" "}
              <a href="https://buidlguidl.com" target="_blank" rel="noreferrer">
                BuidlGuidl
              </a>{" "}
              &&{" "}
              <a
                href="https://stateful.mirror.xyz/mEDvFXGCKdDhR-N320KRtsq60Y2OPk8rHcHBCFVryXY"
                target="_blank"
                rel="noreferrer"
              >
                Protocol Guild
              </a>{" "}
              at the same time!!!
            </h1>

            <hr style={{ margin: 64 }} />

            <h2 style={{ margin: 32 }}>🐻‍❄️ Consensus Layer Bears</h2>
            <h3>
              <a href="https://qx.app/collection/consensus-layer-bears" target="_blank" rel="noreferrer">
                (view on quixotic)
              </a>
            </h3>
          </div>
          <Button
            onClick={async () => {
              let price = ethers.utils.parseEther("0.00042");
              console.log("price", price);
              let result = await tx(
                writeContracts.YourContract.mint("0xfb3999711d4f309F6B71504268F79b3fD578DA6F", 1, {
                  value: price.mul(2),
                }),
              );
              changeCLBPageNumber(1);
              console.log("result", result);
            }}
          >
            Mint 1
          </Button>

          <Button
            onClick={async () => {
              let price = ethers.utils.parseEther("0.00042");
              console.log("price", price);
              let result = await tx(
                writeContracts.YourContract.mint("0xfb3999711d4f309F6B71504268F79b3fD578DA6F", 2, {
                  value: price.mul(3),
                }),
              );
              changeCLBPageNumber(1);
              console.log("result", result);
            }}
          >
            Mint 2
          </Button>

          <Button
            onClick={async () => {
              let price = ethers.utils.parseEther("0.00042");
              console.log("price", price);
              let result = await tx(
                writeContracts.YourContract.mint("0xfb3999711d4f309F6B71504268F79b3fD578DA6F", 3, {
                  value: price.mul(4),
                }),
              );
              changeCLBPageNumber(1);
              console.log("result", result);
            }}
          >
            Mint 3
          </Button>

          <Button
            onClick={async () => {
              let price = ethers.utils.parseEther("0.00042");
              console.log("price", price);
              let result = await tx(
                writeContracts.YourContract.mint("0xfb3999711d4f309F6B71504268F79b3fD578DA6F", 5, {
                  value: price.mul(6),
                }),
              );
              changeCLBPageNumber(1);
              console.log("result", result);
            }}
          >
            Mint 5
          </Button>

          <Button
            onClick={async () => {
              let price = ethers.utils.parseEther("0.00042");
              console.log("price", price);
              let result = await tx(
                writeContracts.YourContract.mint("0xfb3999711d4f309F6B71504268F79b3fD578DA6F", 10, {
                  value: price.mul(11),
                }),
              );
              changeCLBPageNumber(1);
              console.log("result", result);
            }}
          >
            Mint 10
          </Button>
          {usersCLBNFTsElement}
          {!clbData && (
            <div style={{ marginTop: "4rem" }}>
              <Spin size="large" />
            </div>
          )}

          <hr style={{ margin: 64 }} />

          <div>
            <h2 style={{ margin: 32 }}>🐻 Execution Layer Bears</h2>
            <h3>
              <a href="https://qx.app/collection/execution-layer-bears" target="_blank" rel="noreferrer">
                (view on quixotic)
              </a>
            </h3>
          </div>

          <Button
            onClick={async () => {
              let price = ethers.utils.parseEther("0.00042");
              console.log("price", price);
              let result = await tx(
                writeContracts.YourContract.mint("0x22Cd0e2680f4B9aE140E3b9AbFA3463532e290Ff", 1, {
                  value: price.mul(2),
                }),
              );
              changeELBPageNumber(1);
              console.log("result", result);
            }}
          >
            Mint 1
          </Button>

          <Button
            onClick={async () => {
              let price = ethers.utils.parseEther("0.00042");
              console.log("price", price);
              let result = await tx(
                writeContracts.YourContract.mint("0x22Cd0e2680f4B9aE140E3b9AbFA3463532e290Ff", 2, {
                  value: price.mul(3),
                }),
              );
              changeELBPageNumber(1);
              console.log("result", result);
            }}
          >
            Mint 2
          </Button>

          <Button
            onClick={async () => {
              let price = ethers.utils.parseEther("0.00042");
              console.log("price", price);
              let result = await tx(
                writeContracts.YourContract.mint("0x22Cd0e2680f4B9aE140E3b9AbFA3463532e290Ff", 3, {
                  value: price.mul(4),
                }),
              );
              changeELBPageNumber(1);
              console.log("result", result);
            }}
          >
            Mint 3
          </Button>

          <Button
            onClick={async () => {
              let price = ethers.utils.parseEther("0.00042");
              console.log("price", price);
              let result = await tx(
                writeContracts.YourContract.mint("0x22Cd0e2680f4B9aE140E3b9AbFA3463532e290Ff", 5, {
                  value: price.mul(6),
                }),
              );
              changeELBPageNumber(1);
              console.log("result", result);
            }}
          >
            Mint 5
          </Button>

          <Button
            onClick={async () => {
              let price = ethers.utils.parseEther("0.00042");
              console.log("price", price);
              let result = await tx(
                writeContracts.YourContract.mint("0x22Cd0e2680f4B9aE140E3b9AbFA3463532e290Ff", 10, {
                  value: price.mul(11),
                }),
              );
              changeELBPageNumber(1);
              console.log("result", result);
            }}
          >
            Mint 10
          </Button>
          {usersELBNFTsElement}
          {!elbData && (
            <div style={{ marginTop: "4rem" }}>
              <Spin size="large" />
            </div>
          )}
        </Route>
        <Route exact path="/debug">
          {/*
                🎛 this scaffolding is full of commonly used components
                this <Contract/> component will automatically parse your ABI
                and give you a form to interact with it locally
            */}

          <Contract
            name="YourContract"
            price={price}
            signer={userSigner}
            provider={localProvider}
            address={address}
            blockExplorer={blockExplorer}
            contractConfig={contractConfig}
          />
        </Route>
        <Route path="/hints">
          <Hints
            address={address}
            yourLocalBalance={yourLocalBalance}
            mainnetProvider={mainnetProvider}
            price={price}
          />
        </Route>
        <Route path="/exampleui">
          <ExampleUI
            address={address}
            userSigner={userSigner}
            mainnetProvider={mainnetProvider}
            localProvider={localProvider}
            yourLocalBalance={yourLocalBalance}
            price={price}
            tx={tx}
            writeContracts={writeContracts}
            readContracts={readContracts}
            purpose={purpose}
          />
        </Route>
        <Route path="/mainnetdai">
          <Contract
            name="DAI"
            customContract={mainnetContracts && mainnetContracts.contracts && mainnetContracts.contracts.DAI}
            signer={userSigner}
            provider={mainnetProvider}
            address={address}
            blockExplorer="https://etherscan.io/"
            contractConfig={contractConfig}
            chainId={1}
          />
          {/*
            <Contract
              name="UNI"
              customContract={mainnetContracts && mainnetContracts.contracts && mainnetContracts.contracts.UNI}
              signer={userSigner}
              provider={mainnetProvider}
              address={address}
              blockExplorer="https://etherscan.io/"
            />
            */}
        </Route>
        <Route path="/subgraph">
          <Subgraph
            subgraphUri={props.subgraphUri}
            tx={tx}
            writeContracts={writeContracts}
            mainnetProvider={mainnetProvider}
          />
        </Route>
      </Switch>

      <ThemeSwitch />

      {/* 🗺 Extra UI like gas price, eth price, faucet, and support: */}
      <div style={{ position: "fixed", textAlign: "left", left: 0, bottom: 20, padding: 10 }}>
        <Row align="middle" gutter={[4, 4]}>
          <Col span={8}>
            <Ramp price={price} address={address} networks={NETWORKS} />
          </Col>

          <Col span={8} style={{ textAlign: "center", opacity: 0.8 }}>
            <GasGauge gasPrice={gasPrice} />
          </Col>
          <Col span={8} style={{ textAlign: "center", opacity: 1 }}>
            <Button
              onClick={() => {
                window.open("https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA");
              }}
              size="large"
              shape="round"
            >
              <span style={{ marginRight: 8 }} role="img" aria-label="support">
                💬
              </span>
              Support
            </Button>
          </Col>
        </Row>

        <Row align="middle" gutter={[4, 4]}>
          <Col span={24}>
            {
              /*  if the local provider has a signer, let's show the faucet:  */
              faucetAvailable ? (
                <Faucet localProvider={localProvider} price={price} ensProvider={mainnetProvider} />
              ) : (
                ""
              )
            }
          </Col>
        </Row>
      </div>
    </div>
  );
}

export default App;
