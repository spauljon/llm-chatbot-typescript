/* eslint-disable indent */
import {Embeddings} from "@langchain/core/embeddings";
import {Neo4jGraph} from "@langchain/community/graphs/neo4j_graph";
import {BaseChatModel} from "@langchain/core/language_models/chat_models";
import initTools from "./tools";
import {pull} from "langchain/hub";
import {ChatPromptTemplate} from "@langchain/core/prompts";
import {AgentExecutor, createOpenAIFunctionsAgent} from "langchain/agents";
import initRephraseChain, {
  RephraseQuestionInput
} from "@/modules/agent/chains/rephrase-question.chain";
import {RunnablePassthrough} from "@langchain/core/runnables";
import {getHistory} from "@/modules/agent/history";

// tag::function[]
export default async function initAgent(
  llm: BaseChatModel,
  embeddings: Embeddings,
  graph: Neo4jGraph
) {
  const tools = await initTools(llm, embeddings, graph);

  const prompt = await pull<ChatPromptTemplate>(
    "hwchase17/openai-functions-agent"
  );

  const agent = await createOpenAIFunctionsAgent({
    llm,
    tools,
    prompt,
  });

  const executor = new AgentExecutor({
    agent,
    tools,
    verbose: true, // Verbose output logs the agents _thinking_
  });

  const rephraseQuestionChain = initRephraseChain(llm);

  return (
    RunnablePassthrough.assign<{ input: string; sessionId: string }, any>({
      // Get Message History
      history: async (_input, options) => {
        return await getHistory(
          options?.configurable.sessionId
        );
      },
    })
      .assign({
        rephrasedQuestion: (input: RephraseQuestionInput, config: any) =>
          rephraseQuestionChain.invoke(input, config),
      })
      .pipe(executor)
      .pick("output")
  );
}

// end::function[]
