import express from "express";
import chatsRoute from "./grabChats.js";
import graphsRoute from "./grabGraphs.js";
import msgRoute from "./grabMsg.js";
const router = express.Router();

router.use("/chats", chatsRoute);
router.use("/graphs", graphsRoute);
router.use("/messages", msgRoute);

export default router;
