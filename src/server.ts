import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import http from 'http';
import { v4 as uuid } from 'uuid';
import cors from 'cors';
import { ArcanineBlockchain } from './blockchain.js';
import { ArcNode } from './types.js';
import { logger } from './logger.js';

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
});

app.get('/sync', async (req, res) => {
  try {
    let didUpdateSelf = await arcanine.updateChain();
    if (didUpdateSelf) {
      res
        .status(201)
        .json({
          data: {
            chain: arcanine,
            len: arcanine.chain.length,
            msg: `Synced chain and found previous data was stale. Updated at ${new Date().toUTCString()}`,
          },
        });
    } else {
      res
        .status(200)
        .json({
          data: {
            chain: arcanine,
            len: arcanine.chain.length,
            msg: `Current chain is up to date.`,
          },
        });
    }
  } catch (e: unknown) {
    res.status(500).json({ data: null, err: e, msg: 'Server Error' });
  }
});

app.post('/transactions/add', (req, res) => {
  logger.info(req.body);
  const { recip = null, vendor = null, token = null } = req.body;
  if (!recip || !vendor || !token) {
    res.status(501).json({ err: 'invalid msg body' });
    return;
  }
  const blockIndex = arcanine.appendTransaction(vendor, recip, token);
  res.status(201).json({ status: 'created', blockToBeAdded: blockIndex });
});

app.post('/nodes/add', (req, res) => {
  const { body, headers } = req;
  const authToken = headers['x-arcanine-node-auth-token'];
  logger.warn({ authToken });
  if (!body || !body.nodes || !body.nodes.length) {
    res
      .status(401)
      .json({
        data: null,
        err: 'InvalidNodeList',
        msg: 'Request did not contain any valid nodes to add.',
      });
  }
  let { nodes } = body;
  nodes = nodes as ArcNode[];
  logger.info({ nodes });
  for (const node of nodes) {
    arcanine.addNode(node, { token: (authToken as string | undefined | null) ?? 'no-op' });
  }
  res.status(201).json({ data: nodes, msg: 'Added nodelist successfully.' });
});

export const server = http.createServer(app);
