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
app.use(express.json());

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

app.post('/add-transaction', (req, res) => {
    console.log(req.body);
    const { recip = null, vendor = null, token = null } = req.body;
    if (!recip || !vendor || !token) {
        res.status(501).json({ err: 'invalid msg body' });
        return;
    }
    const blockIndex = arcanine.appendTransaction(vendor, recip, token);
    res.status(201).json({ status: 'created', blockToBeAdded: blockIndex });
})

export const server = http.createServer(app);
