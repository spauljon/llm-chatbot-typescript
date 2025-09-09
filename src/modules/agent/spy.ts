import {RunnableLambda} from "@langchain/core/runnables";

export const spy = new RunnableLambda({
  func: async (input: any) => {
    debugger;  // step in here

    return input; // just pass it through
  },
});
