import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import http from 'http';
import { v4 as uuid } from 'uuid';
import cors from 'cors';
import { ArcanineBlockchain } from './blockchain.js';

const vendorId = uuid();
const recipId = uuid();
const arcanine = new ArcanineBlockchain();

const app = express();

app.use(cors());

app.get('/blockchain', (req, res) => {
    res.status(200).send({ chain: arcanine, len: arcanine.chain.length });
});

app.get('/mine', (req, res) => {
    arcanine.appendTransaction(vendorId, recipId, { id: '22' });
    const lastBlockHash = arcanine.hashBlock(arcanine.lastBlock);
    const index = arcanine.chain.length;
    const nonce = arcanine.proofOfWork(index, lastBlockHash, arcanine.currentTransactions);
    const block = arcanine.appendBlock(nonce, lastBlockHash);
    res.status(201).json({ block, msg: 'New Block Mined' });
})

export const server = http.createServer(app);
