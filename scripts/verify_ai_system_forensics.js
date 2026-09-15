/**
 * Full AI System Forensic Audit & Regression Verification Suite
 */

const API_BASE = 'http://127.0.0.1:8000/api/v1';

async function request(url, options = {}) {
    options.headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Connection': 'close',
        ...(options.headers || {})
    };
    const res = await fetch(url, options);
    let data = null;
    try {
        data = await res.json();
    } catch {
        data = null;
    }
    return { status: res.status, headers: res.headers, data };
}

let passed = 0;
let failed = 0;

function assert(condition, message, details = '') {
    if (condition) {
        console.log(`  ✅ PASS: ${message}`);
        passed++;
    } else {
        console.error(`  ❌ FAIL: ${message} ${details ? '-> ' + details : ''}`);
        failed++;
    }
}

async function runTests() {
    console.log('================================================================');
    console.log('      FULL AI SYSTEM FORENSIC AUDIT & REGRESSION SUITE          ');
    console.log('================================================================\n');

    // 1. Authenticate Admin
    console.log('[1] Step 1: Admin Authentication...');
    const loginRes = await request(`${API_BASE}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email: 'john@acme.com', password: 'secret123' })
    });
    assert(loginRes.status === 200 && loginRes.data.token, 'Admin authenticated');
    const adminToken = loginRes.data.token;
    const orgAId = loginRes.data.organization?.id || loginRes.data.user?.organization_id;
    const headersA = { 'Authorization': `Bearer ${adminToken}` };

    // Seed test contact: Muhammad Okasha in Tenant A
    console.log('\n[2] Step 2: Seeding Test Contact: Muhammad Okasha in Tenant A...');
    const createContactRes = await request(`${API_BASE}/contacts`, {
        method: 'POST',
        headers: headersA,
        body: JSON.stringify({
            first_name: 'Muhammad',
            last_name: 'Okasha',
            email: 'okasha@acme-corp.com',
            phone: '+15550199',
            status: 'Hot',
            tags: ['VIP', 'Enterprise']
        })
    });
    assert(createContactRes.status === 201 && createContactRes.data.data?.id, 'Muhammad Okasha contact seeded in DB');
    const okashaId = createContactRes.data.data.id;

    // 3. Critical Regression 1: Search Existing Contact
    console.log('\n[3] Step 3: Critical Regression Test: Exact Contact Search Query...');
    console.log('    USER: "can you check for Muhammad Okasha in the contacts?"');
    const searchAiRes = await request(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: headersA,
        body: JSON.stringify({
            message: 'can you check for Muhammad Okasha in the contacts?',
            agentType: 'assistant'
        })
    });

    assert(searchAiRes.status === 200, 'AI Chat endpoint returned HTTP 200');
    assert(searchAiRes.data.intent_detected === 'CONTACT_SEARCH', 
        `Intent correctly detected as CONTACT_SEARCH (got: ${searchAiRes.data.intent_detected})`);
    
    const toolName = searchAiRes.data.tool_executed?.name || searchAiRes.data.toolExecuted?.name || searchAiRes.data.tool_executed?.toolName;
    assert(toolName === 'search_contacts', `Real tool 'search_contacts' was executed (got: ${toolName})`);
    
    const toolOutput = searchAiRes.data.tool_executed?.output || searchAiRes.data.toolExecuted?.output;
    assert(toolOutput && toolOutput.count >= 1, 'search_contacts tool returned matching database records');
    
    const reply = searchAiRes.data.reply || '';
    assert(reply.includes('Muhammad Okasha'), 'AI response explicitly mentions Muhammad Okasha');
    assert(!reply.toLowerCase().includes('order updates and shipping inquiries'), 
        'AI response does NOT contain generic order/shipping fallback text');
    console.log(`    AI Reply: "${reply.replace(/\n/g, ' ')}"`);

    // 4. Critical Regression 2: Search Non-Existent Contact
    console.log('\n[4] Step 4: Regression Test: Contact Not Found Handling...');
    console.log('    USER: "find John XYZ in contacts"');
    const notFoundAiRes = await request(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: headersA,
        body: JSON.stringify({
            message: 'find John XYZ in contacts',
            agentType: 'assistant'
        })
    });

    assert(notFoundAiRes.status === 200, 'AI Chat endpoint returned HTTP 200');
    assert(notFoundAiRes.data.intent_detected === 'CONTACT_SEARCH', 'Intent correctly detected as CONTACT_SEARCH');
    const notFoundReply = notFoundAiRes.data.reply || '';
    assert(notFoundReply.toLowerCase().includes('no matching') || notFoundReply.toLowerCase().includes('not found'), 
        'AI explicitly declared contact was not found without hallucinating data');
    console.log(`    AI Reply: "${notFoundReply}"`);

    // 5. Critical Regression 3: General Greeting
    console.log('\n[5] Step 5: Regression Test: Natural Greeting Handling...');
    console.log('    USER: "hello"');
    const helloRes = await request(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: headersA,
        body: JSON.stringify({
            message: 'hello',
            agentType: 'assistant'
        })
    });

    assert(helloRes.status === 200, 'AI Chat endpoint returned HTTP 200');
    assert(helloRes.data.intent_detected === 'GREETING', 'Intent detected as GREETING');
    assert(!helloRes.data.reply.toLowerCase().includes('order updates and shipping inquiries'), 
        'Greeting does NOT contain generic order fallback');

    // 6. Critical Regression 4: Context Switching (Order Inquiry -> Contact Lookup)
    console.log('\n[6] Step 6: Regression Test: Dynamic Multi-Turn Context Switching...');
    console.log('    Turn 1: "Where is my order #12345?"');
    const turn1Res = await request(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: headersA,
        body: JSON.stringify({
            message: 'Where is my order #12345?',
            agentType: 'support',
            history: []
        })
    });
    assert(turn1Res.data.intent_detected === 'ORDER_STATUS', 'Turn 1 recognized as ORDER_STATUS');
    assert(turn1Res.data.tool_executed?.name === 'get_order_status', 'Turn 1 executed get_order_status tool');

    console.log('    Turn 2: "can you check for Muhammad Okasha in the contacts?"');
    const turn2Res = await request(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: headersA,
        body: JSON.stringify({
            message: 'can you check for Muhammad Okasha in the contacts?',
            agentType: 'support', // previously in support mode
            history: [
                { role: 'user', content: 'Where is my order #12345?' },
                { role: 'assistant', content: turn1Res.data.reply }
            ]
        })
    });
    assert(turn2Res.data.intent_detected === 'CONTACT_SEARCH', 
        'Turn 2 successfully switched intent to CONTACT_SEARCH despite previous order turn');
    assert(turn2Res.data.tool_executed?.name === 'search_contacts', 
        'Turn 2 switched tool execution to search_contacts');
    assert(turn2Res.data.reply.includes('Muhammad Okasha'), 
        'Turn 2 returned contact information without retaining order bias');

    // 7. Critical Regression 5: Calendar Availability & Booking
    console.log('\n[7] Step 7: Regression Test: Calendar Availability & Booking...');
    const availRes = await request(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: headersA,
        body: JSON.stringify({
            message: 'What slots are available tomorrow?',
            agentType: 'appointment'
        })
    });
    assert(availRes.data.intent_detected === 'APPOINTMENT_AVAILABILITY', 'Intent detected as APPOINTMENT_AVAILABILITY');
    assert(availRes.data.tool_executed?.name === 'get_calendar_availability', 'Executed get_calendar_availability tool');
    assert(Array.isArray(availRes.data.tool_executed?.output?.available_slots), 'Returned dynamic available slots array');

    const bookRes = await request(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: headersA,
        body: JSON.stringify({
            message: 'Can you book me an appointment tomorrow for Sarah Connor at 10:00 AM?',
            agentType: 'appointment'
        })
    });
    assert(bookRes.data.intent_detected === 'APPOINTMENT_BOOK', 'Intent detected as APPOINTMENT_BOOK');
    assert(bookRes.data.tool_executed?.name === 'create_appointment', 'Executed create_appointment tool');
    assert(bookRes.data.tool_executed?.output?.success === true, 'Appointment was successfully persisted in database');

    // 8. Critical Regression 6: Task Creation
    console.log('\n[8] Step 8: Regression Test: Task Creation...');
    const taskRes = await request(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: headersA,
        body: JSON.stringify({
            message: 'Create a task for Muhammad Okasha to review the partnership agreement tomorrow',
            agentType: 'assistant'
        })
    });
    assert(taskRes.data.intent_detected === 'TASK_CREATE', 'Intent detected as TASK_CREATE');
    assert(taskRes.data.tool_executed?.name === 'create_task', 'Executed create_task tool');
    assert(taskRes.data.tool_executed?.output?.success === true, 'Task was created in database');

    // 9. Critical Regression 7: Opportunity Creation & Pipeline Report
    console.log('\n[9] Step 9: Regression Test: Opportunity & Pipeline Report...');
    const oppRes = await request(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: headersA,
        body: JSON.stringify({
            message: 'Create an opportunity for this contact',
            agentType: 'sales'
        })
    });
    assert(oppRes.data.intent_detected === 'OPPORTUNITY_CREATE', 'Intent detected as OPPORTUNITY_CREATE');
    assert(oppRes.data.tool_executed?.name === 'create_opportunity', 'Executed create_opportunity tool');

    const pipeReportRes = await request(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: headersA,
        body: JSON.stringify({
            message: 'Show me the pipeline report',
            agentType: 'sales'
        })
    });
    assert(pipeReportRes.data.intent_detected === 'PIPELINE_REPORT', 'Intent detected as PIPELINE_REPORT');
    assert(pipeReportRes.data.tool_executed?.name === 'pipeline_report', 'Executed pipeline_report tool');
    assert(typeof pipeReportRes.data.tool_executed?.output?.total_deals === 'number', 'Pipeline report returned numeric metrics');

    // 10. Critical Regression 8: Knowledge Grounding (RAG)
    console.log('\n[10] Step 10: Regression Test: Knowledge & Policy Grounding...');
    const policyRes = await request(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: headersA,
        body: JSON.stringify({
            message: 'What is our cancellation policy?',
            agentType: 'support'
        })
    });
    assert(policyRes.data.intent_detected === 'KNOWLEDGE_QUERY', 'Intent detected as KNOWLEDGE_QUERY');
    assert(policyRes.data.tool_executed?.name === 'search_knowledge' || policyRes.data.reply.length > 0, 
        'Knowledge search tool executed or policy response synthesized');

    // 11. Critical Regression 9: Cross-Tenant Boundary Enforcement
    console.log('\n[11] Step 11: Regression Test: Cross-Tenant AI Boundary Isolation...');
    const regRes = await request(`${API_BASE}/auth/register`, {
        method: 'POST',
        body: JSON.stringify({
            name: 'Competitor Admin',
            email: `tenant_b_${Date.now()}@competitor.com`,
            password: 'SecurePassword123!',
            organization_name: 'Competitor Corp'
        })
    });
    assert(regRes.status === 201 && regRes.data.token, 'Tenant B registered successfully');
    const tokenB = regRes.data.token;
    const headersB = { 'Authorization': `Bearer ${tokenB}` };

    // Tenant B asks to find Muhammad Okasha (who belongs ONLY to Tenant A)
    const tenantBSearchRes = await request(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: headersB,
        body: JSON.stringify({
            message: 'can you check for Muhammad Okasha in the contacts?',
            agentType: 'assistant'
        })
    });
    assert(tenantBSearchRes.status === 200, 'Tenant B query processed');
    const bCount = tenantBSearchRes.data.tool_executed?.output?.count ?? 0;
    assert(bCount === 0, `Tenant B contact search strictly isolated (expected count: 0, got: ${bCount})`);
    assert(tenantBSearchRes.data.reply.toLowerCase().includes('no matching') || tenantBSearchRes.data.reply.toLowerCase().includes('not found'),
        'Tenant B was told no matching contact was found in their organization');

    // 12. Regression Test 10: Conversation Message Endpoint AI Execution
    console.log('\n[12] Step 12: Regression Test: POST /conversations/{id}/messages AI Tool Execution...');
    const createConvRes = await request(`${API_BASE}/conversations`, {
        method: 'POST',
        headers: headersA,
        body: JSON.stringify({
            channel: 'web'
        })
    });
    assert(createConvRes.status === 201 && createConvRes.data.data?.id, 'Conversation created');
    const convId = createConvRes.data.data.id;

    const convMsgRes = await request(`${API_BASE}/conversations/${convId}/messages`, {
        method: 'POST',
        headers: headersA,
        body: JSON.stringify({
            content: 'can you check for Muhammad Okasha in the contacts?'
        })
    });
    assert(convMsgRes.status === 200, 'POST conversation message succeeded');
    const convReply = convMsgRes.data.data?.agentMessage?.content || convMsgRes.data.data?.orchestrator?.reply || '';
    assert(convReply.includes('Muhammad Okasha'), 'Conversation AI reply found Muhammad Okasha');
    assert(!convReply.toLowerCase().includes('order updates and shipping inquiries'), 
        'Conversation AI reply did NOT output generic order text');

    // -------------------------------------------------------------
    console.log('\n================================================================');
    console.log(`  AI FORENSIC VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED `);
    console.log('================================================================\n');

    if (failed > 0) {
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error('Test execution exception:', err);
    process.exit(1);
});
