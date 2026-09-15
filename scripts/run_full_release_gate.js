/**
 * Unified Full Release Gate Runner for AI Conversation & Sales Suite
 * Executes all Phase 1-5 verification suites sequentially and reports consolidated results.
 */

const { execSync } = require('child_process');

const suites = [
    { name: 'Phase 1: Critical Bug Remediation', file: 'scripts/verify_phase_1_critical.js' },
    { name: 'Phase 2: High-Priority Bug Remediation', file: 'scripts/verify_phase_2_high.js' },
    { name: 'Phase 3: Medium & Low Defects Remediation', file: 'scripts/verify_phase_3_medium_low.js' },
    { name: 'Phase 4: Missing Features Implementation', file: 'scripts/verify_phase_4_features.js' },
    { name: 'Phase 5: Full-System Integration & Hardening', file: 'scripts/verify_phase_5_hardening.js' }
];

console.log('================================================================');
console.log('    AI CONVERSATION & SALES SUITE — FINAL RELEASE GATE RUNNER   ');
console.log('================================================================\n');

let totalPassed = 0;
let totalFailed = 0;
let suiteResults = [];

for (const suite of suites) {
    console.log(`\n▶ RUNNING SUITE: ${suite.name} (${suite.file})...`);
    try {
        const output = execSync(`node "${suite.file}"`, { encoding: 'utf8', stdio: 'pipe' });
        console.log(output);

        // Parse passes and fails
        const passMatch = output.match(/(\d+)\s+PASSED/);
        const failMatch = output.match(/(\d+)\s+FAILED/);
        const passCount = passMatch ? parseInt(passMatch[1], 10) : 1;
        const failCount = failMatch ? parseInt(failMatch[1], 10) : 0;

        totalPassed += passCount;
        totalFailed += failCount;
        suiteResults.push({ name: suite.name, status: 'PASSED', passes: passCount, fails: failCount });
    } catch (err) {
        console.error(`Suite execution failed: ${err.message}`);
        if (err.stdout) console.log(err.stdout);
        if (err.stderr) console.error(err.stderr);
        totalFailed++;
        suiteResults.push({ name: suite.name, status: 'FAILED', error: err.message });
    }
}

console.log('\n================================================================');
console.log('               FINAL RELEASE GATE CONSOLIDATED SUMMARY           ');
console.log('================================================================');
for (const res of suiteResults) {
    const icon = res.status === 'PASSED' ? '✅' : '❌';
    console.log(`  ${icon} ${res.name}: ${res.status} (${res.passes || 0} passed, ${res.fails || 0} failed)`);
}
console.log('----------------------------------------------------------------');
console.log(`  TOTAL CHECKS PASSED: ${totalPassed}`);
console.log(`  TOTAL CHECKS FAILED: ${totalFailed}`);
console.log('================================================================\n');

if (totalFailed === 0) {
    console.log('🎉 ALL PRODUCTION GATES PASSED! SYSTEM IS CERTIFIED PRODUCTION-READY.\n');
    process.exit(0);
} else {
    console.error(`❌ RELEASE GATE FAILED: ${totalFailed} checks failed.\n`);
    process.exit(1);
}
