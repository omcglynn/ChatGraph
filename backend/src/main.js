import express from 'express'
import cors from 'cors'

// Supabase client
import supabase from './supabaseClient.js'

// Route modules
import grabGraphsRouter from './routes/grabGraphs.js'
import grabChatsRouter from './routes/grabChats.js'
import grabMsgRouter from './routes/grabMsg.js'

// Initialize express app
const app = express()
const port = process.env.PORT || 3000

// Middleware
app.use(express.json())
app.use(
  cors({
    origin: 'http://localhost:5177', 
    credentials: true,
  })
)

// Use routes
app.use(grabGraphsRouter)
app.use(grabChatsRouter)
app.use(grabMsgRouter)

// Optional default route
app.get('/', (req, res) => {
  res.send('✅ ChatGraph Backend is running successfully!')
})

// Start server
app.listen(port, () => {
  console.log(`✅ Example app listening on port ${port} (http://localhost:${port}/)`)
})
