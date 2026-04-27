import { runPipeline } from "../pipeline/orchestrator";
import { normalPrompts, edgeCasePrompts } from "./testData";

const allPrompts = [...normalPrompts, ...edgeCasePrompts];

export async function runEvaluation() {
  console.log("=========================================");
  console.log("   SPECFORGE PIPELINE EVALUATION SUITE   ");
  console.log("=========================================\n");

  let successCount = 0;
  let totalLatency = 0;
  let retriesCount = 0;
  
  const failureTypes = new Set<string>();
  const errorFrequencies: Record<string, number> = {};
  const latencies: number[] = [];
  
  let slowestPrompt = "";
  let slowestLatency = -1;
  let fastestPrompt = "";
  let fastestLatency = Number.MAX_SAFE_INTEGER;

  for (let i = 0; i < allPrompts.length; i++) {
    const prompt = allPrompts[i];
    console.log(`\n╭─────────────────────────────────────────────────────────────`);
    console.log(`│ TEST [${i + 1}/${allPrompts.length}]`);
    console.log(`│ PROMPT: "${prompt}"`);
    console.log(`├─────────────────────────────────────────────────────────────`);
    
    // Record start time
    const start = Date.now();
    let success = false;
    let errorMsg = "";
    const capturedErrors: string[] = [];

    try {
      // Suppress excessive pipeline logs
      const originalLog = console.log;
      console.log = () => {}; 
      
      const result = await runPipeline(prompt) as any;
      
      // Restore log
      console.log = originalLog;
      
      // Record end time
      const end = Date.now();
      const latency = end - start;
      
      // Add latency
      latencies.push(latency);
      totalLatency += latency;

      if (latency > slowestLatency) {
        slowestLatency = latency;
        slowestPrompt = prompt;
      }
      if (latency < fastestLatency) {
        fastestLatency = latency;
        fastestPrompt = prompt;
      }

      // Check execution
      if (result.execution && result.execution.success) {
        success = true;
        successCount++;
      } else {
        errorMsg = result.execution?.message || "Execution validation failed";
      }

      // Track retries
      if (result.repaired) {
         retriesCount++;
      }

      // Track failure types
      // Using result.originalErrors since our pipeline was modified to export the raw errors 
      if (!success && result.originalErrors) {
        result.originalErrors.forEach((err: any) => {
          if (err.message) capturedErrors.push(`[${err.type}] ${err.message}`);
          if (err.type) {
            failureTypes.add(err.type);
            errorFrequencies[err.type] = (errorFrequencies[err.type] || 0) + 1;
          }
        });
      }

      // Log intermediate
      console.log(`│ STATUS : ${success ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`│ LATENCY: ${latency}ms`);
      
      if (!success) {
        console.log(`│ ERROR  : ${errorMsg}`);
        if (capturedErrors.length > 0) {
           console.log(`│ DETAILS:`);
           capturedErrors.forEach(err => console.log(`│   - ${err}`));
        }
      }
      console.log(`╰─────────────────────────────────────────────────────────────`);

    } catch (error: any) {
      console.log = Object.getPrototypeOf(console).log || console.info; // Safety restore
      
      const end = Date.now();
      const latency = end - start;
      
      latencies.push(latency);
      totalLatency += latency;
      
      if (latency > slowestLatency) {
        slowestLatency = latency;
        slowestPrompt = prompt;
      }
      if (latency < fastestLatency) {
        fastestLatency = latency;
        fastestPrompt = prompt;
      }
      
      console.log(`│ STATUS : ❌ CRITICAL FAIL`);
      console.log(`│ LATENCY: ${latency}ms`);
      console.log(`│ ERROR  : ${error.message}`);
      console.log(`╰─────────────────────────────────────────────────────────────`);
      failureTypes.add("CRITICAL_CRASH");
    }
  }

  // After all tests
  const totalTests = allPrompts.length;
  const successRate = totalTests > 0 ? successCount / totalTests : 0;
  const avgLatency = totalTests > 0 ? totalLatency / totalTests : 0;
  const retriesPerRequest = totalTests > 0 ? retriesCount / totalTests : 0;
  
  // Track most frequent failure type
  let mostFrequentFailureType = "None";
  let maxFreq = 0;
  for (const [type, count] of Object.entries(errorFrequencies)) {
    if (count > maxFreq) {
      maxFreq = count;
      mostFrequentFailureType = type;
    }
  }

  // Final output
  const metrics = {
    totalTests,
    successRate: parseFloat(successRate.toFixed(2)),
    avgLatency: parseFloat(avgLatency.toFixed(2)),
    retriesPerRequest: parseFloat(retriesPerRequest.toFixed(2)),
    failureTypes: Array.from(failureTypes),
    slowestPrompt: {
      prompt: slowestPrompt,
      latency: slowestLatency
    },
    fastestPrompt: {
      prompt: fastestPrompt,
      latency: fastestLatency !== Number.MAX_SAFE_INTEGER ? fastestLatency : 0
    },
    mostFrequentFailureType: maxFreq > 0 ? `${mostFrequentFailureType} (${maxFreq} times)` : "None"
  };

  console.log("\n=== Evaluation Results ===");
  console.log(metrics);
  return metrics;
}

if (require.main === module) {
  runEvaluation().catch(console.error);
}
