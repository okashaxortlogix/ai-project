/**
 * Automated Regression & Forensic Verification Suite: Real-World AI Orchestration
 * Tests all 7 critical scenarios (A-G), 50+ assertions, multi-intent routing,
 * entity extraction hardening, zero-hallucination, and multi-tenant security.
 */

const API_BASE = 'http://127.0.0.1:8000/api/v1';

let passedChecks = 0;
let failedChecks = 0;

function assert(condition, message) {
    if (condition) {
        passedChecks++;
        console.log(`  ✅ [PASS] ${message}`);
    } else {
        failedChecks++;
        console.error(`  ❌ [FAIL] ${message}`);
    }
}

async function fetchJson(url, options = {}) {
    const res = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Connection': 'close',
            ...(options.headers || {})
        }
    });
    const text = await res.text();
    try {
        return { status: res.status, data: JSON.parse(text) };
    } catch {
        return { status: res.status, data: text };
    }
}

async function run() {
    console.log('================================================================');
    console.log('  AI REAL-WORLD REGRESSION & ORCHESTRATION VERIFICATION SUITE   ');
    console.log('================================================================\n');

    // 1. Authenticate Tenant A
    console.log('[Setup] Authenticating Tenant A...');
    const loginA = await fetchJson(`${API_BASE}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email: 'john@acme.com', password: 'secret123' })
    });
    assert(loginA.status === 200 && loginA.data.token, 'Tenant A login successful');
    const tokenA = loginA.data.token;
    const orgIdA = loginA.data.organization?.id || loginA.data.user?.organization_id;

    // 2. Register / Authenticate Tenant B
    console.log('[Setup] Registering Tenant B...');
    const regB = await fetchJson(`${API_BASE}/auth/register`, {
        method: 'POST',
        body: JSON.stringify({
            name: 'Tenant B Admin',
            email: `tenant_b_${Date.now()}@isolated.com`,
            password: 'SecurePassword123!',
            organization_name: 'Tenant B Isolated Corp'
        })
    });
    assert(regB.status === 201 && regB.data.token, 'Tenant B registered successfully');
    const tokenB = regB.data.token;

    // -------------------------------------------------------------
    // TEST A: Greeting
    // -------------------------------------------------------------
    console.log('\n--- TEST A: Greeting ("hello") ---');
    const resA = await fetchJson(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: JSON.stringify({ message: 'hello' })
    });
    assert(resA.status === 200, 'HTTP 200 response');
    assert(resA.data.intent_detected === 'GREETING', 'Intent detected as GREETING');
    assert(resA.data.tool_executed === null, 'No tool executed on greeting');
    assert(typeof resA.data.reply === 'string' && resA.data.reply.length > 5, 'Natural greeting returned');
    assert(!resA.data.reply.includes('Order #'), 'Greeting contains no order text');

    // -------------------------------------------------------------
    // TEST B: Contact Search ("Find Muhammad Okasha in contacts.")
    // -------------------------------------------------------------
    console.log('\n--- TEST B: Contact Search ("Find Muhammad Okasha in contacts.") ---');
    const resB = await fetchJson(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: JSON.stringify({ message: 'Find Muhammad Okasha in contacts.' })
    });
    assert(resB.status === 200, 'HTTP 200 response');
    assert(resB.data.intent_detected === 'CONTACT_SEARCH', 'Intent detected as CONTACT_SEARCH');
    assert(resB.data.tool_executed?.toolName === 'search_contacts', 'Tool search_contacts executed');
    assert(resB.data.tool_executed?.output?.count >= 1, 'Records found in database');
    assert(resB.data.reply.includes('Muhammad Okasha'), 'AI response mentions Muhammad Okasha');
    assert(!resB.data.reply.includes('order'), 'Response has zero order/shipping text');
    if (resB.data.tool_executed?.output?.count > 1) {
        assert(resB.data.reply.includes('• Muhammad Okasha'), 'Multiple distinct records formatted in reply');
        assert(resB.data.reply.includes('[ID:'), 'Distinct record IDs displayed for duplicate DB rows');
    }

    // Negative Contact Search
    console.log('    [Negative] "find John NonexistentPerson in contacts"');
    const resBNeg = await fetchJson(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: JSON.stringify({ message: 'find John NonexistentPerson in contacts' })
    });
    assert(resBNeg.data.intent_detected === 'CONTACT_SEARCH', 'Negative query detected as CONTACT_SEARCH');
    assert(resBNeg.data.tool_executed?.toolName === 'search_contacts', 'search_contacts executed for negative check');
    assert(resBNeg.data.tool_executed?.output?.count === 0, '0 records returned for nonexistent contact');
    assert(resBNeg.data.reply.includes('no matching contact record was found'), 'Truthful not found message returned');

    // -------------------------------------------------------------
    // TEST C: Contact Creation & Entity Extraction ("Ali Khan")
    // -------------------------------------------------------------
    console.log('\n--- TEST C: Contact Creation ("Create a contact named Ali Khan.") ---');
    const resC1 = await fetchJson(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: JSON.stringify({ message: 'Create a contact named Ali Khan.' })
    });
    assert(resC1.status === 200, 'HTTP 200 response');
    assert(resC1.data.intent_detected === 'CONTACT_CREATE', 'Intent detected as CONTACT_CREATE');
    assert(resC1.data.tool_executed?.toolName === 'create_contact', 'Tool create_contact executed');
    const cData1 = resC1.data.tool_executed?.output?.data;
    assert(cData1?.first_name === 'Ali', 'first_name is exactly "Ali" (NOT "d Ali")');
    assert(cData1?.last_name === 'Khan', 'last_name is exactly "Khan"');
    assert(resC1.data.reply.includes('Ali Khan'), 'Response confirms Ali Khan');

    // Test C2: Ahmed Raza
    console.log('    [Entity Extraction] "Create a contact named Ahmed Raza."');
    const resC2 = await fetchJson(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: JSON.stringify({ message: 'Create a contact named Ahmed Raza.' })
    });
    assert(resC2.data.tool_executed?.output?.data?.first_name === 'Ahmed', 'first_name is "Ahmed"');
    assert(resC2.data.tool_executed?.output?.data?.last_name === 'Raza', 'last_name is "Raza"');

    // Test C3: John Smith
    console.log('    [Entity Extraction] "Create a contact named John Smith."');
    const resC3 = await fetchJson(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: JSON.stringify({ message: 'Create a contact named John Smith.' })
    });
    assert(resC3.data.tool_executed?.output?.data?.first_name === 'John', 'first_name is "John"');
    assert(resC3.data.tool_executed?.output?.data?.last_name === 'Smith', 'last_name is "Smith"');

    // Test C4: Compound 3-part name "Muhammad Ali Khan"
    console.log('    [Entity Extraction] "Create a contact named Muhammad Ali Khan."');
    const resC4 = await fetchJson(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: JSON.stringify({ message: 'Create a contact named Muhammad Ali Khan.' })
    });
    assert(resC4.data.tool_executed?.output?.data?.first_name === 'Muhammad Ali', 'Compound first_name is "Muhammad Ali"');
    assert(resC4.data.tool_executed?.output?.data?.last_name === 'Khan', 'Compound last_name is "Khan"');

    // -------------------------------------------------------------
    // TEST D: Multi-Intent Request
    // -------------------------------------------------------------
    console.log('\n--- TEST D: Multi-Intent ("What opportunities does Muhammad Okasha have? Create a task for Muhammad Okasha.") ---');
    const resD = await fetchJson(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: JSON.stringify({ message: 'What opportunities does Muhammad Okasha have? Create a task for Muhammad Okasha.' })
    });
    assert(resD.status === 200, 'HTTP 200 response');
    assert(resD.data.intent_detected === 'MULTI_INTENT', 'Intent detected as MULTI_INTENT');
    assert(Array.isArray(resD.data.tools_executed) && resD.data.tools_executed.length === 2, 'Exactly 2 tools executed for multi-intent');
    
    const toolNames = resD.data.tools_executed.map(t => t.toolName || t.name);
    assert(toolNames.includes('search_opportunities'), 'Executed tool: search_opportunities');
    assert(toolNames.includes('create_task'), 'Executed tool: create_task');
    assert(!toolNames.includes('create_opportunity'), 'NEVER executed create_opportunity');

    assert(resD.data.reply.includes('Muhammad Okasha'), 'Reply references Muhammad Okasha');
    assert(resD.data.reply.includes('task'), 'Reply references created task');

    // -------------------------------------------------------------
    // TEST E: Opportunity Search
    // -------------------------------------------------------------
    console.log('\n--- TEST E: Opportunity Search ("What opportunities does Muhammad Okasha have?") ---');
    const resE = await fetchJson(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: JSON.stringify({ message: 'What opportunities does Muhammad Okasha have?' })
    });
    assert(resE.status === 200, 'HTTP 200 response');
    assert(resE.data.intent_detected === 'OPPORTUNITY_SEARCH', 'Intent detected as OPPORTUNITY_SEARCH');
    assert(resE.data.tool_executed?.toolName === 'search_opportunities', 'Tool search_opportunities executed');
    assert(!resE.data.reply.includes('I am your AI Business Assistant'), 'No generic assistant fallback');
    assert(resE.data.reply.includes('Muhammad Okasha'), 'Explicitly addresses Muhammad Okasha');

    // -------------------------------------------------------------
    // TEST F: Company Lead Search
    // -------------------------------------------------------------
    console.log('\n--- TEST F: Company Lead Search ("Find all leads from this company.") ---');
    // F1: Without company in context
    const resF1 = await fetchJson(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: JSON.stringify({ message: 'Find all leads from this company.' })
    });
    assert(resF1.status === 200, 'HTTP 200 response');
    assert(resF1.data.intent_detected === 'COMPANY_LEADS', 'Intent detected as COMPANY_LEADS');
    assert(resF1.data.reply.includes('Which company would you like me to search?'), 'Prompts user for company name when unspecified');
    assert(!resF1.data.reply.includes('I am your AI Business Assistant'), 'No generic assistant fallback');

    // F2: With explicit company name
    console.log('    [Explicit Company] "Find all leads from Acme Corp"');
    const resF2 = await fetchJson(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: JSON.stringify({ message: 'Find all leads from Acme Corp' })
    });
    assert(resF2.data.tool_executed?.toolName === 'search_leads', 'Tool search_leads executed');
    assert(resF2.data.reply.includes('Acme Corp'), 'Mentions Acme Corp in response');

    // -------------------------------------------------------------
    // TEST G: Conversation Summary
    // -------------------------------------------------------------
    console.log('\n--- TEST G: Conversation Summary ("Summarize this customer\'s conversation.") ---');
    // G1: Without active conversation
    const resG1 = await fetchJson(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: JSON.stringify({ message: "Summarize this customer's conversation." })
    });
    assert(resG1.status === 200, 'HTTP 200 response');
    assert(resG1.data.intent_detected === 'CONVERSATION_SUMMARY', 'Intent detected as CONVERSATION_SUMMARY');
    assert(resG1.data.reply.includes('Which customer or conversation would you like me to summarize?'), 'Prompts for conversation when missing');
    assert(!resG1.data.reply.includes('I am your AI Business Assistant'), 'No generic assistant fallback');

    // G2: With valid conversation
    const convList = await fetchJson(`${API_BASE}/conversations`, {
        headers: { Authorization: `Bearer ${tokenA}` }
    });
    const convId = convList.data?.data?.[0]?.id;
    if (convId) {
        // Post message into conversation so there is message content
        await fetchJson(`${API_BASE}/conversations/${convId}/messages`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${tokenA}` },
            body: JSON.stringify({ content: "Hello, I am inquiring about our enterprise software subscription terms." })
        });

        console.log(`    [With Active Conversation ${convId}]`);
        const resG2 = await fetchJson(`${API_BASE}/ai/chat`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${tokenA}` },
            body: JSON.stringify({
                conversation_id: convId,
                message: "Summarize this customer's conversation."
            })
        });
        assert(resG2.data.tool_executed?.toolName === 'summarize_conversation', 'Tool summarize_conversation executed');
        assert(resG2.data.reply.includes('Conversation summary') || resG2.data.reply.includes('summary') || resG2.data.reply.includes('messages'), 'Returned factual summary');
    }

    // -------------------------------------------------------------
    // TEST H: Appointments
    // -------------------------------------------------------------
    console.log('\n--- TEST H: Appointments (Availability & Booking) ---');
    const resH1 = await fetchJson(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: JSON.stringify({ message: 'What appointment openings are available tomorrow?' })
    });
    assert(resH1.data.intent_detected === 'APPOINTMENT_AVAILABILITY', 'Intent is APPOINTMENT_AVAILABILITY');
    assert(resH1.data.tool_executed?.toolName === 'get_calendar_availability', 'Executed get_calendar_availability');
    assert(resH1.data.reply.includes('Available appointment openings'), 'Returns open time slots');

    const resH2 = await fetchJson(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: JSON.stringify({ message: 'Book an appointment for tomorrow at 10:00 AM for Jane Doe' })
    });
    assert(resH2.data.intent_detected === 'APPOINTMENT_BOOK', 'Intent is APPOINTMENT_BOOK');
    assert(resH2.data.tool_executed?.toolName === 'create_appointment', 'Executed create_appointment');
    assert(resH2.data.reply.includes('confirmed'), 'Confirmed appointment booking');

    // -------------------------------------------------------------
    // TEST I: Context Switching (Orders -> CRM)
    // -------------------------------------------------------------
    console.log('\n--- TEST I: Dynamic Context Switching ---');
    console.log('    Turn 1: "Where is my order #12345?"');
    const turn1 = await fetchJson(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: JSON.stringify({ message: 'Where is my order #12345?' })
    });
    assert(turn1.data.intent_detected === 'ORDER_STATUS', 'Turn 1 is ORDER_STATUS');

    console.log('    Turn 2: "Find Muhammad Okasha in contacts."');
    const turn2 = await fetchJson(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: JSON.stringify({
            message: 'Find Muhammad Okasha in contacts.',
            history: [{ role: 'user', content: 'Where is my order #12345?' }, { role: 'assistant', content: turn1.data.reply }]
        })
    });
    assert(turn2.data.intent_detected === 'CONTACT_SEARCH', 'Turn 2 dynamically switched to CONTACT_SEARCH');
    assert(turn2.data.tool_executed?.toolName === 'search_contacts', 'Executed search_contacts on turn 2');
    assert(!turn2.data.reply.includes('order'), 'Turn 2 has no lingering order bias');

    // -------------------------------------------------------------
    // TEST J: Tenant Isolation
    // -------------------------------------------------------------
    console.log('\n--- TEST J: Strict Multi-Tenant Boundary Isolation ---');
    const resJ = await fetchJson(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenB}` },
        body: JSON.stringify({ message: 'Find Muhammad Okasha in contacts.' })
    });
    assert(resJ.status === 200, 'HTTP 200 response');
    assert(resJ.data.tool_executed?.toolName === 'search_contacts', 'Tool executed under Tenant B context');
    assert(resJ.data.tool_executed?.output?.count === 0, 'Tenant B cannot see Tenant A contacts (0 returned)');
    assert(resJ.data.reply.includes('no matching contact record was found'), 'Truthful not found reported to Tenant B');

    // -------------------------------------------------------------
    // SUMMARY REPORT
    // -------------------------------------------------------------
    console.log('\n================================================================');
    console.log(`TOTAL CHECKS: ${passedChecks + failedChecks}`);
    console.log(`PASSED: ${passedChecks}`);
    console.log(`FAILED: ${failedChecks}`);
    console.log('================================================================\n');

    if (failedChecks > 0) {
        process.exit(1);
    }
}

run().catch(err => {
    console.error('Fatal execution error:', err);
    process.exit(1);
});
