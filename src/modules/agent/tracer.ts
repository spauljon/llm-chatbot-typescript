import { BaseCallbackHandler } from "@langchain/core/callbacks/base";

type NodeInfo = { id: string; label: string; kind: string };
type Edge = { from: string; to: string; label?: string };

export class MermaidTracer extends BaseCallbackHandler {
  name = "MermaidTracer";
  private readonly nodes = new Map<string, NodeInfo>();
  private readonly edges: Edge[] = [];

  private addNode(runId: string, name: string, kind: string) {
    if (!this.nodes.has(runId)) {
      this.nodes.set(runId, { id: runId, label: `${name}\n(${kind})`, kind });
    }
  }
  private addEdge(parentRunId: string | undefined, runId: string, kind: string) {
    if (parentRunId) this.edges.push({ from: parentRunId, to: runId, label: kind });
  }

  // ---- LLM / Chat model ----
  handleLLMStart(_llm: unknown, _prompts: string[], runId: string, parentRunId?: string) {
    this.addNode(runId, "LLM", "llm");
    this.addEdge(parentRunId, runId, "llm");
  }
  handleChatModelStart(_llm: unknown, _messages: unknown[][], runId: string, parentRunId?: string) {
    this.addNode(runId, "ChatModel", "llm");
    this.addEdge(parentRunId, runId, "llm");
  }

  // ---- Chains / Agents ----
  handleChainStart(chain: any, _inputs: any, runId: string, parentRunId?: string) {
    const name = chain?.id?.[chain.id.length - 1] ?? chain?.name ?? "Chain";
    this.addNode(runId, String(name), "chain");
    this.addEdge(parentRunId, runId, "chain");
  }

  // ---- Tools ----
  handleToolStart(tool: any, _input: string, runId: string, parentRunId?: string) {
    const name = tool?.name ?? tool?.id?.[tool.id.length - 1] ?? "Tool";
    this.addNode(runId, String(name), "tool");
    this.addEdge(parentRunId, runId, "tool");
  }

  // ---- Retrievers (optional) ----
  handleRetrieverStart(ret: any, _q: string, runId: string, parentRunId?: string) {
    const name = ret?.name ?? ret?.id?.[ret.id.length - 1] ?? "Retriever";
    this.addNode(runId, String(name), "retriever");
    this.addEdge(parentRunId, runId, "retriever");
  }

  // ---- Emit Mermaid ----
  toMermaid(): string {
    const esc = (s: string) => s.replace(/"/g, '\\"');
    const norm = (s: string) => s.replace(/[^A-Za-z0-9_]/g, "_");

    const lines: string[] = [
      "flowchart TD",
      "  classDef llm fill:#fff3,stroke:#bbb;",
      "  classDef chain fill:#e3f2fd,stroke:#64b5f6;",
      "  classDef tool fill:#e8f5e9,stroke:#81c784;",
      "  classDef retriever fill:#fff8e1,stroke:#ffb300;",
      "  classDef prompt fill:#f3e5f5,stroke:#ba68c8;",
    ];

    for (const n of this.nodes.values()) {
      const id = norm(n.id);
      lines.push(`  ${id}["${esc(n.label)}"]`);
      lines.push(`  class ${id} ${n.kind};`);
    }
    for (const e of this.edges) {
      lines.push(`  ${norm(e.from)} -->${e.label ? `|${e.label}|` : ""} ${norm(e.to)}`);
    }
    return lines.join("\n");
  }
}
