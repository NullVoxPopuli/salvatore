import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const pidPath = path.join(__dirname, "fixture.pid");
export const daemon = path.join(__dirname, "daemon.js");
