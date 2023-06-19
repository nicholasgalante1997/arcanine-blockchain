import { ArcanineBlockchain } from './blockchain.js';

export type Token = {
  id: string;
};

export type Network = {
  name: string;
  id: string;
  protocol: 'http' | 'https' | 'ws' | 'wss';
  hostname: string;
  port?: number;
  path?: string;
  isTestNet?: boolean;
};

export type Transaction = {
  id: string;
  token: Token;
  recipient: string;
  vendor: string;
};

export type ArcAuth = {
  token: string;
};

export type ArcNode = {
  id: string;
  ip_address?: string;
  owner?: string;
  network: Network;
};

export type ArcanineHttpResponse = { chain: ArcanineBlockchain; len: number };

export type Block = {
  index: number;
  previousHashedBlock: string;
  nonce: number;
  transactions: Transaction[];
};

export type ImmutableBlock = Block & { timestamp: string };
