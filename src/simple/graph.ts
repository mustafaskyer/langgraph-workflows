import {
  Annotation,
  Command,
  END,
  messagesStateReducer,
  START,
  StateGraph,
} from '@langchain/langgraph'

/** Define the state annotation */
const StateAnnotation = Annotation.Root({
  messages: Annotation({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  /** add any keys regards to your business requirements below */
})

/** Define the nodes */
export const nodeOne = async (state: typeof StateAnnotation.State) => {
  /**
   * const someChecks = '...'
  if (someChecks) {
    return new Command({
      goto: END,
      update: {
        // what to update
      },
    })
  }
  return new Command({
    goto: 'two',
  })
   */
  return state
}

export const nodeTwo = async (state: typeof StateAnnotation.State) => {
  return state;
}

export const nodeThree = async (state: typeof StateAnnotation.State) => {
  return state
}

export const shouldContinue = async (state: typeof StateAnnotation.State) => {
  const random = Math.random() * 100
  if (random > 50) {
    return END
  } else {
    return 'two'
  }
}

const workflow = new StateGraph(StateAnnotation)
  .addNode('one', nodeOne)
  .addNode('two', nodeTwo)
  .addNode('three', nodeThree)
  // Conecting Edges
  .addEdge(START, 'one')
  .addEdge('one', 'two')
  .addEdge('two', 'three')
  .addEdge('three', END)
  .addConditionalEdges('one', shouldContinue, {
    true: 'two',
    false: END,
  })

/** Compile and print the graph */
export const graph = workflow.compile()

async function main() {
  // print the graph
  const drawableGraph = await graph.getGraphAsync()
  const png = await drawableGraph.drawMermaidPng()
  Bun.write(process.cwd() + '/src/simple/conditional-graph.png', png)
}

main()

graph.name = 'Simple Graph'
