import dotenv from 'dotenv';
import axios from 'axios';
import { v4 as uuid } from 'uuid';
import { createHash } from 'crypto';
import { Converter } from './converter.js';
import {
  ArcanineHttpResponse,
  ArcAuth,
  ArcNode,
  Block,
  ImmutableBlock,
  Token,
  Transaction,
} from './types.js';
import { logger } from './logger.js';

dotenv.config();

export class ArcanineBlockchain {
  private static difficultyTarget = process.env.ARC_NODE_DIFF_TARGET!;
  private genesisHash = 'maggie_simpson_08161989';
  public chain: Block[];
  public currentTransactions: Transaction[];
  public nodes: Set<ArcNode>;
  constructor() {
    logger.info('ArcanineChain blockchain starting...');
    this.chain = [];
    this.currentTransactions = [];
    this.nodes = new Set<ArcNode>();
    logger.info('Beginning proofOfWork for genesis block...');
    this.appendBlock(this.proofOfWork(0, this.genesisHash, []), this.genesisHash);
  }
  get lastBlock() {
    return this.chain[this.chain.length - 1];
  }
  addNode(node: ArcNode, auth: ArcAuth) {
    if (this.validateAuth(auth)) {
      this.nodes.add(node);
    }
  }
  appendBlock(nonce: number, hashOfPreviousBlock: string) {
    const block: Block = {
      index: this.chain.length,
      nonce,
      previousHashedBlock: hashOfPreviousBlock,
      transactions: this.currentTransactions,
    };
    (block as ImmutableBlock).timestamp = new Date().toUTCString();
    this.currentTransactions = [];
    this.chain.push(block);
    return block;
  }
  appendTransaction(vendor: string, recip: string, token: Token) {
    this.currentTransactions.push({
      id: uuid(),
      recipient: recip,
      token,
      vendor,
    });
    return this.chain.length;
  }
  hashBlock(block: Block) {
    const blockAsPredictableString = Converter.Block.blockToPredictableString(block);
    return createHash('sha256').update(blockAsPredictableString).digest('hex');
  }
  proofOfWork(index: number, previousHashedBlock: string, transactions: Transaction[]) {
    logger.info('Beginning proofOfWork!');
    let nonce = 0;
    while (!this.validProof(index, previousHashedBlock, transactions, nonce)) {
      nonce = nonce + 1;
    }
    logger.info('Found valid hash. PoW Nonce ' + nonce)
    return nonce;
  }
  async updateChain() {
    let currentChainLength = this.chain.length;
    let newChain: ArcanineBlockchain | null = null;
    for (const node of this.nodes) {
      const {
        id,
        network: { hostname, protocol, path, port },
      } = node;
      const href = new URL(`${protocol}://${hostname}${port ? `:${port}` : ''}/${path}`).href;
      logger.info({ href })
      try {
        let { data: fChain, status, statusText } = await axios.get<ArcanineHttpResponse>(href, { headers: { 'Accept': 'application/json' } });
        if (status !== 200) {
          throw new Error('HttpStatusCodeException', { cause: statusText });
        }
        if (!fChain) {
          throw new Error(`Was unable to retrieve chain for node ${id}`);
        }
        if (fChain.len > currentChainLength && this.validChain(fChain.chain)) {
          currentChainLength = fChain.len;
          newChain = fChain.chain;
        }
      } catch (e: unknown) {
        console.error(e);
      }
    }
    if (newChain) {
      this.chain = newChain.chain;
      return true;
    }
    return false;
  }
  validChain(chain: ArcanineBlockchain) {
    let lastBlock = chain.chain[0];
    let currentIndex = 1;
    if (!lastBlock) return false;
    while (currentIndex < chain.chain.length) {
      let currentBlock = chain.chain[currentIndex];
      let { previousHashedBlock, nonce, transactions } = currentBlock;
      if (previousHashedBlock !== this.hashBlock(lastBlock)) {
        return false;
      }
      if (!this.validProof(currentIndex, previousHashedBlock, transactions, nonce)) {
        return false;
      }
      lastBlock = currentBlock;
      currentIndex = currentIndex + 1;
    }
    return true;
  }
  validProof(
    index: number,
    hashOfPreviousBlock: string,
    transactions: Transaction[],
    nonce: number
  ): boolean {
    const block: Block = {
      index,
      nonce,
      previousHashedBlock: hashOfPreviousBlock,
      transactions,
    };
    const blockStr = Converter.Block.blockToPredictableString(block);
    const blockHash = createHash('sha256').update(blockStr).digest('hex');
    return (
      blockHash.slice(0, ArcanineBlockchain.difficultyTarget.length) ===
      ArcanineBlockchain.difficultyTarget
    );
  }
  validateAuth(auth: ArcAuth) {
    if (auth.token === process.env.ARC_AUTH_TOKEN) {
      return true;
    }
    return false;
  }
}
