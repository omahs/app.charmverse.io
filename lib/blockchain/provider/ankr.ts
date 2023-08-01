import type { Nft } from '@ankr.com/ankr.js';
import { AnkrProvider } from '@ankr.com/ankr.js';
import type { Blockchain as AnkrBlockchain } from '@ankr.com/ankr.js/dist/types';
import { GET } from '@charmverse/core/http';
import { log } from '@charmverse/core/log';
import ERC721_ABI from 'abis/ERC721.json';
import { RateLimit } from 'async-sema';
import { ethers } from 'ethers';

import { getNFTUrl } from 'components/common/CharmEditor/components/nft/utils';
import { paginatedCall } from 'lib/utilities/async';
import { typedKeys } from 'lib/utilities/objects';

import type { NFTData } from '../getNFTs';

// 50 requests/minute for Public tier - https://www.ankr.com/docs/rpc-service/service-plans/#rate-limits
const rateLimiter = RateLimit(0.8);

// Find supported chains:  https://www.npmjs.com/package/@ankr.com/ankr.js
// Note: we commented out chains already supported by alchemy
const ankrAdvancedApis = {
  // 1: 'eth',
  // 5: 'eth_goerli',
  // 10: 'optimism',
  56: 'bsc',
  // 137: 'polygon',
  250: 'fantom',
  // 42161: 'arbitrum',
  43114: 'avalanche',
  5000: 'mantle'
} as const;
// https://docs.alchemy.com/docs/why-use-alchemy#-blockchains-supported
export const supportedChainIds = typedKeys(ankrAdvancedApis);
export type SupportedChainId = (typeof supportedChainIds)[number];

// We can still support chains that dont have an advanced api
const rpcApis: SupportedChainId[] = [5000];
export const supportedMainnets: SupportedChainId[] = [56, 250, 43114, 5000];

const advancedAPIEndpoint = `https://rpc.ankr.com/multichain/${process.env.ANKR_API_ID}`;

function getRPCEndpoint(chainId: SupportedChainId) {
  const chainPath = ankrAdvancedApis[chainId];
  if (!chainPath) throw new Error(`Chain id "${chainId}" not supported by Ankr`);
  return `https://rpc.ankr.com/${chainPath}/${process.env.ANKR_API_ID}`;
}

// Docs: https://api-docs.ankr.com/reference/post_ankr-getnftholders
export async function getNFTs({
  chainId,
  address,
  walletId
}: {
  chainId: SupportedChainId;
  address: string;
  walletId: string;
}): Promise<NFTData[]> {
  const provider = new AnkrProvider(advancedAPIEndpoint);
  if (chainId === 5000) {
    // TODO: find a provider that indexes the Mantle blockchain for NFTs
    return [];
  }
  const blockchain = ankrAdvancedApis[chainId];
  if (!blockchain) throw new Error(`Chain id "${chainId}" not supported by Ankr`);
  const results = await paginatedCall(
    async (params) => {
      await rateLimiter();
      return provider.getNFTsByOwner({
        ...params,
        blockchain,
        walletAddress: address
      });
    },
    (response) => (response.nextPageToken ? { pageToken: response.nextPageToken } : null)
  );
  const nfts = results
    .map((result) => result.assets)
    .flat()
    .map((nft) => mapNFTData(nft, walletId, chainId));
  return nfts;
}

type GetNFTInput = {
  address: string;
  tokenId: string;
  chainId: SupportedChainId;
};

export async function getNFT({ address, tokenId, chainId }: GetNFTInput): Promise<NFTData | null> {
  if (rpcApis.includes(chainId)) {
    return getTokenInfoOnMantle({ address, chainId, tokenId });
  }
  const provider = new AnkrProvider(advancedAPIEndpoint);
  const blockchain = ankrAdvancedApis[chainId];
  if (!blockchain) throw new Error(`Chain id "${chainId}" not supported by Ankr`);
  await rateLimiter();
  const nft = await provider.getNFTMetadata({
    blockchain: blockchain as AnkrBlockchain,
    tokenId: toInt(tokenId).toString(),
    contractAddress: address,
    forceFetch: false
  });
  if (!nft.attributes || !nft.metadata) {
    return null;
  }
  return mapNFTData({ ...nft.attributes, ...nft.metadata }, null, chainId);
}

type GetNFTOwnerInput = {
  address: string;
  chainId: SupportedChainId;
};

// https://github.com/charmverse/api.charmverse.io/blob/main/lib/blockchain/index.ts

export async function getNFTOwners({ address, chainId }: GetNFTOwnerInput): Promise<string[]> {
  // TODO: handle Mantle: https://ethereum.stackexchange.com/questions/144319/how-to-get-all-the-owners-from-an-nft-collection
  if (chainId === 5000) {
    log.warn('TODO: Support mantle NFT for owner validation');
    return [];
  }
  const provider = new AnkrProvider(advancedAPIEndpoint);
  const blockchain = ankrAdvancedApis[chainId];
  if (!blockchain) throw new Error(`Chain id "${chainId}" not supported by Ankr`);
  const results = await paginatedCall(
    async (params) => {
      await rateLimiter();
      return provider.getNFTHolders({
        ...params,
        contractAddress: address,
        blockchain
      });
    },
    (response) => (response.nextPageToken ? { pageToken: response.nextPageToken } : null)
  );
  return results.map((res) => res.holders).flat();
}

type NFTFields = Pick<Nft, 'contractAddress' | 'tokenId' | 'imageUrl' | 'name'>;

function mapNFTData(nft: NFTFields, walletId: string | null, chainId: SupportedChainId): NFTData {
  const link = getNFTUrl({ chain: chainId, contract: nft.contractAddress, token: nft.tokenId }) ?? '';
  return {
    id: `${nft.contractAddress}:${nft.tokenId}`,
    tokenId: nft.tokenId,
    tokenIdInt: toInt(nft.tokenId),
    contract: nft.contractAddress,
    imageRaw: nft.imageUrl,
    image: nft.imageUrl,
    imageThumb: nft.imageUrl,
    title: nft.name,
    description: '',
    chainId,
    timeLastUpdated: new Date(1970).toISOString(),
    isHidden: false,
    isPinned: false,
    link,
    walletId
  };
}

export function toInt(tokenId: string) {
  if (tokenId.includes('0x')) {
    return parseInt(tokenId, 16);
  }
  return parseInt(tokenId);
}

type TokenMetadata = {
  image: string;
  name: string;
  description: string;
};

type RPCTokenInput = GetNFTInput & { walletId?: string | null };

// assume chainId is mantle
export async function getTokenInfoOnMantle({
  address,
  chainId,
  walletId = null,
  tokenId
}: RPCTokenInput): Promise<NFTData> {
  const provider = new ethers.providers.JsonRpcProvider(getRPCEndpoint(chainId));
  const contract = new ethers.Contract(address, ERC721_ABI, provider);

  const [tokenUri] = await Promise.all([contract.tokenURI(tokenId)]);
  const tokenUriDNSVersion = tokenUri.replace('ipfs://', 'https://ipfs.io/ipfs/');
  const metadata = await GET<TokenMetadata>(tokenUriDNSVersion, null);
  const imageUrl = metadata.image?.replace('ipfs://', 'https://ipfs.io/ipfs/');
  return {
    id: `${address}:${tokenId}`,
    tokenId,
    tokenIdInt: toInt(tokenId),
    contract: address,
    imageRaw: imageUrl,
    image: imageUrl,
    imageThumb: imageUrl,
    title: metadata.name,
    description: '',
    chainId: 5000,
    timeLastUpdated: new Date(1970).toISOString(),
    isHidden: false,
    isPinned: false,
    // TODO: find a marketplace that supports mantle NFTs
    link: '',
    walletId
  };
}
