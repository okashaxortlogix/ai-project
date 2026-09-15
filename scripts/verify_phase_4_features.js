/**
 * Automated Verification Suite for Phase 4 Missing Features Implementation
 * Tests:
 * - MISSING-001: Dynamic Smart Lists Engine (POST/GET/Filter)
 * - MISSING-011: Team Member Invitations & Role Delegation (Invite, List, Accept)
 * - MISSING-013: CSV Bulk Import & Export (Batch import & CSV streaming)
 * - MISSING-014: Two-Way Calendar Slot Synchronization & Interval Availability
 * - MISSING-015: Webhook Replay Protection (Stale timestamp rejection)
 */

const API_BASE = 'http://127.0.0.1:8000/api/v1';

async function request(url, options = {}) {
    const res = await fetch(url, {
        ...options,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    });
    const text = await res.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch {
        data = text;
    }
    return { status: res.status, ok: res.ok, data };
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✅ PASS: ${message}`);
        passed++;
    } else {
        console.error(`  ❌ FAIL: ${message}`);
        failed++;
    }
}

async function runTests() {
    console.log('=== PHASE 4 MISSING FEATURES VERIFICATION SUITE ===\n');

    // Step 1: Authenticate Admin
    console.log('[1] Authenticating Admin user (john@acme.com)...');
    const loginRes = await request(`${API_BASE}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email: 'john@acme.com', password: 'secret123' })
    });
    assert(loginRes.status === 200 && loginRes.data.token, 'Admin authenticated');
    const adminToken = loginRes.data.token;
    const adminOrgId = loginRes.data.user.organization_id;
    const adminHeaders = { 'Authorization': `Bearer ${adminToken}` };

    // Step 2: MISSING-001 - Smart Lists Engine
    console.log('\n[2] Testing MISSING-001: Dynamic CRM Smart Lists Engine...');
    const smartListRes = await request(`${API_BASE}/smart-lists`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
            name: 'Enterprise High Intent',
            entity_type: 'contact',
            filters: { status: 'Lead', min_score: 50 },
            columns: ['name', 'email', 'phone', 'score', 'tags']
        })
    });
    assert(smartListRes.status === 201 && smartListRes.data.data.id, 'Smart list created via POST /smart-lists');
    const smartListId = smartListRes.data.data.id;

    const listGetRes = await request(`${API_BASE}/smart-lists`, {
        method: 'GET',
        headers: adminHeaders
    });
    assert(listGetRes.status === 200 && Array.isArray(listGetRes.data.data) && listGetRes.data.data.length > 0,
        'Smart lists queried via GET /smart-lists');

    // Step 3: MISSING-011 - Team Member Invitations & Role Delegation
    console.log('\n[3] Testing MISSING-011: Team Member Invitations & Role Delegation Flow...');
    const inviteEmail = `rep_${Date.now()}@acmepartner.com`;
    const inviteRes = await request(`${API_BASE}/team/invite`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({ email: inviteEmail, role: 'Agent' })
    });
    assert(inviteRes.status === 201 && inviteRes.data.data.token, `Invitation created for ${inviteEmail}`);
    const inviteToken = inviteRes.data.data.token;

    const teamMembersRes = await request(`${API_BASE}/team/members`, {
        method: 'GET',
        headers: adminHeaders
    });
    assert(teamMembersRes.status === 200 && teamMembersRes.data.data.invitations.some(i => i.email === inviteEmail),
        'Pending invitation appears in team members query');

    // Invited user accepts invitation
    const acceptRes = await request(`${API_BASE}/team/accept-invite`, {
        method: 'POST',
        body: JSON.stringify({
            token: inviteToken,
            name: 'Alice Agent',
            password: 'NewAgentPassword123!'
        })
    });
    assert(acceptRes.status === 201 && acceptRes.data.token, 'Invitation accepted and account activated');

    // Step 4: MISSING-013 - CSV Bulk Import & Export Engine
    console.log('\n[4] Testing MISSING-013: CSV Bulk Import & Export Engine...');
    const testCsv = `first_name,last_name,email,phone,source,status,score,tags
BulkOne,Customer,bulk1_${Date.now()}@example.com,+1555001,Web,Lead,75,vip;imported
BulkTwo,Prospect,bulk2_${Date.now()}@example.com,+1555002,Partner,Qualified,90,enterprise`;

    const importRes = await request(`${API_BASE}/contacts/import`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({ csv_content: testCsv })
    });
    assert(importRes.status === 201 && importRes.data.data.imported >= 2,
        `CSV contacts imported successfully (${importRes.data.data.imported} records)`);

    const exportRes = await fetch(`${API_BASE}/contacts/export`, {
        method: 'GET',
        headers: adminHeaders
    });
    const exportText = await exportRes.text();
    assert(exportRes.status === 200 && exportText.includes('first_name') && exportText.includes('BulkOne'),
        'CSV export streamed valid CSV data containing imported contacts');

    // Step 5: MISSING-014 - Dynamic Calendar Slot Synchronization
    console.log('\n[5] Testing MISSING-014: Two-Way Calendar Slot Synchronization...');
    const calDate = `2027-08-${String((Date.now() % 25) + 1).padStart(2, '0')}`;
    // Book a slot
    await request(`${API_BASE}/appointments`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
            title: 'Dr. Appointment Sync Test',
            date: calDate,
            time: '10:00 AM',
            customer_name: 'Availability Tester'
        })
    });

    const availRes = await request(`${API_BASE}/appointments/availability?date=${calDate}`, {
        method: 'GET',
        headers: adminHeaders
    });
    assert(availRes.status === 200 && !availRes.data.available_slots.includes('10:00 AM'),
        'Booked time slot correctly removed from available slots');
    assert(availRes.data.booked_slots.includes('10:00 AM'),
        'Booked time slot appears in booked_slots list');

    // Step 6: MISSING-015 - Webhook Replay Attack Protection
    console.log('\n[6] Testing MISSING-015: Webhook Replay Attack Protection...');
    const crypto = await import('crypto');
    const webhookSecret = '2146';
    const rawPayload = JSON.stringify({ id: 888777, line_items: [] });
    const hmacSig = crypto.createHmac('sha256', webhookSecret).update(rawPayload).digest('base64');
    const staleTimestamp = Math.floor(Date.now() / 1000) - 600; // 10 minutes ago (> 300s window)

    const staleWebhookRes = await request(`${API_BASE}/webhooks/${adminOrgId}/woocommerce`, {
        method: 'POST',
        headers: {
            'X-WC-Webhook-Signature': hmacSig,
            'X-WC-Webhook-Topic': 'order.created',
            'X-WC-Webhook-Timestamp': String(staleTimestamp)
        },
        body: rawPayload
    });
    assert(staleWebhookRes.status === 401, 'Stale webhook delivery rejected by replay protection (HTTP 401)');

    console.log('\n=================================================');
    console.log(`PHASE 4 FEATURES VERIFICATION: ${passed} PASSED, ${failed} FAILED`);
    console.log('=================================================\n');

    process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
});
