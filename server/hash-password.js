import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password) {
  console.error("Uso: node server/hash-password.js <senha>");
  process.exit(1);
}
const hash = bcrypt.hashSync(password, 12);
console.log(`passwordHash: ${hash}`);
