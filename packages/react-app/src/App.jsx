import { Button, Col, InputNumber, Menu, Row, Space, Spin, Tooltip, Typography } from "antd";
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
import { fetchCLBNFTs, fetchELBNFTs, fetchMLBNFTs } from "./utils";
import { InfoCircleOutlined } from "@ant-design/icons";

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
const DEBUG = false;
const NETWORKCHECK = true;
const USE_BURNER_WALLET = false; // toggle burner wallet feature
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
  const [mlbData, setMlbData] = useState(null);

  const [elbLoading, setElbLoading] = useState(false);
  const [clbLoading, setClbLoading] = useState(false);
  const [mlbLoading, setMlbLoading] = useState(false);

  const [clbSelectedTokenId, setClbSelectedTokenId] = useState(1);
  const [elbSelectedTokenId, setElbSelectedTokenId] = useState(1);

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

  const {
    updateToken: updateMLBNextPageToken,
    currentToken: currentMLBPageToken,
    changePageNumber: changeMLBPageNumber,
    pageNumber: mlbPageNumber,
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

  const usersELBNFTsElement = elbData && (
    <NFTsMinted data={elbData} setPageNumber={changeELBPageNumber} pageNumber={elbPageNumber} loading={elbLoading} />
  );

  const usersCLBNFTsElement = clbData && (
    <NFTsMinted data={clbData} setPageNumber={changeCLBPageNumber} pageNumber={clbPageNumber} loading={clbLoading} />
  );

  const usersMLBNFTsElement = mlbData && (
    <NFTsMinted data={mlbData} setPageNumber={changeMLBPageNumber} pageNumber={mlbPageNumber} loading={clbLoading} />
  );

  useEffect(() => {
    if (address) {
      (async () => {
        setClbLoading(true);
        console.log("currentCLBPageToken:", currentCLBPageToken);
        let clbDataRes = await fetchCLBNFTs(address, currentCLBPageToken, 6);
        if (clbDataRes) {
          console.log("pageKey", clbDataRes.pageKey);
          updateCLBNextPageToken(clbDataRes.pageKey);
          setClbData(clbDataRes);
          if (clbDataRes[0] && clbDataRes[0].tokenId) {
            setClbSelectedTokenId(clbDataRes[0].tokenId);
          }
          console.log("called me");
          console.log(`CLB DATA`, clbDataRes);
        }

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
        if (elbDataRes) {
          console.log("pageKey", elbDataRes.pageKey);
          updateELBNextPageToken(elbDataRes.pageKey);
          setElbData(elbDataRes);
          if (elbDataRes[0] && elbDataRes[0].tokenId) {
            setElbSelectedTokenId(elbDataRes[0].tokenId);
          }
          console.log("called me");
          console.log(`ELB DATA`, elbDataRes);
        }

        setElbLoading(false);
      })();
    }
  }, [address, currentELBPageToken, updateELBNextPageToken]);

  useEffect(() => {
    if (address) {
      (async () => {
        setMlbLoading(true);
        console.log("currentMLBPageToken:", currentMLBPageToken);
        let mlbDataRes = await fetchMLBNFTs(address, currentMLBPageToken, 6);
        if (mlbDataRes) {
          console.log("pageKey", mlbDataRes.pageKey);
          updateMLBNextPageToken(mlbDataRes.pageKey);
          setMlbData(mlbDataRes);
          console.log("called me");
          console.log(`MLB DATA`, mlbDataRes);
        }
        setMlbLoading(false);
      })();
    }
  }, [address, currentMLBPageToken, updateMLBNextPageToken]);

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

            <Space direction="vertical">
              <h2 style={{ margin: "18px 32px 18px 32px" }}>
                🐻‍❄️ X 🐻 Merge Bears
                <Tooltip
                  placement="topLeft"
                  title="If you are getting 'Internal JSON-RPC error' make sure you have enough balance and passing in correct tokenID's also CL and EL bear must not have already been used to mint
                  Merge Bear"
                >
                  <InfoCircleOutlined size={"small"} style={{ marginLeft: "1rem" }} />
                </Tooltip>
              </h2>
              <h3>Select the token IDs</h3>
              <Space align="center" size={60} style={{}}>
                <Space direction="vertical">
                  <h3>Consensus Layer Bears</h3>
                  <InputNumber
                    size="large"
                    min={1}
                    defaultValue={1}
                    max={3675}
                    value={clbSelectedTokenId}
                    onChange={value => {
                      setClbSelectedTokenId(value);
                    }}
                  />
                </Space>
                <Space direction="vertical">
                  <h3>Execution Layer Bears</h3>
                  <InputNumber
                    size="large"
                    min={1}
                    defaultValue={1}
                    max={3675}
                    value={elbSelectedTokenId}
                    onChange={value => {
                      setElbSelectedTokenId(value);
                    }}
                  />
                </Space>
              </Space>
              {userSigner ? (
                <Button
                  size="large"
                  type={"primary"}
                  onClick={async () => {
                    const price = ethers.utils.parseEther("0.00042");
                    const res = await tx(
                      writeContracts.MB["mint(uint256,uint256)"](
                        clbSelectedTokenId.toString(),
                        elbSelectedTokenId.toString(),
                        {
                          value: price,
                        },
                      ),
                    );

                    setTimeout(function () {
                      window.location.reload();
                    }, 3000);

                    changeMLBPageNumber(1);
                  }}
                  style={{ marginTop: "2rem" }}
                >
                  Mint Merge Bear
                </Button>
              ) : (
                <Button type={"primary"} onClick={loadWeb3Modal} style={{ marginTop: "2rem" }}>
                  CONNECT WALLET
                </Button>
              )}
            </Space>
            {usersMLBNFTsElement}
            {userSigner ? (
              !mlbData && (
                <div style={{ marginTop: "4rem" }}>
                  <Spin size="large" />
                </div>
              )
            ) : (
              <div>
                <Typography.Title level={5} style={{ marginTop: "1rem" }}>
                  Please Connect to wallet to mint and view owned NFTs
                </Typography.Title>
              </div>
            )}
            <hr style={{ margin: 64 }} />
          </div>

          <div>
            <h2 style={{ margin: 32 }}>🐻‍❄️ Consensus Layer Bears</h2>
          </div>
          {usersCLBNFTsElement}
          {userSigner ? (
            !clbData && (
              <div style={{ marginTop: "4rem" }}>
                <Spin size="large" />
              </div>
            )
          ) : (
            <div>
              <Typography.Title level={5}>Please Connect to wallet to view Owned NFts</Typography.Title>
            </div>
          )}

          <hr style={{ margin: 64 }} />

          <div>
            <h2 style={{ margin: 32 }}>🐻 Execution Layer Bears</h2>
          </div>
          {usersELBNFTsElement}
          {userSigner ? (
            !elbData && (
              <div style={{ marginTop: "4rem" }}>
                <Spin size="large" />
              </div>
            )
          ) : (
            <div>
              <Typography.Title level={5}>Please Connect to wallet to view Owned NFts</Typography.Title>
            </div>
          )}
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
      </div>
    </div>
  );
}

export default App;
