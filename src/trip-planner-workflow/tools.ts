import { tool } from '@langchain/core/tools'
import { z } from 'zod'

/** user retrieval */
const lookupUserParams = z.object({
  userId: z.string(),
})
const getUserInfo = tool(
  async ({ userId }) => {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return `user id: ${userId} results from our database are: 
    name: John Doe
    email: john.doe@example.com
    phone: +1234567890
    address: 123 Main St, Anytown, USA
    lives in: Riyadh, Saudi Arabia

    last 3 trips:
    trip 1: from Riyadh to Jeddah for 2 days
    trip 2: from Riyadh to Dubai for 3 days
    trip 3: from Riyadh to Cairo for 4 days

    preferences:
    - likes to visit historical places
    - likes to visit beaches
    - likes to visit mountains
    - likes to visit cities with a lot of history
    - likes to visit cities with a lot of nature
    - likes to visit cities with a lot of culture
    `
  },
  {
    name: 'getUserInfo',
    description:
      'A tool to get more information about the user to help with the trip planning',
    schema: lookupUserParams,
  },
)

/** lookup places */
const lookupPlacesParams = z.object({
  city: z.string(),
})
const getCityPlaces = tool(
  async ({ city }) => {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return `city: ${city} places results from our database are: First place: King Palace . Second place: Lord Museum . Third place: Green Park`
  },
  {
    name: 'getCityPlaces',
    description:
      'A tool to get places by city. returns a list of places in string',
    schema: lookupPlacesParams,
  },
)

/** lookup hotels */
const lookupHotlesParams = z.object({
  city: z.string(),
})
const getCityHotels = tool(
  ({ city }) => {
    return `city: ${city} hotels results from our database are: First hotel: Mariot hotel . Second hotel: Hilton hotel . Third hotel: Radisson hotel`
  },
  {
    name: 'getCityHotels',
    description: 'A tool to get hotels by city',
    schema: lookupHotlesParams,
  },
)

/** lookup flights */
const lookupFlightParams = z.object({
  from: z.string(),
  to: z.string(),
})

const getTripFlights = tool(
  ({ from, to }) => {
    return `city: ${from} to city: ${to} flights results from our database are: 
    First flight: flight #ABC at departure 10:00 AM and arrival 12:00 AM
    Second flight: flight #DEF at departure 1:00 PM and arrival 3:00 PM
    Third flight: flight #GHI at departure 7:00 PM and arrival 9:00 PM`
  },
  {
    name: 'getTripFlights',
    description: 'A tool to get flights by from city & to city',
    schema: lookupFlightParams,
  },
)

export const toolsMap: Record<
  'getUserInfo' | 'getCityPlaces' | 'getCityHotels' | 'getTripFlights',
  any
> = {
  getUserInfo,
  getCityPlaces,
  getCityHotels,
  getTripFlights,
}
