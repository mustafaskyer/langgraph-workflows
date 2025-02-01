import { Annotation, messagesStateReducer } from '@langchain/langgraph'
const State = Annotation.Root({
  // simple key-value state
  foo: Annotation<number>,
  // messages state
  messages: Annotation({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  // or simply use the MessagesAnnotation from '@langchain/langgraph'
  // ...MessagesAnnotation.spec,
})
