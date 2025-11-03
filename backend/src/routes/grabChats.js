import express from 'express'
import supabase, { createUserClient } from '../supabaseClient.js'

const router = express.Router()

router.get('/api/chats/:graphId', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    const token = authHeader.split(' ')[1]
    const graphId = req.params.graphId

    const { data: userData, error: getUserError } = await supabase.auth.getUser(token)
    if (getUserError || !userData?.user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    const userClient = createUserClient(token)

    const { data, error } = await userClient
      .from('chats')
      .select('id, title, created_at, parent_id, branch_point_message_id')
      .eq('graph_id', graphId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching chats:', error)
      return res.status(500).json({ error: 'Database error', details: error })
    }

    console.log('Fetched chats:', data)
    return res.json(data)
  } catch (err) {
    console.error('Unexpected error in /api/chats:', err)
    return res.status(500).json({ error: err.message || String(err) })
  }
})

export default router

// Optional internal utility (non-Express)
export async function getChats(graphId) {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('graph_id', graphId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}
