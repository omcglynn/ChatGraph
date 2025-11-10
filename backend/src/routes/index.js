import express from 'express';
import apiGraphs from './grabGraphs.js';
import apiChats from './grabChats.js';
import apiMessages from './grabMsg.js';

const router = express.Router();

// Mount the feature routers. Each feature router already defines its own paths (/api/graphs, /api/chats, etc.)
router.use(apiGraphs);
router.use(apiChats);
router.use(apiMessages);

export default router;
