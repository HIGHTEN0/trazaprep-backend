import { ethers } from "ethers";
import * as dotenv from "dotenv";
import TrazaPREPAbi from "../abi/TrazaPREP.json";

dotenv.config();

export const provider = new ethers.JsonRpcProvider(
  `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
);

export const contrato = new ethers.Contract(
  process.env.CONTRACT_ADDRESS as string,
  TrazaPREPAbi.abi,
  provider
);