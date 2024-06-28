import { PidFile } from "salvatore/pid";

import { pidPath } from "./shared.js";

const pid = new PidFile(pidPath);

pid.write("custom-data-from-the-daemon");

process.on("exit", () => console.log("exiting..."));
process.on("SIGTERM", () => pid.delete());
process.on("exit", () => pid.delete());

async function run() {
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve(null);
      process.exit(0);
      // This process should "hang" for 20s, and then exit itself
    }, 20_000);
  });
}

await run();
