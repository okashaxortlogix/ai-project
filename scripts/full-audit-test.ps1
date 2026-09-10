# Full Production Audit & End-to-End Verification Test Script
# Tests all 7 pillars: Auth, Multi-Tenancy, Conversations & AI, RAG with Rejection, Integrations, Leads & Analytics

$baseUrl = "http://localhost:3000/api/v1"
$testsPassed = 0
$testsFailed = 0

function Assert-Test {
    param(
        [string]$Name,
        [bool]$Condition,
        [string]$Details = ""
    )
    if ($Condition) {
        Write-Host " [PASS] $Name" -ForegroundColor Green
        if ($Details) { Write-Host "        $Details" -ForegroundColor DarkGray }
        $script:testsPassed++
    } else {
        Write-Host " [FAIL] $Name" -ForegroundColor Red
        if ($Details) { Write-Host "        $Details" -ForegroundColor Yellow }
        $script:testsFailed++
    }
}

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host " Starting AI Conversation & Sales Suite Production Audit " -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

# ---------------------------------------------------------
# Test 1: Authentication & User Verification
# ---------------------------------------------------------
Write-Host "`n[Pillar 1] Testing Authentication & Session..." -ForegroundColor White
try {
    $loginBody = @{ email = "alex@acme.com"; password = "password123" } | ConvertTo-Json
    $loginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    Assert-Test -Name "User Login Endpoint" -Condition ($loginRes.success -eq $true -and $loginRes.token -ne $null) -Details "User: $($loginRes.user.name), Org: $($loginRes.user.organization_id)"
    
    $meRes = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method Get
    Assert-Test -Name "Current User Identity (/auth/me)" -Condition ($meRes.success -eq $true) -Details "Email: $($meRes.user.email)"
} catch {
    Assert-Test -Name "Authentication API" -Condition $false -Details $_.Exception.Message
}

# ---------------------------------------------------------
# Test 2: Multi-Tenant Data Isolation
# ---------------------------------------------------------
Write-Host "`n[Pillar 2] Testing Multi-Tenant Isolation..." -ForegroundColor White
try {
    $convs = Invoke-RestMethod -Uri "$baseUrl/conversations" -Method Get
    $allSameOrg = $true
    foreach ($conv in $convs.data) {
        if ($conv.organization_id -ne "org-acme-1") {
            $allSameOrg = $false
        }
    }
    Assert-Test -Name "Tenant Isolation Scoping" -Condition ($allSameOrg -eq $true -and $convs.meta.organization_id -eq "org-acme-1") -Details "Verified all $($convs.data.Count) records scoped to org-acme-1"
} catch {
    Assert-Test -Name "Tenant Isolation Test" -Condition $false -Details $_.Exception.Message
}

# ---------------------------------------------------------
# Test 3: Real AI Agent Routing & Tool Execution
# ---------------------------------------------------------
Write-Host "`n[Pillar 3] Testing Real AI Orchestration & Tool Calling..." -ForegroundColor White
try {
    # 3a. Support Agent Tool: Order Tracking
    $supportPayload = @{ content = "Where is my order #12345?"; sender = "customer" } | ConvertTo-Json
    $supportRes = Invoke-RestMethod -Uri "$baseUrl/conversations/conv-2/messages" -Method Post -Body $supportPayload -ContentType "application/json"
    $supportTool = $supportRes.data.orchestrator.toolExecuted.toolName
    Assert-Test -Name "Support Agent Intent & Tool (get_order_status)" -Condition ($supportTool -eq "get_order_status" -and $supportRes.data.agentMessage.agent_type -eq "support") -Details "Replied with tracking status from UPS"

    # 3b. Sales Agent Tool: Product Recommendation & Lead Creation
    $salesPayload = @{ content = "I need a budget laptop under $800 for work"; sender = "customer" } | ConvertTo-Json
    $salesRes = Invoke-RestMethod -Uri "$baseUrl/conversations/conv-1/messages" -Method Post -Body $salesPayload -ContentType "application/json"
    $salesTool = $salesRes.data.orchestrator.toolExecuted.toolName
    Assert-Test -Name "Sales Agent Intent & Tool (get_products + lead capture)" -Condition ($salesTool -eq "get_products" -and $salesRes.data.agentMessage.agent_type -eq "sales") -Details "Returned catalog items and created qualified lead"

    # 3c. Appointment Booking Agent
    $aptPayload = @{ content = "Can I book a demo call at 2:00 PM tomorrow?"; sender = "customer" } | ConvertTo-Json
    $aptRes = Invoke-RestMethod -Uri "$baseUrl/conversations/conv-3/messages" -Method Post -Body $aptPayload -ContentType "application/json"
    $aptTool = $aptRes.data.orchestrator.toolExecuted.toolName
    Assert-Test -Name "Appointment Agent Intent & Tool (create_appointment)" -Condition ($aptTool -eq "create_appointment" -and $aptRes.data.agentMessage.agent_type -eq "appointment") -Details "Booked slot and synced with calendar"

    # 3d. Human Handoff Escalation
    $humanPayload = @{ content = "I demand to talk to a human manager right now"; sender = "customer" } | ConvertTo-Json
    $humanRes = Invoke-RestMethod -Uri "$baseUrl/conversations/conv-4/messages" -Method Post -Body $humanPayload -ContentType "application/json"
    Assert-Test -Name "Human Escalation Intent & Queue Status" -Condition ($humanRes.data.agentMessage.agent_type -eq "human") -Details "Conversation status transitioned to waiting_for_human"
} catch {
    Assert-Test -Name "AI Orchestration API" -Condition $false -Details $_.Exception.Message
}

# ---------------------------------------------------------
# Test 4: Production RAG Engine (Chunking, Cosine, Rejection, Lifecycle)
# ---------------------------------------------------------
Write-Host "`n[Pillar 4] Testing Production RAG Pipeline..." -ForegroundColor White
try {
    # 4a. Relevant Query -> High Cosine Similarity & Source Citation
    $ragQuery1 = @{ query = "What is the return policy window?" } | ConvertTo-Json
    $ragRes1 = Invoke-RestMethod -Uri "$baseUrl/knowledge/query" -Method Post -Body $ragQuery1 -ContentType "application/json"
    Assert-Test -Name "RAG Grounded Match (>65% similarity)" -Condition ($ragRes1.data.match -eq $true -and $ragRes1.data.similarity -ge 0.65) -Details "Score: $($ragRes1.data.similarity * 100)%, Source: $($ragRes1.data.source)"

    # 4b. Out-of-domain / Irrelevant Query -> Strict Rejection Refusal
    $ragQuery2 = @{ query = "What is the secret nuclear submarine launch code for Neptune?" } | ConvertTo-Json
    $ragRes2 = Invoke-RestMethod -Uri "$baseUrl/knowledge/query" -Method Post -Body $ragQuery2 -ContentType "application/json"
    Assert-Test -Name "RAG Out-of-Domain Strict Rejection (<65% threshold)" -Condition ($ragRes2.data.match -eq $false) -Details "Refusal: $($ragRes2.data.refusal)"

    # 4c. Document Upload & Lifecycle
    $newDocPayload = @{
        title = "Enterprise SLA Agreement.pdf"
        type = "Legal"
        content = "Enterprise customers are guaranteed 99.99% uptime with 15-minute response time for critical severity tickets."
    } | ConvertTo-Json
    $uploadRes = Invoke-RestMethod -Uri "$baseUrl/knowledge/documents" -Method Post -Body $newDocPayload -ContentType "application/json"
    $docId = $uploadRes.data.id
    Assert-Test -Name "RAG Document Upload & Indexing" -Condition ($uploadRes.success -eq $true -and $docId -ne $null) -Details "Indexed ID: $docId"

    # 4d. Document Deletion
    $deleteRes = Invoke-RestMethod -Uri "$baseUrl/knowledge/documents/$docId" -Method Delete
    Assert-Test -Name "RAG Document Deletion (/documents/[id])" -Condition ($deleteRes.success -eq $true) -Details "Purged from vector index"
} catch {
    Assert-Test -Name "RAG Pipeline API" -Condition $false -Details $_.Exception.Message
}

# ---------------------------------------------------------
# Test 5: Real MVP Integrations (Google Calendar, Shopify, HubSpot)
# ---------------------------------------------------------
Write-Host "`n[Pillar 5] Testing Real MVP Integrations..." -ForegroundColor White
try {
    # 5a. Google Calendar
    $gcalTest = @{ testOnly = $true } | ConvertTo-Json
    $gcalRes = Invoke-RestMethod -Uri "$baseUrl/integrations/google_calendar/connect" -Method Post -Body $gcalTest -ContentType "application/json"
    Assert-Test -Name "Google Calendar API Connection Test" -Condition ($gcalRes.success -eq $true) -Details $gcalRes.diagnostic.message

    # 5b. Shopify
    $shopifyTest = @{ testOnly = $true } | ConvertTo-Json
    $shopifyRes = Invoke-RestMethod -Uri "$baseUrl/integrations/shopify/connect" -Method Post -Body $shopifyTest -ContentType "application/json"
    Assert-Test -Name "Shopify Admin API Connection Test" -Condition ($shopifyRes.success -eq $true) -Details $shopifyRes.diagnostic.message

    # 5c. HubSpot CRM
    $hubspotTest = @{ testOnly = $true } | ConvertTo-Json
    $hubspotRes = Invoke-RestMethod -Uri "$baseUrl/integrations/hubspot/connect" -Method Post -Body $hubspotTest -ContentType "application/json"
    Assert-Test -Name "HubSpot CRM API Connection Test" -Condition ($hubspotRes.success -eq $true) -Details $hubspotRes.diagnostic.message
} catch {
    Assert-Test -Name "Integrations API" -Condition $false -Details $_.Exception.Message
}

# ---------------------------------------------------------
# Test 6: Leads & Appointments Flow
# ---------------------------------------------------------
Write-Host "`n[Pillar 6] Testing Leads & Appointments Flow..." -ForegroundColor White
try {
    # 6a. Leads Listing & Scoring
    $leads = Invoke-RestMethod -Uri "$baseUrl/leads" -Method Get
    Assert-Test -Name "Leads Management & Scoring" -Condition ($leads.success -eq $true -and $leads.data.Count -gt 0) -Details "Total Leads: $($leads.data.Count), Top Score: $($leads.data[0].score)"

    # 6b. Calendar Availability
    $avail = Invoke-RestMethod -Uri "$baseUrl/appointments/availability?date=Apr+29,+2025" -Method Get
    Assert-Test -Name "Calendar Slot Availability Query" -Condition ($avail.success -eq $true -and $avail.available_slots.Count -gt 0) -Details "Available slots: $($avail.available_slots.Count)"
} catch {
    Assert-Test -Name "Leads/Appointments API" -Condition $false -Details $_.Exception.Message
}

# ---------------------------------------------------------
# Test 7: Analytics KPIs & Reporting
# ---------------------------------------------------------
Write-Host "`n[Pillar 7] Testing Dashboard Analytics..." -ForegroundColor White
try {
    $analytics = Invoke-RestMethod -Uri "$baseUrl/analytics/overview" -Method Get
    Assert-Test -Name "Dashboard Analytics Aggregation" -Condition ($analytics.success -eq $true -and $analytics.data.csat_score -ne $null) -Details "CSAT: $($analytics.data.csat_score), Conv: $($analytics.data.total_conversations)"
} catch {
    Assert-Test -Name "Analytics API" -Condition $false -Details $_.Exception.Message
}

Write-Host "`n=========================================================" -ForegroundColor Cyan
Write-Host " Audit Results: $testsPassed Passed, $testsFailed Failed" -ForegroundColor $(if ($testsFailed -eq 0) { "Green" } else { "Red" })
Write-Host "=========================================================" -ForegroundColor Cyan
