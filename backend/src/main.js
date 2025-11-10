import express from "express";
import cors from 'cors';
import apiRoutes from './routes/index.js';
import supabase from "./supabaseClient.js";

const app = express()
const port = 3000

app.use(express.json());
app.use(cors({ origin: 'http://localhost:5177', credentials: true }));
app.use(apiRoutes);


//app.get('/', (req, res) => {
//  res.send('Hello World!!')
//})
//
//app.post('/', (req, res) => {
//  res.send('Got a POST request')
//})
//
//app.put('/user', (req, res) => {
//  res.send('Got a PUT request at /user')
//})
//
//app.get('/user', (req, res) => {
//  res.send('Got a GET request at /user')
//})
//
//app.delete('/user', (req, res) => {
//  res.send('Got a DELETE request at /user')
//})


app.listen(port, () => {
  console.log(`Example app listening on port ${port} (http://localhost:3000/)`)
})
