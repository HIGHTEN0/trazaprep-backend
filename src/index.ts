import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import casillasRouter from "./routes/casillas";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/", casillasRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`TrazaPREP API corriendo en http://localhost:${PORT}`);
});