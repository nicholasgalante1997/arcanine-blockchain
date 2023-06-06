import dotenv from 'dotenv';
dotenv.config();

import type { Block, Transaction, Token } from './blockchain.js';
import crypto from 'crypto';

type PredictableBlockString =
  `index=${number},previousHashedBlock=${string},nonce=${number},transactions=${string}`;

export class Converter {
  public static Block = class AnonBlock {
    static transactionsToString(t: Transaction[]) {
      const tToString = (t: Transaction) => `v=${t.vendor}&r=${t.recipient}&token.id=${t.token.id}&id=${t.id}`;
      return t.map(tToString).join('|');
    }
    static buildTransactionListFromString(str: string) {
      const tAsStrList = str.split('|');
      let transactions: Transaction[] = [];
      for (const tStr of tAsStrList) {
        const kvs = tStr.split('&');
        let transaction = {
          recipient: kvs.find(s => s.startsWith('r='))!.split('r=')[1],
          vendor: kvs.find(s => s.startsWith('v='))!.split('v=')[1],
          token: { id: kvs.find(s => s.startsWith('token.id='))!.split('token.id=')[1] },
          id: kvs.find(s => s.startsWith('id='))!.split('id=')[1]
        };
        transactions.push(transaction)
      }
      return transactions;
    }
    public static blockToPredictableString(block: Block): PredictableBlockString {
      return `index=${block.index},previousHashedBlock=${block.previousHashedBlock},nonce=${
        block.nonce
      },transactions=${Converter.Block.transactionsToString(block.transactions)}`;
    }
    public static predictableStringToBlock(pre: PredictableBlockString): Block {
      const blockAsArray = pre.split(',');
      const index = parseInt(
        blockAsArray.find((str) => str.includes('index='))!.split('index=')[1],
        10
      );
      const previousHashedBlock = blockAsArray
        .find((str) => str.includes('previousHashedBlock='))!
        .split('previousHashedBlock=')[1];
      const nonce = parseInt(
        blockAsArray.find((str) => str.includes('nonce='))!.split('nonce=')[1],
        10
      );
      const transactionsAsStr = blockAsArray
        .find((str) => str.includes('transactions='))!
        .split('transactions=')[1];
      const transactions: Transaction[] = AnonBlock.buildTransactionListFromString(transactionsAsStr);
      return {
        index,
        previousHashedBlock,
        nonce,
        transactions,
      };
    }
  };
  public static Hasher = class AnonHasher {
    private initVector;
    private securityKey;
    private cipher: crypto.Cipher;
    private decipher: crypto.Decipher;
    private algorithm = process.env.HASHER_ENCR_ALG!;
    constructor(sKey: crypto.CipherKey, iv: crypto.BinaryLike) {
        this.initVector = iv;
        this.securityKey = sKey;
        this.cipher = crypto.createCipheriv(this.algorithm, this.securityKey, this.initVector);
        this.decipher = crypto.createDecipheriv(this.algorithm, this.securityKey, this.initVector);
    }
    encrypt(str: string) {
      let encryptedData = this.cipher.update(str, 'utf-8', 'hex');
      encryptedData += this.cipher.final('hex');
      return encryptedData;
    }
    decrypt(hash: string) {
      let decryptedData = this.decipher.update(hash, 'hex', 'utf-8');
      decryptedData += this.decipher.final('utf-8');
      return decryptedData;
    }
  };
}
