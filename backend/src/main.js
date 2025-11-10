import express from "express";
import cors from "cors";

import authRouter from "./routes/auth.js";
import mainRouter from "./routes/router.js";
import branchRouter from './routes/createBranch.js';


const app = express();
const port = 3000;
app.set('json spaces', 2);

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5177",
    credentials: true,
  })
);

app.use("/auth", authRouter); 
app.use("/api", mainRouter);  

app.listen(port, () => {
  console.log("✅ Server running on http://localhost:" + port);
});
