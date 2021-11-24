import {
    ExecutionResult,
    GraphQLError,
    GraphQLSchema,
    validateSchema
} from 'graphql'
import {IncomingMessage,
    ServerResponse} from 'http'
import {Logger} from '../logger/Logger';
import {GraphQLServerOptions} from './GraphQLServerOptions';
import {TextLogger} from '../logger/TextLogger';

type Request = IncomingMessage & { url: string }
type Response = ServerResponse & { json?: (data: unknown) => void }
const fallbackTextLogger = new TextLogger('fallback-logger', 'fallback-service');

export class GraphQLServer {
    private logger: Logger = fallbackTextLogger
    private debug = false
    private schema?: GraphQLSchema
    private schemaValidationFunction: (schema: GraphQLSchema) => ReadonlyArray<GraphQLError> = validateSchema
    private schemaValidationErrors: ReadonlyArray<GraphQLError> = []

    constructor(options?: GraphQLServerOptions) {
        this.setOptions(options)
    }

    setOptions(options?: GraphQLServerOptions): void {
        if (options) {
            this.logger = options.logger || fallbackTextLogger
            this.debug = options.debug || false
            this.schemaValidationFunction = options.schemaValidationFunction || validateSchema
            this.setSchema(options.schema)
        }
    }

    getSchema(): GraphQLSchema | undefined {
        return this.schema
    }

    setSchema(schema?: GraphQLSchema): void {
        this.logger.info('Trying to update graphql schema')
        this.logDebugIfEnabled(`Schema is  ${JSON.stringify(schema)}`)
        if (this.shouldUpdateSchema(schema)) {
            this.schema = schema
            // Validate schema
            if (this.schema) {
                this.schemaValidationErrors = this.schemaValidationFunction(this.schema)
                if (this.schemaValidationErrors.length > 0) {
                    this.logger.warn('Schema validation failed with errors. Please check the GraphQL schema and fix potential issues.')
                    for(const error of this.schemaValidationErrors) {
                        this.logger.error('A schema validation error occurred: ', error)
                    }
                }
            }
        } else {
            this.logger.warn('Schema update was rejected because condition set in "shouldUpdateSchema" check was not fulfilled.')
        }
    }

    /** Defines whether a schema update should be executed. Default behaviour: If schema is undefined return false.
     * @param {GraphQLSchema} schema - The new schema to use as updated schema.
     * @returns {boolean} True if schema should be updated, false if not
     */
    shouldUpdateSchema(schema?: GraphQLSchema): boolean {
        return !!schema;
    }

    getSchemaValidationErrors():  ReadonlyArray<GraphQLError> | undefined {
        return this.schemaValidationErrors
    }

    async handleRequest(request: Request, response: Response): Promise<void> {
        // Reject requests that do not use GET and POST methods.
        if (request.method !== 'GET' && request.method !== 'POST') {
            return this.sendResponse(response,
                {errors: [new GraphQLError('GraphQL server only supports GET and POST requests.')]},
                405,
                { Allow: 'GET, POST' })
        }

        // Reject requests if schema is invalid
        if (!this.schema || this.schemaValidationErrors.length > 0) {
            return this.sendInvalidSchemaResponse(request, response)
        }

        // Extract graphql parameters (query, variables, operationName, raw) from request

        // Reject request if no query parameter is provided

        // Parse given GraphQL source into a document (parse(query) function)

        // Validate document against schema (validate(schema, document, rules) function). Return 400 for errors

        // Reject request if get method is used for non-query(mutation) requests. Check with getOperationAST(document, operationName) function. Return 405 if thats the case

        // Perform execution (execute(schema, document, variables, operationName, resolvers) function). Return 400 if errors are available

        // Handle extensionFunction if one is provided

        // Set status code to 500 if status is 200 and data is empty

        // Format errors if custom formatError functions is provided.


        //Prepare example response
        const exampleResponseData = {response:'hello world'}
        this.logDebugIfEnabled(`Create response from data ${exampleResponseData}`)
        return this.sendResponse(response, {data: exampleResponseData})
    }

    sendResponse(response: Response,
        executionResult: ExecutionResult,
        statusCode = 200,
        customHeaders: { [key: string]: string } = {} ): void {

        this.logDebugIfEnabled(`Preparing response with executionResult ${JSON.stringify(executionResult)}, status code ${statusCode} and custom headers ${JSON.stringify(customHeaders)}`)
        response.statusCode = statusCode
        response.setHeader('Content-Type', 'application/json; charset=utf-8')
        if (customHeaders != null) {
            for (const [key, value] of Object.entries(customHeaders)) {
                this.logDebugIfEnabled(`Set custom header ${key} to ${value}`)
                response.setHeader(key, String(value));
            }
        }
        response.end(Buffer.from(JSON.stringify(executionResult), 'utf8'))
    }

    logDebugIfEnabled(message: string): void {
        if (this.debug) {
            this.logger.debug(message)
        }
    }

    /** Sends a fitting response if the schema used by the GraphQL server is invalid */
    sendInvalidSchemaResponse(request: Request, response: Response): void {
        return this.sendResponse(response,
            {errors: [new GraphQLError('Request cannot be processed. Schema in GraphQL server is invalid.')]},
            500)
    }
}
