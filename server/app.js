import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cookieParser from "cookie-parser";
import { authRouter } from "./auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, "../dist");

export const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.use("/api/auth", authRouter);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use(express.static(DIST));

app.get("/*splat", (_req, res) => {
  res.sendFile(path.join(DIST, "index.html"));
});

app.use((err, _req, res, _next) => {
  console.error("Erro no servidor:", err);
  res.status(500).json({ error: "Erro interno" });
});