// A product can outlive its name. Height shut down, Lightstep was renamed and
// then retired, Census became Fivetran Activations - and each still resolves
// confidently, because the mark is still the right mark for that name. What an
// architect drawing a target state needs is the caveat alongside it (#83).
//
// The manifest records it as `status` on a pack entry:
//
//   { "state": "absorbed", "on": "2025-05", "successor": "Fivetran Activations",
//     "successorId": "streaming-orchestration/fivetran", "checked": "2026-09-16" }
//
// `on` is as precise as the source allows: a year, a month or a day. `checked`
// is the day someone last confirmed it, so a stale fact can be found again.

export const STATES = {
  discontinued: 'shut down',
  renamed: 'renamed',
  absorbed: 'folded into another product',
  acquired: 'acquired',
  archived: 'no longer maintained',
};

// A lifecycle fact older than this is re-read by the quarterly drift check.
export const RECHECK_DAYS = 365;

const DATE = /^\d{4}(-\d{2}(-\d{2})?)?$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

// Every problem with one entry's status, as strings naming the entry.
export function statusProblems(where, status) {
  if (status === undefined) return [];
  if (!status || typeof status !== 'object') return [`${where}: status must be an object`];
  const out = [];
  if (!Object.hasOwn(STATES, status.state)) {
    out.push(`${where}: status.state "${status.state}" is not one of ${Object.keys(STATES).join(', ')}`);
  }
  if (!DATE.test(status.on ?? '')) out.push(`${where}: status.on must be an ISO year, year-month or full date`);
  if (!DAY.test(status.checked ?? '')) out.push(`${where}: status.checked must be the full ISO date it was last confirmed`);
  if (status.successorId && !status.successor) out.push(`${where}: status.successorId needs a successor name`);
  if (['renamed', 'absorbed'].includes(status.state) && !status.successor && !status.from) {
    out.push(`${where}: a ${status.state} product names its successor or what it was renamed from`);
  }
  const known = new Set(['state', 'on', 'successor', 'successorId', 'by', 'from', 'pending', 'note', 'checked']);
  for (const key of Object.keys(status)) if (!known.has(key)) out.push(`${where}: status.${key} is not a known field`);
  return out;
}

// One sentence an agent can repeat to the person it is drawing for.
export function caveat(title, status) {
  if (!status) return null;
  const when = status.on ? ` (${status.on})` : '';
  const by = status.by ? ` by ${status.by}` : '';
  let text;
  switch (status.state) {
    case 'discontinued': text = `${title} was discontinued${when}.`; break;
    case 'renamed': text = status.from
      ? `${title} was renamed from ${status.from}${when}.`
      : `${title} was renamed to ${status.successor}${when}.`; break;
    case 'absorbed': text = `${title} was folded into ${status.successor}${when}.`; break;
    case 'acquired': text = status.pending
      ? `${title} is being acquired${by}: announced${status.on ? ` ${status.on}` : ''}, not closed when last checked.`
      : `${title} was acquired${by}${when}.`; break;
    case 'archived': text = `${title} is archived and no longer maintained${when}.`; break;
    default: text = `${title}: ${status.state}${when}.`;
  }
  if (status.note) text += ` ${status.note}`;
  // The name still means the product it drew: a rename from an older name, or
  // a brand that kept operating after a sale, needs the fact but not the warning.
  const current = (status.state === 'renamed' && status.from) || (status.state === 'acquired' && !status.pending);
  return current ? text
    : `${text} Right for a current-state diagram of a system that runs it; check before drawing it into a target state.`;
}

export const staleStatus = (status, now = Date.now()) => Boolean(status?.checked)
  && (now - Date.parse(`${status.checked}T00:00:00Z`)) / 86_400_000 >= RECHECK_DAYS;
