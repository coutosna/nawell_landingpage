import bcrypt from "bcryptjs";

const parseUsers = () => {
  const raw = process.env.AUTH_USERS;
  if (!raw) {
    throw new Error(
      "AUTH_USERS não definida. Configure no formato JSON: [{\"username\":\"...\",\"passwordHash\":\"<bcrypt>\"}]"
    );
  }
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("AUTH_USERS deve ser uma lista de usuários");
  }
  return parsed.map((u) => ({
    username: String(u.username),
    passwordHash: String(u.passwordHash),
  }));
};

export const USERS = parseUsers();

export async function verifyCredentials(username, password) {
  const user = USERS.find((u) => u.username === username);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? { username: user.username } : null;
}

export function getPublicUser(username) {
  return { username };
}
