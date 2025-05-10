import { ChatAnthropic } from '@langchain/anthropic'
import { ChatOpenAI } from '@langchain/openai'

export const anthropic = new ChatAnthropic({
  model: 'claude-3-haiku-20240307',
  temperature: 0,
})

export const openai = new ChatOpenAI({
  model: 'gpt-4o-mini',
  temperature: 0,
})
