import { Network, Alchemy } from "alchemy-sdk";

const settings = {
  apiKey: process.env.REACT_APP_ALCHEMY_API_KEY,
  network: Network.OPT_MAINNET,
};

const alchemy = new Alchemy(settings);

export const CLB_COLLECTION_ADDRESS = "0xfb3999711d4f309F6B71504268F79b3fD578DA6F";
export const ELB_COLLECTION_ADDRESS = "0x22Cd0e2680f4B9aE140E3b9AbFA3463532e290Ff";

// --------------------------------------------------
// Function to fetch LWD Nfts
// --------------------------------------------------
export const fetchCLBNFTs = async (
  address = "0xc57c5aE582708e619Ec1BA7513480b2e7540935f",
  pageKey = "",
  pageLimit = 10,
) => {
  const nftsForOwner = await alchemy.nft.getNftsForOwner(address, {
    pageKey: pageKey,
    pageSize: pageLimit,
    contractAddresses: [CLB_COLLECTION_ADDRESS],
  });

  console.log("Owner NFTs", nftsForOwner);

  const clbTokenIdsMinted = [];
  for (const nft of nftsForOwner.ownedNfts) {
    if (CLB_COLLECTION_ADDRESS.toLowerCase() === nft.contract.address.toLowerCase()) {
      clbTokenIdsMinted.push(nft.tokenId);
    }
  }

  console.log("clbTokenIdsMinted", clbTokenIdsMinted);

  const clbNFTData = await Promise.all(
    clbTokenIdsMinted.map(async tokenId => {
      const nftMetadata = await alchemy.nft.getNftMetadata(CLB_COLLECTION_ADDRESS, tokenId);

      console.log(nftMetadata);
      return {
        name: nftMetadata.title,
        image: nftMetadata.media[0].gateway,
        description: nftMetadata.description,
        owner: address,
        tokenId: nftMetadata.tokenId,
      };
    }),
  );

  clbNFTData.pageKey = nftsForOwner.pageKey;
  clbNFTData.total = nftsForOwner.totalCount;

  return clbNFTData;
};

// --------------------------------------------------
// Function to fetch BuildSpace NFTs
// --------------------------------------------------
export const fetchELBNFTs = async (
  address = "0xc57c5aE582708e619Ec1BA7513480b2e7540935f",
  pageKey = "",
  pageLimit = 10,
) => {
  const nftsForOwner = await alchemy.nft.getNftsForOwner(address, {
    pageKey: pageKey,
    pageSize: pageLimit,
    contractAddresses: [ELB_COLLECTION_ADDRESS],
  });

  console.log(`fdaljf;sldjkf`, nftsForOwner);

  const elbTokenIdsMinted = [];
  for (const nft of nftsForOwner.ownedNfts) {
    if (ELB_COLLECTION_ADDRESS.toLowerCase() === nft.contract.address.toLowerCase()) {
      elbTokenIdsMinted.push(nft.tokenId);
    }
  }

  const elbNFTData = await Promise.all(
    elbTokenIdsMinted.map(async tokenId => {
      const nftMetadata = await alchemy.nft.getNftMetadata(ELB_COLLECTION_ADDRESS, tokenId);

      console.log(nftMetadata);
      return {
        name: nftMetadata.title,
        image: nftMetadata.media[0].gateway,
        description: nftMetadata.description,
        owner: address,
        tokenId: nftMetadata.tokenId,
      };
    }),
  );

  elbNFTData.pageKey = nftsForOwner.pageKey;
  elbNFTData.total = nftsForOwner.totalCount;

  return elbNFTData;
};
