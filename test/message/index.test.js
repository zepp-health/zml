// test/message/index.test.js - Main test runner for all message modules

// Note: This is a simple custom runner. In a real project, Jest, Mocha, etc., would be used.
// This runner executes tests and aggregates results from individual test files.

import { runAllCoreTests, coreTestResults } from './core.test.js';
import { runAllUtilTests, utilTestResults } from './util.test.js';
import { runAllErrorTests, errorTestResults } from './error.test.js';
import { runAllTransportTests, transportTestResults } from './transport.test.js';
import { runAllSessionTests, sessionTestResults } from './session.test.js';
import { runAllRequestTests, requestTestResults } from './request.test.js';
import { runAllBuilderTests, builderTestResults } from './builder.test.js';

const allModuleResults = [];
let totalTests = 0;
let totalPassed = 0;
let totalFailed = 0;

async function runSuite(name, testFn, resultsArray) {
  console.log(`\n--- Starting Test Suite: ${name} ---`);
  try {
    // If testFn is async, await it. Otherwise, it runs synchronously.
    if (testFn.constructor.name === "AsyncFunction") {
        await testFn();
    } else {
        testFn();
    }
    const passed = resultsArray.filter(r => r.passed).length;
    const failed = resultsArray.filter(r => !r.passed).length;
    console.log(`--- Suite ${name} Completed: ${passed} passed, ${failed} failed ---`);
    allModuleResults.push({ name, passed, failed, total: resultsArray.length });
    totalTests += resultsArray.length;
    totalPassed += passed;
    totalFailed += failed;
  } catch (e) {
    console.error(`FATAL ERROR in test suite ${name}: ${e.message}\n${e.stack}`);
    // Count all tests in this suite as failed if the suite itself crashes badly
    const failedCount = resultsArray ? resultsArray.length : (allModuleResults.find(m=>m.name===name)?.total || 0);
    if (resultsArray && resultsArray.length === 0 && failedCount === 0) { // Suite crashed before any test completed
        // Add a placeholder failure if no tests were recorded
        allModuleResults.push({ name, passed: 0, failed: 1, total: 1, error: true });
        totalFailed += 1; // Count the suite crash as one failure at least
        totalTests +=1; //
    } else { // Some tests might have run before crash
        const passed = resultsArray ? resultsArray.filter(r => r.passed).length : 0;
        const currentFailed = resultsArray ? resultsArray.filter(r => !r.passed).length : 0;
        // If the suite crashes after some tests, those results are already counted.
        // We just mark that the suite had an issue.
         const moduleResult = allModuleResults.find(m=>m.name===name);
         if(moduleResult) moduleResult.error = true;

    }

  }
}

async function main() {
  console.log("====== Running All Message Module Unit Tests ======");

  // Order matters if there are dependencies, but these should be unit tests.
  await runSuite("Core", runAllCoreTests, coreTestResults);
  await runSuite("Util", runAllUtilTests, utilTestResults);
  await runSuite("Error", runAllErrorTests, errorTestResults);
  await runSuite("Transport", runAllTransportTests, transportTestResults); // Contains mocks that might need specific setup if using a framework
  await runSuite("Session", runAllSessionTests, sessionTestResults);
  // Request tests are async due to promise handling
  await runSuite("Request", runAllRequestTests, requestTestResults);
  // Builder tests are also async
  await runSuite("Builder", runAllBuilderTests, builderTestResults);

  console.log("\n\n====== Overall Test Summary ======");
  allModuleResults.forEach(suite => {
    console.log(`  ${suite.name}: ${suite.passed}/${suite.total} passed. ${suite.failed > 0 || suite.error ? `(${suite.failed} failed${suite.error ? ', suite error' : ''})` : ''}`);
  });
  console.log("------------------------------------");
  console.log(`  GRAND TOTAL: ${totalPassed}/${totalTests} passed. Failed: ${totalFailed}`);
  console.log("====================================");

  if (totalFailed > 0) {
    console.error("\n!!!!!! SOME TESTS FAILED !!!!!!");
    // In a CI environment, you would: throw new Error("Tests failed"); or process.exit(1);
  } else {
    console.log("\n****** ALL TESTS PASSED ******");
  }
}

// Execute the main test runner
main().catch(e => {
  console.error("CRITICAL ERROR IN TEST RUNNER:", e);
});
