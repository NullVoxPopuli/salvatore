#!/usr/bin/env node

import { start, stop, status } from './launcher.js';

const [_initiator, _script, ...args] = process.argv;

const [command] = args;

async function main() {
  switch (command) {
    case 'start':
      return start();
    case 'stop':
      return stop();
    case 'status':
      return status();
  }
}

await main();
