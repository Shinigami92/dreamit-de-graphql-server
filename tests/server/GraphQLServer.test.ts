import {
    GraphQLError,
    GraphQLSchema,
    parse,
    validate
} from 'graphql'
import {
    defaultCollectErrorMetrics,
    defaultLoggerContextFunction,
    DefaultMetricsClient,
    defaultRequestContextFunction,
    DefaultRequestInformationExtractor,
    DefaultResponseHandler,
    GraphQLExecutionResult,
    GraphQLServer
} from '~/src'
import {
    initialSchemaWithOnlyDescription,
    userOne,
    userSchema,
    userSchemaResolvers,
    usersQuery,
    userTwo
} from '../ExampleSchemas'

const graphQLErrorResponse: GraphQLExecutionResult = {
    executionResult: {
        errors:
            [new GraphQLError('doesnotmatter', {})]
    },
}

test('Should create schema on GraphQLServer class creation', () => {
    const graphqlServer = new GraphQLServer({
        schema: initialSchemaWithOnlyDescription,
        responseHandler: new DefaultResponseHandler(graphQLErrorResponse,
            graphQLErrorResponse,
            graphQLErrorResponse,
            graphQLErrorResponse)
    })
    const schema = graphqlServer.getSchema()
    expect(schema).toBeDefined()
    expect(schema?.description).toBe('initial')
    expectRootQueryNotDefined(graphqlServer)
})

test('Should update schema when calling GraphQLServer updateGraphQLSchema function', () => {
    const graphqlServer = new GraphQLServer({schema: initialSchemaWithOnlyDescription})
    const updatedSchema = new GraphQLSchema({description:'updated'})
    graphqlServer.setSchema(updatedSchema)
    const schema = graphqlServer.getSchema()
    expect(schema).toBeDefined()
    expect(schema?.description).toBe('updated')
    expectRootQueryNotDefined(graphqlServer)
})

test('Should not update schema when given schema is undefined', () => {
    const graphqlServer = new GraphQLServer({schema: initialSchemaWithOnlyDescription})
    graphqlServer.setSchema()
    const schema = graphqlServer.getSchema()
    expect(schema).toBeDefined()
    expect(schema?.description).toBe('initial')
    expectRootQueryNotDefined(graphqlServer)
})

test('Should update schema when given schema is undefined ' +
    'and shouldUpdateSchemaFunction is true', () => {
    const graphqlServer = new GraphQLServer({
        schema: initialSchemaWithOnlyDescription
        , shouldUpdateSchemaFunction: (): boolean => true
    })
    graphqlServer.setSchema()
    const schema = graphqlServer.getSchema()
    expect(schema).toBeUndefined()
})

test('Should execute query without server', async() => {
    const graphqlServer = new GraphQLServer({
        schema: userSchema,
        rootValue: userSchemaResolvers,
        requestInformationExtractor: new DefaultRequestInformationExtractor(),
        metricsClient: new DefaultMetricsClient(),
        collectErrorMetricsFunction: defaultCollectErrorMetrics,
        parseFunction: parse,
        validateFunction: validate,
        requestContextFunction: defaultRequestContextFunction,
        loggerContextFunction: defaultLoggerContextFunction,
    })
    const result = await graphqlServer.executeRequest({
        query: usersQuery
    })
    expect(result.executionResult.data?.users).toEqual([userOne, userTwo])
    expect(result.statusCode).toBe(200)
    expect(result.requestInformation?.query).toBe(usersQuery)
})

function expectRootQueryNotDefined(graphqlServer: GraphQLServer): void {
    const schemaValidationErrors = graphqlServer.getSchemaValidationErrors()
    expect(schemaValidationErrors?.length).toBe(1)
    expect(schemaValidationErrors?.[0].message).toBe('Query root type must be provided.')
}
