import { AIMessage, BaseMessage, SystemMessage } from '@langchain/core/messages'
import {
  Annotation,
  Command,
  MessagesAnnotation,
  StateGraph,
} from '@langchain/langgraph'
import { EDGES } from './edges'
import { openai } from './llms'
import { travelAdvisorSchemaOutput } from './schemas'
import { toolsMap } from './tools'

// ** state
const State = Annotation.Root({
  ...MessagesAnnotation.spec,
  from_city: Annotation<string>(),
  to_city: Annotation<string>(),
  from_country: Annotation<string>(),
  to_country: Annotation<string>(),
  callerNode: Annotation<keyof typeof EDGES>(),
})

// ** nodes

async function toolsNode(state: typeof State.State) {
  const { messages, callerNode } = state
  const lastMessage = messages[messages.length - 1]
  const toolsMessages: BaseMessage[] = []
  if (
    'tool_calls' in lastMessage &&
    Array.isArray(lastMessage.tool_calls) &&
    lastMessage.tool_calls.length
  ) {
    for await (const toolCall of lastMessage.tool_calls) {
      const toolName = toolCall.name! as keyof typeof toolsMap
      const toolResponse = await toolsMap[toolName].invoke(toolCall)
      toolsMessages.push(toolResponse as any)
    }
  }

  return new Command({
    goto: callerNode || EDGES.END,
    update: { messages: [...toolsMessages], callerNode: undefined },
  })
}

async function userRetrievalNode(state: typeof State.State) {
  const { messages } = state
  const response = await openai
    .bindTools([toolsMap.getUserInfo])
    .invoke(messages, {
      // force tool call for first message
      tool_choice: messages?.length <= 1 ? 'required' : undefined,
    })

  if (
    'tool_calls' in response &&
    Array.isArray(response.tool_calls) &&
    response.tool_calls.length
  ) {
    console.log('user retrieval response with tool calls', response.tool_calls)
    return new Command({
      goto: EDGES.TOOLS,
      update: { messages: [response], callerNode: EDGES.USER_RETRIEVAL },
    })
  }
  return new Command({
    goto: EDGES.TRAVEL_ADVISOR,
    update: { messages: [response] },
  })
}

async function travelAdvisorNode(state: typeof State.State) {
  const response = await openai
    .withStructuredOutput(travelAdvisorSchemaOutput)
    .invoke([
      new SystemMessage(`
      You are an expert travel advisor. you'll be ask to plan a trip for a user,
      to get more information about the user, just return the nextNode to go to ${EDGES.USER_RETRIEVAL}
      otherwise, you can directly plan the trip and return the nextNode to go to ${EDGES.SIGHT_ADVISOR}
      
      Instructions:
      - You need to analyze the user's request, document a trip plan, and return the trip plan as a markdown document.
      - Provide from_city, to_city, from_country, to_country in the response if found
      - Don't recommend hotels, or flights, or sights since there are other great agents for that works with you!
      `),
      ...state.messages,
    ])

  const { result, from_city, to_city, from_country, to_country } =
    response || {}

  if (to_city) {
    const aiMessage = new AIMessage(
      `LLM Context: 
        to city: ${to_city}. 
        to_country: ${to_country}
        from city: ${from_city}
        from_country: ${from_country}
      `,
    )
    return new Command({
      goto: EDGES.SIGHT_ADVISOR,
      update: {
        messages: [new AIMessage(result), aiMessage],
        from_city,
        to_city,
        from_country,
        to_country,
      },
    })
  }

  return new Command({
    goto: EDGES.END,
    update: { messages: [new AIMessage(result)] },
  })
}
async function sightAdvisorNode(state: typeof State.State) {
  const { messages } = state

  const response = await openai
    .bindTools([toolsMap.getCityPlaces])
    .invoke(messages)

  if (
    'tool_calls' in response &&
    Array.isArray(response.tool_calls) &&
    response.tool_calls.length
  ) {
    return new Command({
      goto: EDGES.TOOLS,
      update: { messages: [response], callerNode: EDGES.SIGHT_ADVISOR },
    })
  }

  return new Command({
    goto: EDGES.HOTEL_ADVISOR,
    update: {
      messages: [response],
    },
  })
}

async function hotelAdvisorNode(state: typeof State.State) {
  // from the plan and city, should recommend places to visit
  const { messages } = state
  const response = await openai
    .bindTools([toolsMap.getCityHotels])
    .invoke(messages)

  if (
    'tool_calls' in response &&
    Array.isArray(response.tool_calls) &&
    response.tool_calls.length
  ) {
    return new Command({
      goto: EDGES.TOOLS,
      update: { messages: [response], callerNode: EDGES.HOTEL_ADVISOR },
    })
  }

  return new Command({
    goto: EDGES.FLIGHT_ADVISOR,
    update: {
      messages: [response],
    },
  })
}
async function flightAdvisorNode(state: typeof State.State) {
  const { messages } = state
  const response = await openai
    .bindTools([toolsMap.getTripFlights])
    .invoke(messages)

  if (
    'tool_calls' in response &&
    Array.isArray(response.tool_calls) &&
    response.tool_calls.length
  ) {
    return new Command({
      goto: EDGES.TOOLS,
      update: { messages: [response], callerNode: EDGES.FLIGHT_ADVISOR },
    })
  }

  return new Command({
    goto: EDGES.END,
    update: {
      messages: [response],
    },
  })
}

export const workflow = new StateGraph(State)

workflow
  .addNode(EDGES.TRAVEL_ADVISOR, travelAdvisorNode, {
    ends: [EDGES.SIGHT_ADVISOR, EDGES.USER_RETRIEVAL, EDGES.END],
  })
  .addNode(EDGES.USER_RETRIEVAL, userRetrievalNode, {
    ends: [EDGES.TRAVEL_ADVISOR, EDGES.TOOLS],
  })
  .addNode(EDGES.SIGHT_ADVISOR, sightAdvisorNode, {
    ends: [EDGES.TOOLS, EDGES.END],
  })
  .addNode(EDGES.HOTEL_ADVISOR, hotelAdvisorNode, {
    ends: [EDGES.FLIGHT_ADVISOR, EDGES.END],
  })
  .addNode(EDGES.FLIGHT_ADVISOR, flightAdvisorNode, {
    ends: [EDGES.END],
  })
  .addNode(EDGES.TOOLS, toolsNode, {
    ends: [
      EDGES.SIGHT_ADVISOR,
      EDGES.HOTEL_ADVISOR,
      EDGES.FLIGHT_ADVISOR,
      EDGES.USER_RETRIEVAL,
      EDGES.END,
    ],
  })
  .addEdge(EDGES.START, EDGES.USER_RETRIEVAL)
