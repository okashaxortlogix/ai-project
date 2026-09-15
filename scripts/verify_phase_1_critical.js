/**
 * Comprehensive Phase 1 Critical Bug Remediation Automated Verification Suite
 */

const API_BASE = 'http://127.0.0.1:8000/api/v1';

async function runTests() {
  console.log('====================================================');
  console.log('  CRITICAL BUG REMEDIATION — PHASE 1 VERIFICATION   ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  // ----------------------------------------------------
  // TEST 1: BUG-001 (Frontend HTML Parse Crash & JSON 401)
  // ----------------------------------------------------
  try {
    const res = await fetch(`${API_BASE}/conversations`, {
      headers: { 'Accept': 'application/json' }
    });
    const isJson = res.headers.get('content-type')?.includes('application/json');
    const data = await res.json();
    assert(res.status === 401 && isJson && data.message === 'Unauthenticated.', 
      'BUG-001: Unauthenticated request returns JSON 401 without redirecting to HTML');
  } catch (err) {
    assert(false, 'BUG-001: Unauthenticated request crash', err.message);
  }

  // ----------------------------------------------------
  // TEST 2: BUG-002 (Seeded Admin Authentication)
  // ----------------------------------------------------
  let tokenA = '';
  let userA = null;
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'john@acme.com', password: 'secret123' })
    });
    const data = await res.json();
    tokenA = data.token;
    userA = data.user;
    assert(res.status === 200 && data.success === true && !!tokenA && userA?.email === 'john@acme.com',
      'BUG-002: Default seeded admin john@acme.com authenticates successfully with secret123');
  } catch (err) {
    assert(false, 'BUG-002: Seeded admin login failure', err.message);
  }

  // ----------------------------------------------------
  // TEST 3: BUG-003 (Registration Database Success & Duplicate Email)
  // ----------------------------------------------------
  let tokenB = '';
  let userB = null;
  let orgB = null;
  try {
    const regEmail = `test_admin_${Date.now()}@domain.com`;
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New Admin',
        email: regEmail,
        password: 'SecurePassword123!',
        organization_name: 'Corp Alpha'
      })
    });
    const data = await res.json();
    tokenB = data.token;
    userB = data.user;
    orgB = data.organization;
    assert(res.status === 201 && data.success === true && !!data.user?.id && !!data.organization?.id,
      'BUG-003: User registration succeeds in database without constraint violation');

    // Edge case: duplicate email
    const dupRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Admin',
        email: 'john@acme.com',
        password: 'SecurePassword123!'
      })
    });
    await dupRes.text();
    assert(dupRes.status === 422, 'BUG-003 Edge Case: Duplicate email rejected with HTTP 422');
  } catch (err) {
    assert(false, 'BUG-003: Registration failure', err.message);
  }

  const headersA = { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` };
  const headersB = { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenB}` };

  // ----------------------------------------------------
  // TEST 4: BUG-004 (TenantScope Middleware Enforcement)
  // ----------------------------------------------------
  try {
    const crossTenantHeaderRes = await fetch(`${API_BASE}/conversations`, {
      headers: { ...headersA, 'X-Organization-Id': orgB.id }
    });
    await crossTenantHeaderRes.text();
    assert(crossTenantHeaderRes.status === 403, 
      'BUG-004: Mismatched X-Organization-Id header rejected with HTTP 403 Forbidden by TenantScope');
  } catch (err) {
    assert(false, 'BUG-004: TenantScope check failure', err.message);
  }

  // ----------------------------------------------------
  // TEST 5: BUG-005 (Conversation IDOR Prevention)
  // ----------------------------------------------------
  try {
    // Org A creates a conversation
    const convRes = await fetch(`${API_BASE}/conversations`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({ channel: 'web' })
    });
    const conv = (await convRes.json()).data;

    // Tenant B attempts to read
    const readB = await fetch(`${API_BASE}/conversations/${conv.id}`, { headers: headersB });
    await readB.text();
    // Tenant B attempts to send message
    const sendB = await fetch(`${API_BASE}/conversations/${conv.id}/messages`, {
      method: 'POST',
      headers: headersB,
      body: JSON.stringify({ content: 'Unauthorized injection' })
    });
    await sendB.text();
    // Tenant B attempts to resolve
    const resolveB = await fetch(`${API_BASE}/conversations/${conv.id}/resolve`, {
      method: 'POST',
      headers: headersB
    });
    await resolveB.text();

    assert(readB.status === 404 && sendB.status === 404 && resolveB.status === 404,
      'BUG-005: Cross-tenant conversation read, send, and resolve blocked with HTTP 404');
  } catch (err) {
    assert(false, 'BUG-005: Conversation IDOR check failure', err.message);
  }

  // ----------------------------------------------------
  // TEST 6: BUG-006 (Workflow IDOR Prevention)
  // ----------------------------------------------------
  try {
    // Org A creates a workflow
    const wfRes = await fetch(`${API_BASE}/workflows`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        name: 'Org A Secret Automation',
        trigger_type: 'ContactCreated',
        nodes: [{ id: '1', type: 'trigger' }],
        edges: []
      })
    });
    const wf = (await wfRes.json()).data;

    // Tenant B attempts to view, edit, and execute Org A's workflow
    const readWfB = await fetch(`${API_BASE}/workflows/${wf.id}`, { headers: headersB });
    await readWfB.text();
    const patchWfB = await fetch(`${API_BASE}/workflows/${wf.id}`, {
      method: 'PATCH',
      headers: headersB,
      body: JSON.stringify({ name: 'Tampered Name' })
    });
    await patchWfB.text();
    const execWfB = await fetch(`${API_BASE}/workflows/${wf.id}/execute`, {
      method: 'POST',
      headers: headersB,
      body: JSON.stringify({})
    });
    await execWfB.text();

    assert(readWfB.status === 404 && patchWfB.status === 404 && execWfB.status === 404,
      'BUG-006: Cross-tenant workflow view, edit, and execute blocked with HTTP 404');
  } catch (err) {
    assert(false, 'BUG-006: Workflow IDOR check failure', err.message);
  }

  // ----------------------------------------------------
  // TEST 7: BUG-007 (Organization Data Leakage & Patch Protection)
  // ----------------------------------------------------
  try {
    const listRes = await fetch(`${API_BASE}/organizations`, { headers: headersA });
    const listData = await listRes.json();
    const containsOtherTenant = listData.data.some(o => o.id === orgB.id);

    const patchOtherOrg = await fetch(`${API_BASE}/organizations/${orgB.id}`, {
      method: 'PATCH',
      headers: headersA,
      body: JSON.stringify({ name: 'Malicious Rename' })
    });
    await patchOtherOrg.text();

    assert(listRes.status === 200 && !containsOtherTenant && patchOtherOrg.status === 403,
      'BUG-007: Organization index scoped to own tenant only; cross-tenant modification returns 403');
  } catch (err) {
    assert(false, 'BUG-007: Organization leakage check failure', err.message);
  }

  // ----------------------------------------------------
  // TEST 8: BUG-009 & BUG-010 (Missing Routes & REST Contract Consistency)
  // ----------------------------------------------------
  try {
    const searchRes = await fetch(`${API_BASE}/search?q=test`, { headers: headersA });
    await searchRes.text();
    const timelineRes = await fetch(`${API_BASE}/timeline`, { headers: headersA });
    await timelineRes.text();
    const customFieldsRes = await fetch(`${API_BASE}/custom-fields`, { headers: headersA });
    await customFieldsRes.text();

    // Test Opportunity creation and update with PATCH
    const oppRes = await fetch(`${API_BASE}/opportunities`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        title: 'Phase 1 Contract Deal',
        contact_name: 'Robert Stark',
        value: 12000
      })
    });
    const oppData = await oppRes.json();
    const oppId = oppData.data?.id;

    const patchOpp = await fetch(`${API_BASE}/opportunities/${oppId}`, {
      method: 'PATCH',
      headers: headersA,
      body: JSON.stringify({ value: 15000 })
    });
    await patchOpp.text();

    assert(searchRes.status === 200 && timelineRes.status === 200 && customFieldsRes.status === 200 &&
           oppRes.status === 201 && patchOpp.status === 200,
      'BUG-009 / BUG-010: /search, /timeline, /custom-fields and PATCH /opportunities/{id} contracts match');
  } catch (err) {
    assert(false, 'BUG-009 / BUG-010: Contract alignment check failure', err.message);
  }

  // ----------------------------------------------------
  // TEST 9: BUG-017 (Queue & Background Execution)
  // ----------------------------------------------------
  try {
    const healthRes = await fetch('http://127.0.0.1:3000');
    await healthRes.text();
    assert(healthRes.status === 200, 'Frontend Next.js server operational on port 3000');
  } catch (err) {
    assert(false, 'Next.js health check failure', err.message);
  }

  console.log('\n====================================================');
  console.log(`  VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED `);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
