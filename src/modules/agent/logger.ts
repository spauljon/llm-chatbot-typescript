// customLogger.ts
import {BaseCallbackHandler} from "@langchain/core/callbacks/base";

export class CompactConsoleLogger extends BaseCallbackHandler {
  name = "CompactConsoleLogger";

  // handleChainStart(chain: any, inputs: any, runId: string, parentRunId?: string) {
  //   const name = chain?.name ?? chain?.id?.at?.(-1) ?? "Chain";
  //   console.log(`[chain ▶] ${name}`, {runId, parentRunId, inputs});
  // }
  //
  // handleChainEnd(outputs: any, runId: string) {
  //   console.log(`[chain ✓]`, {runId, outputs});
  // }

  handleToolStart(tool: any, input: string, runId: string, parentRunId?: string, tags?: string[],
    _metadata?: Record<string, unknown>, runName?: string) {
    const name = runName ?? tool?.name ?? tool?.id?.at?.(-1) ?? "Tool";
    console.log(`[tool ▶] ${name}`, {runId, parentRunId, input});
  }

  handleToolEnd(output: unknown, runId: string) {
    console.log(`[tool ✓]`, {runId, output});
  }

  handleLLMStart(_llm: any, prompts: string[], runId: string) {
    // keep this terse—first 120 chars of first prompt
    const preview = (prompts?.[0] ?? "").slice(0, 120).replace(/\s+/g, " ");
    console.log(`[llm ▶] prompt`, {runId, preview});
  }

  handleLLMEnd(output: any, runId: string) {
    console.log(`[llm ✓]`, {runId, usage: output?.llmOutput?.tokenUsage});
  }

  handleChainError(err: Error, runId: string) {
    console.error(`[chain ✗]`, {runId, err: err.message});
  }

  handleToolError(err: Error, runId: string) {
    console.error(`[tool ✗]`, {runId, err: err.message});
  }

  handleLLMError(err: Error, runId: string) {
    console.error(`[llm ✗]`, {runId, err: err.message});
  }
}
