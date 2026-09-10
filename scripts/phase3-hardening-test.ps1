# Phase 3: Final Production Hardening and Security QA Suite
# Tests: RBAC, Multi-Format RAG, Agent Stress Cycles, Secrets, and Isolation

$baseUrl = "http://localhost:3000/api/v1"
$passed = 0
$failed = 0

function Check-Result {
    param(
        [string]$Name,
        [bool]$Condition,
        [string]$Details = ""
    )
    if ($Condition) {
        Write-Host " [PASS] $Name" -ForegroundColor Green
        if ($Details) { Write-Host "        $Details" -ForegroundColor DarkGray }
        $script:passed++
    } else {
        Write-Host " [FAIL] $Name" -ForegroundColor Red
        if ($Details) { Write-Host "        $Details" -ForegroundColor Yellow }
        $script:failed++
    }
}

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " Phase 3 -- Final Production Hardening and Real Integration QA   " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# ---------------------------------------------------------
# Test 1: Security and RBAC Enforcement (Viewer, Agent, Admin)
# ---------------------------------------------------------
Write-Host "`n[Section 1] Testing Role-Based Access Control..." -ForegroundColor White
try {
    # 1a. Viewer attempting to create a lead -> must return 403 Forbidden
    $viewerHeaders = @{ "x-user-role" = "Viewer"; "Content-Type" = "application/json" }
    $viewerBody = @{ name = "Illegal Lead Attempt"; email = "viewer@hack.com" } | ConvertTo-Json
    $viewerBlocked = $false
    try {
        Invoke-RestMethod -Uri "$baseUrl/leads" -Method Post -Headers $viewerHeaders -Body $viewerBody
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 403 -or $_.Exception.Message -match "403") {
            $viewerBlocked = $true
        }
    }
    Check-Result -Name "RBAC: Viewer blocked from creating Lead" -Condition $viewerBlocked -Details "Viewer mutation access blocked with 403 Forbidden"

    # 1b. Agent attempting to delete a knowledge base document -> must return 403 Forbidden
    $agentHeaders = @{ "x-user-role" = "Agent" }
    $agentBlocked = $false
    try {
        Invoke-RestMethod -Uri "$baseUrl/knowledge/documents/doc-1" -Method Delete -Headers $agentHeaders
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 403 -or $_.Exception.Message -match "403") {
            $agentBlocked = $true
        }
    }
    Check-Result -Name "RBAC: Agent blocked from deleting Knowledge Doc" -Condition $agentBlocked -Details "Agent delete access blocked with 403 Forbidden"

    # 1c. Admin allowed to create lead
    $adminHeaders = @{ "x-user-role" = "Admin"; "Content-Type" = "application/json" }
    $adminBody = @{ name = "Authorized Executive"; email = "exec@acme.com"; score = 92 } | ConvertTo-Json
    $adminRes = Invoke-RestMethod -Uri "$baseUrl/leads" -Method Post -Headers $adminHeaders -Body $adminBody
    Check-Result -Name "RBAC: Admin granted mutation permissions" -Condition ($adminRes.success -eq $true) -Details "Lead created successfully by Admin"
} catch {
    Check-Result -Name "RBAC Test Exception" -Condition $false -Details $_.Exception.Message
}

# ---------------------------------------------------------
# Test 2: Secrets Protection and Data Sanitization
# ---------------------------------------------------------
Write-Host "`n[Section 2] Testing Secrets Leak Prevention..." -ForegroundColor White
try {
    $leadsRes = Invoke-RestMethod -Uri "$baseUrl/leads" -Method Get
    $jsonString = $leadsRes | ConvertTo-Json -Depth 5
    $leakedKeys = ($jsonString -match "password_hash" -or $jsonString -match "secret_key" -or $jsonString -match "gemini_api_key")
    Check-Result -Name "Secrets Protection in API Responses" -Condition (-not $leakedKeys) -Details "Zero internal passwords or secret keys leaked to client"
} catch {
    Check-Result -Name "Secrets Sanitization Exception" -Condition $false -Details $_.Exception.Message
}

# ---------------------------------------------------------
# Test 3: Multi-Format RAG Hardening (TXT, PDF, DOCX, Rejection, Update, Delete)
# ---------------------------------------------------------
Write-Host "`n[Section 3] Testing Multi-Format RAG Pipeline..." -ForegroundColor White
try {
    # 3a. Upload plain text document (.txt)
    $txtDoc = @{
        title = "Cloud Infrastructure Policy.txt"
        type = "Policy"
        content = "All production database instances must have multi-region replication and automated 24-hour backup snapshots enabled."
    } | ConvertTo-Json
    $txtRes = Invoke-RestMethod -Uri "$baseUrl/knowledge/documents" -Method Post -Body $txtDoc -ContentType "application/json"
    $txtId = $txtRes.data.id
    Check-Result -Name "RAG: Plain Text (.txt) Upload and Indexing" -Condition ($txtRes.success -eq $true -and $txtId -ne $null) -Details "Doc ID: $txtId"

    # 3b. Upload Word document (.docx) with XML markers
    $docxDoc = @{
        title = "Enterprise Billing Guide.docx"
        type = "Product"
        content = "<w:p><w:t>Enterprise invoicing is conducted on Net-30 payment terms via automated ACH wire transfer.</w:t></w:p>"
    } | ConvertTo-Json
    $docxRes = Invoke-RestMethod -Uri "$baseUrl/knowledge/documents" -Method Post -Body $docxDoc -ContentType "application/json"
    $docxId = $docxRes.data.id
    Check-Result -Name "RAG: Word Document (.docx) XML Extractor and Indexing" -Condition ($docxRes.success -eq $true -and $docxId -ne $null) -Details "Doc ID: $docxId"

    # 3c. Upload PDF document (.pdf)
    $pdfDoc = @{
        title = "Global Compliance Standard.pdf"
        type = "Legal"
        content = "%PDF-1.4 stream (All sensitive customer personally identifiable information must be encrypted at rest with AES-256.) endstream"
    } | ConvertTo-Json
    $pdfRes = Invoke-RestMethod -Uri "$baseUrl/knowledge/documents" -Method Post -Body $pdfDoc -ContentType "application/json"
    $pdfId = $pdfRes.data.id
    Check-Result -Name "RAG: PDF Document (.pdf) Stream Extractor and Indexing" -Condition ($pdfRes.success -eq $true -and $pdfId -ne $null) -Details "Doc ID: $pdfId"

    # 3d. Semantic Search over newly indexed multi-format documents
    $ragSearch = @{ query = "What are the payment terms for enterprise invoicing?" } | ConvertTo-Json
    $ragRes = Invoke-RestMethod -Uri "$baseUrl/knowledge/query" -Method Post -Body $ragSearch -ContentType "application/json"
    Check-Result -Name "RAG: Semantic Vector Search over DOCX Content" -Condition ($ragRes.data.match -eq $true -and $ragRes.data.chunk -match "Net-30") -Details "Matched Source: $($ragRes.data.source)"

    # 3e. Out-of-domain rejection test
    $rejectSearch = @{ query = "How do I build a homemade rocket in my kitchen?" } | ConvertTo-Json
    $rejectRes = Invoke-RestMethod -Uri "$baseUrl/knowledge/query" -Method Post -Body $rejectSearch -ContentType "application/json"
    Check-Result -Name "RAG: Irrelevant Query Strict Rejection (< 65% threshold)" -Condition ($rejectRes.data.match -eq $false) -Details "Refusal: $($rejectRes.data.refusal)"

    # 3f. Document Update test
    $updateDoc = @{ content = "Enterprise invoicing is now conducted on Net-45 payment terms via wire transfer." } | ConvertTo-Json
    $updateRes = Invoke-RestMethod -Uri "$baseUrl/knowledge/documents/$docxId" -Method Patch -Body $updateDoc -ContentType "application/json"
    Check-Result -Name "RAG: Document Update and Dynamic Re-indexing" -Condition ($updateRes.success -eq $true) -Details "Updated content to Net-45 terms"

    # 3g. Document Cleanup Deletion
    $delTxt = Invoke-RestMethod -Uri "$baseUrl/knowledge/documents/$txtId" -Method Delete -Headers @{ "x-user-role" = "Admin" }
    $delDocx = Invoke-RestMethod -Uri "$baseUrl/knowledge/documents/$docxId" -Method Delete -Headers @{ "x-user-role" = "Admin" }
    $delPdf = Invoke-RestMethod -Uri "$baseUrl/knowledge/documents/$pdfId" -Method Delete -Headers @{ "x-user-role" = "Admin" }
    Check-Result -Name "RAG: Multi-Document Vector Index Deletion" -Condition ($delTxt.success -and $delDocx.success -and $delPdf.success) -Details "Cleaned up all temporary test documents"
} catch {
    Check-Result -Name "RAG Pipeline Exception" -Condition $false -Details $_.Exception.Message
}

# ---------------------------------------------------------
# Test 4: End-to-End AI Agent Stress Test
# ---------------------------------------------------------
Write-Host "`n[Section 4] Testing End-to-End Multi-Agent Routing..." -ForegroundColor White
try {
    # 4a. Support Agent Cycle
    $supportReq = @{ content = "Can you track my order #54321 please?"; sender = "customer" } | ConvertTo-Json
    $supportRes = Invoke-RestMethod -Uri "$baseUrl/conversations/conv-2/messages" -Method Post -Body $supportReq -ContentType "application/json"
    $supportOk = ($supportRes.data.agentMessage.agent_type -eq "support" -and $supportRes.data.toolExecuted.toolName -eq "get_order_status")
    Check-Result -Name "Support Agent: Order Inquiry to Tracking Reply" -Condition $supportOk -Details "Carrier: $($supportRes.data.toolExecuted.result.carrier)"

    # 4b. Sales Agent Cycle
    $salesReq = @{ content = "I have a budget of $800 and need a fast laptop for work"; sender = "customer" } | ConvertTo-Json
    $salesRes = Invoke-RestMethod -Uri "$baseUrl/conversations/conv-1/messages" -Method Post -Body $salesReq -ContentType "application/json"
    $salesOk = ($salesRes.data.agentMessage.agent_type -eq "sales" -and $salesRes.data.toolExecuted.toolName -ne $null)
    Check-Result -Name "Sales Agent: Product Inquiry to Recommendation" -Condition $salesOk -Details "Replied with curated catalog recommendations"

    # 4c. Appointment Booking Cycle
    $aptReq = @{ content = "I want to schedule a demo at 10:00 AM tomorrow"; sender = "customer" } | ConvertTo-Json
    $aptRes = Invoke-RestMethod -Uri "$baseUrl/conversations/conv-3/messages" -Method Post -Body $aptReq -ContentType "application/json"
    $aptOk = ($aptRes.data.agentMessage.agent_type -eq "appointment" -and $aptRes.data.toolExecuted.toolName -eq "create_appointment")
    Check-Result -Name "Appointment Agent: Slot Request to Calendar Creation" -Condition $aptOk -Details "Booked slot: 10:00 AM"

    # 4d. Human Escalation Cycle
    $humanReq = @{ content = "I need to talk to a human supervisor right now"; sender = "customer" } | ConvertTo-Json
    $humanRes = Invoke-RestMethod -Uri "$baseUrl/conversations/conv-4/messages" -Method Post -Body $humanReq -ContentType "application/json"
    $humanOk = ($humanRes.data.agentMessage.agent_type -eq "human")
    Check-Result -Name "Human Escalation: Priority Queue Transfer" -Condition $humanOk -Details "Conversation transitioned to live support queue"
} catch {
    Check-Result -Name "Agent Stress Exception" -Condition $false -Details $_.Exception.Message
}

# ---------------------------------------------------------
# Test 5: Real MVP Integrations Diagnostics
# ---------------------------------------------------------
Write-Host "`n[Section 5] Testing Real MVP Integrations..." -ForegroundColor White
try {
    $gcal = Invoke-RestMethod -Uri "$baseUrl/integrations/google_calendar/connect" -Method Post -Body (@{ testOnly = $true } | ConvertTo-Json) -ContentType "application/json"
    Check-Result -Name "Google Calendar API Diagnostics" -Condition ($gcal.success -eq $true) -Details $gcal.diagnostic.message

    $shopify = Invoke-RestMethod -Uri "$baseUrl/integrations/shopify/connect" -Method Post -Body (@{ testOnly = $true } | ConvertTo-Json) -ContentType "application/json"
    Check-Result -Name "Shopify Admin API Diagnostics" -Condition ($shopify.success -eq $true) -Details $shopify.diagnostic.message

    $hubspot = Invoke-RestMethod -Uri "$baseUrl/integrations/hubspot/connect" -Method Post -Body (@{ testOnly = $true } | ConvertTo-Json) -ContentType "application/json"
    Check-Result -Name "HubSpot CRM API Diagnostics" -Condition ($hubspot.success -eq $true) -Details $hubspot.diagnostic.message
} catch {
    Check-Result -Name "Integrations Exception" -Condition $false -Details $_.Exception.Message
}

Write-Host "`n=================================================================" -ForegroundColor Cyan
Write-Host " Phase 3 Hardening Results: $passed Passed, $failed Failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host "=================================================================" -ForegroundColor Cyan
