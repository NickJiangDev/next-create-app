import { execSync } from "child_process";
import { resolve } from "path";
import { getVercelToken } from "./vercel-token";

const token = getVercelToken();
execSync(`npx -y vercel deploy --prod --token ${token}`, {
  cwd: resolve(__dirname, "../.."),
  stdio: "inherit",
});
