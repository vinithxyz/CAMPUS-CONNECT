import assert from 'node:assert';

const BASE = 'http://localhost:5000/api';

async function request(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  return res;
}

async function run() {
  console.log('--- Starting Stage 1 Automated Verification ---');

  // 1. Student login
  const studentLoginRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: 'user123@example.edu', password: 'Password@123' }),
  });
  assert.strictEqual(studentLoginRes.status, 200, 'Student login should succeed');
  const studentCookie = studentLoginRes.headers.get('set-cookie');
  assert.ok(studentCookie, 'Student should receive session cookie');
  console.log('✓ Student login succeeded');

  // 2. Admin login
  const adminLoginRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: 'admin@example.edu', password: 'Admin@12345' }),
  });
  assert.strictEqual(adminLoginRes.status, 200, 'Admin login should succeed');
  const adminCookie = adminLoginRes.headers.get('set-cookie');
  console.log('✓ Admin login succeeded');


  // 3. Knowledge Base API tests (Admin only)
  const kbListRes = await request('/admin/knowledge', {
    headers: { Cookie: adminCookie },
  });
  assert.strictEqual(kbListRes.status, 200, 'Admin can list knowledge base');
  const kbList = (await kbListRes.json()).data;
  assert.strictEqual(kbList.length, 8, 'Knowledge base should have 8 seeded articles');
  console.log(`✓ Admin listed knowledge base (${kbList.length} articles)`);

  // 4. Knowledge article validation: rejecting published with <FILL IN>
  const badArticleRes = await request('/admin/knowledge', {
    method: 'POST',
    headers: { Cookie: adminCookie },
    body: JSON.stringify({
      title: 'Bad article with <FILL IN>',
      body: 'This has <FILL IN> placeholder content',
      category: 'general',
      published: true,
    }),
  });
  assert.strictEqual(
    badArticleRes.status,
    400,
    'Cannot publish article containing <FILL IN> placeholders'
  );
  console.log('✓ Rejected publishing article containing <FILL IN> placeholders');

  // 5. Test SSE chat stream as student
  console.log('Testing SSE stream POST /api/chat/stream ...');
  const streamRes = await fetch(`${BASE}/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: studentCookie,
    },
    body: JSON.stringify({
      message: 'The fan in Class 104 is not working, Academic Block',
      language: 'auto',
    }),
  });
  assert.strictEqual(streamRes.status, 200, 'Stream request should return 200');

  const reader = streamRes.body.getReader();
  const dec = new TextDecoder();
  let fullStreamText = '';
  let emittedCard = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = dec.decode(value);
    fullStreamText += chunk;

    const lines = chunk.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('event: card')) {
        const nextDataLine = lines[i + 1];
        if (nextDataLine && nextDataLine.startsWith('data: ')) {
          emittedCard = JSON.parse(nextDataLine.slice(6));
        }
      }
    }
  }

  assert.ok(fullStreamText.includes('event: delta'), 'Stream should emit delta events');
  assert.ok(fullStreamText.includes('event: done'), 'Stream should emit done event');
  assert.ok(emittedCard, 'Stream should emit a propose_report confirmation card');
  assert.strictEqual(emittedCard.type, 'report.create', 'Card type should be report.create');
  assert.strictEqual(emittedCard.status, 'pending', 'Card status should be pending');
  console.log(`✓ SSE Stream emitted delta, done, and card ${emittedCard.actionId}`);

  // 6. Test Confirmation guarantees (Section 9)
  // Check report count before confirmation
  const myReportsBefore = await request('/reports', {
    headers: { Cookie: studentCookie },
  });
  const beforeCount = (await myReportsBefore.json()).meta.total;

  // Confirm the action
  const confirmRes = await request(`/chat/actions/${emittedCard.actionId}/confirm`, {
    method: 'POST',
    headers: { Cookie: studentCookie },
    body: JSON.stringify({}),
  });
  assert.strictEqual(confirmRes.status, 200, 'Confirm endpoint should succeed');
  const confirmData = (await confirmRes.json()).data;
  assert.ok(confirmData.reportId, 'Confirm result should include reportId');
  console.log(`✓ Action confirmed successfully! Created ${confirmData.reportId}`);

  // Check report count after confirmation (must increase by 1)
  const myReportsAfter = await request('/reports', {
    headers: { Cookie: studentCookie },
  });
  const afterCount = (await myReportsAfter.json()).meta.total;
  assert.strictEqual(
    afterCount,
    beforeCount + 1,
    'Report count should increase by exactly 1 after confirmation'
  );
  console.log(`✓ Single-use guarantee: report count increased from ${beforeCount} to ${afterCount}`);


  // Replay attempt (second confirm must fail with 409)
  const replayRes = await request(`/chat/actions/${emittedCard.actionId}/confirm`, {
    method: 'POST',
    headers: { Cookie: studentCookie },
    body: JSON.stringify({}),
  });
  assert.strictEqual(replayRes.status, 409, 'Second confirm must return 409');
  console.log('✓ Replay protection guarantee: second confirm returned 409');

  // Other user attempt (must fail with 409)
  const otherUserRes = await request(`/chat/actions/${emittedCard.actionId}/confirm`, {
    method: 'POST',
    headers: { Cookie: adminCookie },
    body: JSON.stringify({}),
  });
  assert.strictEqual(otherUserRes.status, 409, 'Another user confirm must return 409');
  console.log('✓ Ownership guarantee: other user confirm returned 409');

  // 7. Verify GET /api/chat/current restores the conversation with confirmed status
  const currentRes = await request('/chat/current', {
    headers: { Cookie: studentCookie },
  });
  assert.strictEqual(currentRes.status, 200, 'GET /chat/current should return 200');
  const currentChat = (await currentRes.json()).data;
  assert.ok(currentChat.messages.length > 0, 'Current chat should have messages');
  const restoredCard = currentChat.messages
    .flatMap((m) => m.cards || [])
    .find((c) => c.actionId === emittedCard.actionId);
  assert.ok(restoredCard, 'Restored conversation must include the card');
  assert.strictEqual(restoredCard.status, 'confirmed', 'Restored card status must be confirmed');
  console.log('✓ Conversation restore guarantee: restored card is confirmed');

  console.log('\n========================================');
  console.log('ALL STAGE 1 VERIFICATION TESTS PASSED!');
  console.log('========================================');
}

run().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
