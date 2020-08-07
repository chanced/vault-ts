import got, { HandlerFunction } from 'got/dist/source';
import Debug from 'debug';
const debug = Debug('vault');
const debugError = Debug('vault:error');

function getMessageFromErrorCode(statusCode: number | string | undefined) {
  if (typeof statusCode === 'string') {
    statusCode = Number.parseInt(statusCode);
  }
  if (typeof statusCode !== 'number') {
    return undefined;
  }
  switch (statusCode) {
    case 400:
      return 'Invalid request, missing or invalid data.';
    case 403:
      return "Forbidden, your authentication details are either incorrect, you don't have access to this feature, or - if CORS is enabled - you made a cross-origin request from an origin that is not allowed to make such requests.";
    case 404:
      return "Invalid path. This can both mean that the path truly doesn't exist or that you don't have permission to view a specific path. Vault uses 404 in some cases to avoid state leakage.";
    case 429:
      return 'Default return code for health status of standby nodes.';
    case 473:
      return 'Default return code for health status of performance standby nodes.';
    case 500:
      return 'Internal server error. An internal error has occurred, try again later. If the error persists, report a bug.';
    case 502:
      return 'A request to Vault required Vault making a request to a third party; the third party responded with an error of some kind.';
    case 503:
      return 'Vault is down for maintenance or is currently sealed. Try again later.';
    default:
      return undefined;
  }
}

interface VaultErrorParams {
  statusCode?: number | string;
  retryCount?: number;
  errors?: string[];
  body: unknown;
  stack?: string;
  name: string;
}
export class VaultError extends Error {
  name: string;
  errors: string[];
  statusCode?: number;
  retryCount?: number;
  body?: unknown;
  stack?: string;

  constructor({ name, errors, statusCode, retryCount, body, stack }: VaultErrorParams) {
    super(getMessageFromErrorCode(statusCode));
    this.statusCode = typeof statusCode === 'string' ? Number.parseInt(statusCode) : statusCode;
    this.errors = errors || [];
    this.name = name;
    this.retryCount = retryCount;
    this.stack = stack;
    this.body = body;
  }
}

export const errorHandler: HandlerFunction = async (options, next) => {
  try {
    const response = await next(options);
    return response;
  } catch (err) {
    if (err instanceof got.HTTPError) {
      const body = err.response?.body;
      const retryCount = err.response.retryCount;
      const statusCode = err.code;
      let errors: string[] | undefined;
      if (typeof body === 'string' && body.length) {
        try {
          const parsed = JSON.parse(body);
          if (parsed) {
            const parsedErrors = parsed['errors'];
            if (Array.isArray(parsedErrors)) {
              errors = parsedErrors;
            }
          }
        } catch (parseError) {
          debugError(parseError);
        }
      }

      throw new VaultError({
        statusCode,
        retryCount,
        name: err.name,
        errors,
        body,
        stack: err.stack
      });
    }
    throw err;
  }
};
