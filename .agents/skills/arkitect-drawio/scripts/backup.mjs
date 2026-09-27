#!/usr/bin/env node
// Back a .drawio file up before editing it in place (#179).
import { backupCli } from './lib/backups.mjs';

process.exit(backupCli(process.argv.slice(2)));
