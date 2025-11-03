import express from 'express'
import grabGraphsRouter from './grabGraphs.js'
import grabChatsRouter from './grabChats.js'
import grabMsgRouter from './grabMsg.js'

const router = express.Router()

// Each sub-route handles its own /api/ prefix
router.use(grabGraphsRouter)
router.use(grabChatsRouter)
router.use(grabMsgRouter)

export default router
