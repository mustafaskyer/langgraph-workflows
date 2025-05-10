import { z } from 'zod'
import zodToJsonSchema from 'zod-to-json-schema'

export const travelAdvisorSchemaOutput = z.object({
  result: z
    .string()
    .describe('the result of your recommendations, planning, ...etc'),
  from_city: z
    .string()
    .optional()
    .describe(
      "the city where the user are! . Don't return any if not provided",
    ),
  from_country: z
    .string()
    .optional()
    .describe(
      "what country the user are in now! . Don't return any if not provided",
    ),
  to_city: z
    .string()
    .optional()
    .describe(
      "the city where the user want to visit . Don't return any if not provided",
    ),
  to_country: z
    .string()
    .optional()
    .describe(
      'what country the user wants to visit . must return "undefined" if not provided',
    ),
})

export const travelAdvisorFormattedSchemaOutput = zodToJsonSchema(
  travelAdvisorSchemaOutput,
)
