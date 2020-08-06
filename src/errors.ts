import { HandlerFunction } from 'got/dist/source';

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
export class VaultError extends Error {
  public errors: string[];
  public code?: number;
  constructor(message: string, errors?: string[]) {
    super(message);
    this.errors = [];
  }
}

export const errorHandler: HandlerFunction = async (options, next) => {
  try {
    const response = await next(options);
    return response;
  } catch (error) {
    throw new VaultError(error);
  }
};
