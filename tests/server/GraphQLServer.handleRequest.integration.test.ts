/* eslint-disable @typescript-eslint/naming-convention */
import bodyParser from 'body-parser'
import express, {Express} from 'express'
import {Server} from 'node:http'
import {
    GraphQLServer
} from '../../src'
import {
    usersQuery,
    logoutMutation,
    userOne,
    userTwo,
} from '../ExampleSchemas'
import {
    fetchResponse,
    GRAPHQL_SERVER_PORT,
    INITIAL_GRAPHQL_SERVER_OPTIONS,
} from '../TestHelpers'

let customGraphQLServer: GraphQLServer
let graphQLServer: Server

beforeAll(async() => {
    graphQLServer = setupGraphQLServer().listen({port: GRAPHQL_SERVER_PORT})
    console.info(`Starting GraphQL server on port ${GRAPHQL_SERVER_PORT}`)
})

afterAll(async() => {
    await graphQLServer.close()
})

test('Should get data response', async() => {
    const response = await fetchResponse(`{"query":"${usersQuery}"}`)
    const responseObject = await response.json()
    expect(responseObject.result.executionResult.data.users).toStrictEqual([userOne, userTwo])
    expect(responseObject.result.statusCode).toBe(200)
    expect(responseObject.result.executionResult.extensions).toBeUndefined()
})

test('Should get data response when using a mutation', async() => {
    const response = await fetchResponse(`{"query":"${logoutMutation}"}`)
    const responseObject = await response.json()
    expect(responseObject.result.executionResult.data.logout.result).toBe('Goodbye!')
})

test('Should get error response if query does not match expected query format', async() => {
    const response = await fetchResponse('{"query":"unknown"}')
    const responseObject = await response.json()
    expect(responseObject.result.executionResult.errors[0].message).toBe(
        'Syntax Error: Unexpected Name "unknown".'
    )
})

test('Should get error response if invalid method is used', async() => {
    const response = await fetchResponse('doesnotmatter', 'PUT')
    const responseObject = await response.json()
    expect(responseObject.result.executionResult.errors[0].message).toBe(
        'GraphQL server only supports GET and POST requests.'
    )
    const allowResponseHeader = responseObject.result.customHeaders.allow
    expect(allowResponseHeader).toBe('GET, POST')
})

function setupGraphQLServer(): Express {
    const graphQLServerExpress = express()
    customGraphQLServer = new GraphQLServer(INITIAL_GRAPHQL_SERVER_OPTIONS)
    graphQLServerExpress.use(bodyParser.text({type: '*/*'}))
    graphQLServerExpress.all('/graphql', async(request, response) => {
        const executionResult = await customGraphQLServer.handleRequest(request)
        return response.send({result: executionResult})
    })
    return graphQLServerExpress
}
