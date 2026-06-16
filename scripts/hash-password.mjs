// Generate a bcrypt hash for your admin password.
// Usage:  npm run hash-password -- "your-password"
//   or:   npm run hash-password         (prompts on stdin)
import bcrypt from "bcryptjs";
import readline from "node:readline";

async function getPassword() {
  const fromArg = process.argv[2];
  if (fromArg) return fromArg;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question("Password: ", (a) => { rl.close(); resolve(a); }));
}

const password = await getPassword();
if (!password) {
  console.error("No password provided.");
  process.exit(1);
}
const hash = await bcrypt.hash(password, 12);
console.log("\nAdd this to your .env.local:\n");
console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
