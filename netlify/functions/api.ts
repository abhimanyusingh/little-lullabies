// netlify/functions/api.ts

import { Handler } from '@netlify/functions'

const handler: Handler = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Netlify Function is working!',
      method: event.httpMethod,
      query: event.queryStringParameters,
      timestamp: new Date().toISOString(),
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  }
}

export { handler }
