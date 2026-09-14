import { Router } from "express";
import jwt from "jsonwebtoken";
import { verifyCredentials, getPublicUser } from "./users.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const COOKIE_NAME = "nawell_session";
const SESSION_MS = 1000 * 60 * 60 * Number(process.env.SESSION_HOURS || 12);
const SECURE = process.env.COOKIE_SECURE === "true";

export const authRouter = Router();
export const requireAuth = (req, res, next) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: "Não autenticado" });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ error: "Sessão inválida ou expirada" });
  }
};

authRouter.post("/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Usuário e senha são obrigatórios" });
  }
  const user = await verifyCredentials(String(username), String(password));
  if (!user) {
    return res.status(401).json({ error: "Usuário ou senha incorretos" });
  }
  const token = jwt.sign({ username: user.username }, JWT_SECRET, {
    expiresIn: `${Number(process.env.SESSION_HOURS || 12)}h`,
  });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: SECURE,
    path: "/",
    maxAge: SESSION_MS,
  });
  return res.json(getPublicUser(user.username));
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME, { path: "/", sameSite: "lax", secure: SECURE });
  return res.json({ ok: true });
});

authRouter.get("/me", requireAuth, (req, res) => {
  return res.json(getPublicUser(req.user.username));
});
