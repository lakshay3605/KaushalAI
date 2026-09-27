#!/usr/bin/env node
// Back a scene up before editing it in place (#179). Backup naming and
// retention are shared with the Draw.io skill, like the rest of the core.
import { backupCli } from '../../arkitect-drawio/scripts/lib/backups.mjs';

process.exit(backupCli(process.argv.slice(2)));
