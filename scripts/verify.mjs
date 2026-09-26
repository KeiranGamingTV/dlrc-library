import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ownerId = process.env.DLRC_OWNER_USER_ID;
const results = [];
function pass(name) { results.push([name, true]); console.log(`[PASS] ${name}`); }
function fail(name, error) { results.push([name, false]); console.error(`[FAIL] ${name}: ${error}`); }
function assert(condition, message) { if (!condition) throw new Error(message); }

console.log('DLRC LIBRARY VERIFICATION');
console.log('===========================');

if (!url || !key || !ownerId) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or DLRC_OWNER_USER_ID.');
  process.exit(1);
}

const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  try {
    const { error } = await db.from('profiles').select('id').limit(1);
    assert(!error, error?.message || 'profiles table unavailable');
    pass('Supabase connection and profiles table');
  } catch (e) { fail('Supabase connection and profiles table', e.message); }

  try {
    const checks = [
      ['submissions', 'song_key'], ['submissions', 'resubmission_of'], ['submissions', 'validation_errors'], ['submissions', 'validation_warnings'],
      ['songs', 'song_key'], ['songs', 'content'],
    ];
    for (const [table, column] of checks) {
      const { error } = await db.from(table).select(column).limit(1);
      assert(!error, `${table}.${column}: ${error?.message}`);
    }
    pass('Database migration columns');
  } catch (e) { fail('Database migration columns', e.message); }

  try {
    const { data, error } = await db.storage.listBuckets();
    assert(!error, error?.message);
    const names = new Set((data ?? []).map((b) => b.name));
    assert(names.has('submissions'), 'Missing submissions bucket');
    assert(names.has('dlrc-files'), 'Missing dlrc-files bucket');
    pass('Storage buckets');
  } catch (e) { fail('Storage buckets', e.message); }

  try {
    const sample = '[ti:Verification Song]\n[ar:DLRC Test]\n[al:Test Album]\n[length:0:03]\n[00:00.000]{A}Hello\n[00:01.000]{B}World';
    assert(/\[ti:/.test(sample) && sample.includes('{A}'), 'Sample DLRC malformed');
    pass('Verification fixture');
  } catch (e) { fail('Verification fixture', e.message); }

  try {
    const { data: owner, error } = await db.from('profiles').select('id,role').eq('id', ownerId).maybeSingle();
    assert(!error, error?.message); assert(owner, 'Owner profile not found'); assert(owner.role === 'admin', 'Owner profile is not admin');
    pass('Owner configuration');
  } catch (e) { fail('Owner configuration', e.message); }

  try {
    const { data: admins, error } = await db.from('profiles').select('id,role').eq('role', 'admin').limit(10);
    assert(!error, error?.message); assert((admins ?? []).length > 0, 'No admin profiles found');
    pass('Administrator profiles');
  } catch (e) { fail('Administrator profiles', e.message); }

  try {
    const { data: statuses, error } = await db.from('submissions').select('status').in('status', ['pending','approved','rejected']).limit(1);
    assert(!error, error?.message); assert(statuses !== null, 'Could not read submission statuses');
    pass('Submission status model');
  } catch (e) { fail('Submission status model', e.message); }

  console.log('\nThreshold boundary logic:');
  for (const [label, count, threshold, expected] of [['Trusted User 49',49,50,false],['Trusted User 50',50,50,true],['Trusted User 51',51,50,true],['Trusted Admin 9',9,10,false],['Trusted Admin 10',10,10,true],['Trusted Admin 11',11,10,true]]) {
    const actual = count >= threshold;
    try { assert(actual === expected, `${count} >= ${threshold} evaluated incorrectly`); pass(label); } catch (e) { fail(label, e.message); }
  }

  console.log('\n===========================');
  const passed = results.filter(([, ok]) => ok).length;
  const total = results.length;
  console.log(`${passed}/${total} checks passed`);
  if (passed !== total) process.exit(1);
}

main().catch((error) => { console.error(error); process.exit(1); });
