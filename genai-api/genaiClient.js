import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

export const ai = new GoogleGenAI({ apiKey: "AIzaSyB-b2MGTtBWfEn_IJ3Xf2kz8Nni1EAQ8BE" });
// export const ai = new GoogleGenAI({
//   // apiKey: process.env.GOOGLE_API_KEY,
//   apiKey: "AIzaSyB-b2MGTtBWfEn_IJ3Xf2kz8Nni1EAQ8BE",
// });
