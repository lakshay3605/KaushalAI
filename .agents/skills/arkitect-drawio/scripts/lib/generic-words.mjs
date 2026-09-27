// A component named only in generic words - "service", "storage", "users" -
// is not a product, and a cloud vendor's icon for it says the thing runs on
// that vendor. Both searches drew one unattended: an invented internal service
// came out as AWS's "Service" glyph, and "storage" as Google Cloud Storage
// (#231). A vendor-neutral mark for the same words is fine, and so is a
// deliberate ref or a stack the spec names.

export const GENERIC_WORDS = new Set([
  'service', 'services', 'microservice', 'microservices', 'storage', 'store',
  'function', 'functions', 'user', 'users', 'client', 'clients', 'server', 'servers',
  'database', 'databases', 'db', 'cache', 'queue', 'queues', 'api', 'apis', 'gateway',
  'worker', 'workers', 'job', 'jobs', 'app', 'apps', 'application', 'applications',
  'web', 'mobile', 'frontend', 'backend', 'compute', 'container', 'containers',
  'cluster', 'instance', 'instances', 'network', 'bucket', 'event', 'events',
  'stream', 'streams', 'topic', 'table', 'tables', 'file', 'files', 'backup',
  'monitor', 'monitoring', 'log', 'logs', 'logging', 'search', 'analytics',
  'notification', 'notifications', 'identity', 'auth', 'authentication', 'secret',
  'secrets', 'registry', 'repository', 'pipeline', 'scheduler', 'firewall', 'dns',
  'cdn', 'vpn', 'load', 'balancer', 'internet', 'data', 'warehouse', 'lake', 'email',
  'mail', 'message', 'messages', 'messaging', 'broker', 'endpoint', 'endpoints',
  'integration', 'portal', 'dashboard', 'admin', 'internal', 'external', 'private',
  'public', 'bus', 'schema', 'media',
]);

// The packs whose marks are a cloud vendor's own.
export const VENDOR_PACKS = new Set(['aws', 'azure', 'gcp']);
const VENDOR_LIBRARY = /^(aws|amazon|azure|microsoft-azure|gcp|google)(-|$)/;

export const GENERIC_VENDOR = "a generic word matches a cloud vendor's own icon, which would say the component runs there";

// What a compact answer says instead of offering the vendor's marks: offered
// first in a list of choices, the mark was taken anyway two runs in three.
export const KEEP_PLACEHOLDER = "Keep the placeholder. A vendor's mark belongs only on a component that runs on that vendor, and then by its exact ref.";

export function onlyGenericWords(query) {
  const words = String(query ?? '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  return words.length > 0 && words.every((w) => GENERIC_WORDS.has(w));
}

// Which vendor pack an Excalidraw search entry comes from, or null.
export function vendorOf(entry) {
  const ref = String(entry?.ref ?? '');
  if (ref.startsWith('drawio:')) {
    const pack = ref.slice('drawio:'.length).split('/')[0];
    return VENDOR_PACKS.has(pack) ? pack : null;
  }
  const library = entry?.library ?? (ref.includes(':') ? ref.split(':')[0] : '');
  const m = VENDOR_LIBRARY.exec(String(library));
  return m ? ({ amazon: 'aws', 'microsoft-azure': 'azure', google: 'gcp' }[m[1]] ?? m[1]) : null;
}
