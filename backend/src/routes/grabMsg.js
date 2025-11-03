import express from 'express'
import supabase, { createUserClient } from '../supabaseClient.js'

const router = express.Router()

router.get('/api/messages/:chatId', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    const token = authHeader.split(' ')[1]
    const chatId = req.params.chatId

    const { data: userData, error: getUserError } = await supabase.auth.getUser(token)
    if (getUserError || !userData?.user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    const userClient = createUserClient(token)

    const { data, error } = await userClient
      .from('messages')
      .select('id, author, content, created_at')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching messages:', error)
      return res.status(500).json({ error: 'Database error', details: error })
    }

    console.log('Fetched messages:', data)
    return res.json(data)
  } catch (err) {
    console.error('Unexpected error in /api/messages:', err)
    return res.status(500).json({ error: err.message || String(err) })
  }
})

export default router

// Optional internal helper
export async function getMessages(chatId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}
