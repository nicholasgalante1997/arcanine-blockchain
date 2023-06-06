import dotenv from 'dotenv';
dotenv.config();
import { v4 as uuid } from 'uuid';
import { createHash } from 'crypto';
import { Converter } from "./converter.js";

export type Token = {
  id: string;
};

export type Transaction = {
  id: string;
  token: Token;
  recipient: string;
  vendor: string;
};

export type Block = {
  index: number;
  previousHashedBlock: string;
  nonce: number;
  transactions: Transaction[];
};

export type ImmutableBlock = Block & { timestamp: string };

export class ArcanineBlockchain {
  private static difficultyTarget = process.env.ARC_NODE_DIFF_TARGET!;
  public chain: Block[];
  public currentTransactions: Transaction[];
  genesisHash = 'maggie simpson';
  constructor(){
    console.log('ArcanineChain blockchain starting...');
    this.chain = [];
    this.currentTransactions = [];
    console.log('Beginning proofOfWork for genesis block...');
    this.appendBlock(
      this.proofOfWork(0, this.genesisHash, []),
      this.genesisHash
    );
  }
  get lastBlock () {
    return this.chain[this.chain.length - 1];
  }
  appendBlock(nonce: number, hashOfPreviousBlock: string) {
    const block: Block = {
      index: this.chain.length,
      nonce,
      previousHashedBlock: hashOfPreviousBlock,
      transactions: this.currentTransactions
    };
    (block as ImmutableBlock).timestamp = new Date().toUTCString();
    this.currentTransactions = [];
    this.chain.push(block)
    return block;
  }
  appendTransaction(vendor: string, recip: string, token: Token) {
    this.currentTransactions.push({
      id: uuid(),
      recipient: recip,
      token,
      vendor
    });
    return (this.chain.length);
  }
  hashBlock(block: Block) {
    const blockAsPredictableString = Converter.Block.blockToPredictableString(block);
    return createHash('sha256').update(blockAsPredictableString).digest('hex');
  }
  proofOfWork(index: number, previousHashedBlock: string, transactions: Transaction[]) {
    console.log("Beginning proofOfWork!");
    let nonce = 0;
    while (!this.validProof(index, previousHashedBlock, transactions, nonce)) {
      nonce = nonce + 1;
    }
    return nonce;
  }
  validProof(index: number, hashOfPreviousBlock: string, transactions: Transaction[], nonce: number): boolean {
    const block: Block = {
      index,
      nonce,
      previousHashedBlock: hashOfPreviousBlock,
      transactions
    };
    const blockStr = Converter.Block.blockToPredictableString(block);
    const blockHash = createHash('sha256').update(blockStr).digest('hex');
    return blockHash.slice(0, ArcanineBlockchain.difficultyTarget.length) === ArcanineBlockchain.difficultyTarget;
  }
}
