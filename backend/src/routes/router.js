import express from "express";
import chatsRoute from "./grabChats.js";
import graphsRoute from "./grabGraphs.js";
import msgRoute from "./grabMsg.js";
import branchRouter from "./createBranch.js";
const router = express.Router();

router.use("/chats", chatsRoute);
router.use("/graphs", graphsRoute);
router.use("/messages", msgRoute);
router.use("/branch", branchRouter);

export default router;
