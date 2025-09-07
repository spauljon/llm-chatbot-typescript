import {BaseChatModel} from "@langchain/core/language_models/chat_models";
import {Embeddings} from "@langchain/core/embeddings";
import {Neo4jGraph} from "@langchain/community/graphs/neo4j_graph";
import initCypherRetrievalChain from "./cypher/cypher-retrieval.chain";
import initVectorRetrievalChain from "./vector-retrieval.chain";
import {DynamicStructuredTool} from "@langchain/community/tools/dynamic";
import {AgentToolInputSchema} from "../agent.types";

// tag::function[]
export default async function initTools(
  llm: BaseChatModel,
  embeddings: Embeddings,
  graph: Neo4jGraph
): Promise<DynamicStructuredTool[]> {
  // Initiate chains
  const cypherChain = await initCypherRetrievalChain(llm, graph);
  const retrievalChain = await initVectorRetrievalChain(llm, embeddings);

  return [
    new DynamicStructuredTool({
      name: "graph-cypher-retrieval-chain",
      description:
        "For retrieving movie information from the database including movie recommendations, actors and user ratings",
      schema: AgentToolInputSchema,
      func: (input, _runManager, config) => cypherChain.invoke(input, config),
    }),
    new DynamicStructuredTool({
      name: "graph-vector-retrieval-chain",
      description:
        "For finding movies, comparing movies by their plot or recommending a movie based on a theme",
      schema: AgentToolInputSchema,
      func: (input, _runManager: any, config) =>
        retrievalChain.invoke(input, config),
    }),
  ];
}
// end::function[]
