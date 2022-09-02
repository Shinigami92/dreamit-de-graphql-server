import {
    INTROSPECTION_DISABLED_ERROR,
    VALIDATION_ERROR
} from '..'

/**
 * Determines if an error is a ValidationError or
 * IntrospectionDisabledError using the information in the error message
 * @param {unknown} error - An error
 * @returns {string} INTROSPECTION_DISABLED_ERROR if error is an IntrospectionDisabledError,
 * ValidationError otherwise
 */
export function determineValidationOrIntrospectionDisabledError(error: unknown): string {
    return error instanceof Error && error.message && (error.message.includes('introspection')
        && error.message.includes('disabled')) ? INTROSPECTION_DISABLED_ERROR : VALIDATION_ERROR
}
