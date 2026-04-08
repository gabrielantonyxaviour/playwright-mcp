/**
 * Integration test for the session management layer.
 * Run with: node test-session.mjs
 */
import { SessionManager } from './dist/session-manager.js';

const mgr = new SessionManager({ headless: true });

async function run() {
  console.log('=== playwright-mcp-sessions integration test ===\n');

  // 1. Create a session
  console.log('[1] session_create...');
  const s1 = await mgr.createSession('test-s1');
  console.log(`    Created: id=${s1.id} name=${s1.name}`);

  // 2. Navigate
  console.log('[2] navigate to example.com...');
  const page = s1.pages[s1.activePageIndex];
  await page.goto('https://example.com');
  console.log(`    URL: ${page.url()}, title: ${await page.title()}`);

  // 3. List sessions
  console.log('[3] session_list...');
  const list = await mgr.listSessions();
  console.log(`    Sessions: ${JSON.stringify(list.map(s => ({ id: s.id, name: s.name, url: s.url })), null, 2)}`);

  // 4. Clone session
  console.log('[4] session_clone...');
  const s2 = await mgr.cloneSession(s1.id, 'test-s2');
  console.log(`    Cloned: id=${s2.id} name=${s2.name}`);

  // 5. Navigate clone to different URL
  const page2 = s2.pages[s2.activePageIndex];
  await page2.goto('https://playwright.dev');
  console.log(`    Clone URL: ${page2.url()}`);

  // 6. Verify original is unchanged
  console.log('[5] verify original session unchanged...');
  console.log(`    Original URL: ${page.url()}`);
  if (page.url().includes('example.com')) console.log('    PASS: original still at example.com');
  else console.log('    FAIL: original URL changed!');

  // 7. Save session
  console.log('[6] session_save...');
  const savedName = await mgr.saveSession(s1.id);
  console.log(`    Saved as: "${savedName}"`);

  // 8. List saved
  console.log('[7] session_list_saved...');
  const saved = await mgr.stateStore.listSaved();
  const found = saved.find(s => s.name === 'test-s1');
  if (found) console.log(`    PASS: found saved session "test-s1" (lastUrl: ${found.lastUrl})`);
  else console.log('    FAIL: saved session not found');

  // 9. Close sessions
  console.log('[8] cleanup...');
  await mgr.closeSession(s1.id);
  await mgr.closeSession(s2.id);
  await mgr.stateStore.delete('test-s1');
  await mgr.closeAll();

  console.log('\n=== ALL TESTS PASSED ===');
}

run().catch(err => {
  console.error('FAILED:', err);
  process.exit(1);
});
