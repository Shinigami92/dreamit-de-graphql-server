import {Logger} from '../logger/Logger';
import {
    DocumentNode,
    GraphQLError,
    GraphQLSchema,
    ParseOptions,
    Source
} from 'graphql';
import {GraphQLRequestInformationExtractor} from './GraphQLRequestInformationExtractor';
import {ValidationRule} from 'graphql/validation/ValidationContext';
import {TypeInfo} from 'graphql/utilities/TypeInfo';

export interface GraphQLServerOptions {
    readonly logger?: Logger
    readonly debug?: boolean
    requestInformationExtractor?: GraphQLRequestInformationExtractor
    schema?: GraphQLSchema | undefined
    schemaValidationFunction?: (schema: GraphQLSchema) => ReadonlyArray<GraphQLError>
    parseFunction?: (source: string | Source, options?: ParseOptions) => DocumentNode
    validateFunction?: (schema: GraphQLSchema, documentAST: DocumentNode, rules?: ReadonlyArray<ValidationRule>, typeInfo?: TypeInfo, options?: { maxErrors?: number },)
        => ReadonlyArray<GraphQLError>
}
