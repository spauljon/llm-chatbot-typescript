import initAgent from "./agent";
import {initGraph} from "../graph";
import {embeddings, llm} from "@/modules/llm";

// tag::call[]
export async function call(input: string, sessionId: string): Promise<string> {
  // Get Graph Singleton
  const graph = await initGraph();
  const agent = await initAgent(llm, embeddings, graph);

  return await agent.invoke({input}, {configurable: {sessionId}});
}
// end::call[]
