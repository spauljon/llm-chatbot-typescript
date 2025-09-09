import initAgent from "./agent";
import {initGraph} from "../graph";
import {embeddings, llm} from "@/modules/llm";
import {MermaidTracer} from "@/modules/agent/tracer";
import {writeFileSync} from "node:fs";
import {CompactConsoleLogger} from "@/modules/agent/logger";

// tag::call[]
export async function call(input: string, sessionId: string): Promise<string> {
  // Get Graph Singleton
  const graph = await initGraph();
  const agent = await initAgent(llm, embeddings, graph);
  const tracer = new MermaidTracer();
  const logger = new CompactConsoleLogger();

  let result = await agent.invoke({input},
    {configurable: {sessionId}, callbacks: [logger, tracer]});

  const mermaid = tracer.toMermaid();
  writeFileSync("agent-diagram.mmd", mermaid, "utf8");
  console.log("Wrote agent-diagram.mmd");

  return result;
}
// end::call[]
