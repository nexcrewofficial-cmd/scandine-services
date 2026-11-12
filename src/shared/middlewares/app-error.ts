/**
 * Represents an API error that can be handled.
 * @param {string} message - corresponding error message.
 * @param {number} statusCode - corresponding http status code.
 */
export class APIError<T = unknown> extends Error {
  statusCode: number;
  success: boolean;
  errorCode?: string;
  data?: T;

  constructor(message: string, statusCode: number, errorCode?: string, data?: T) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.errorCode = errorCode;
    this.data = data;
    Error.captureStackTrace(this, this.constructor);
  }
}

/** Generates a custom api error with given message and status code. */
export const generateAPIError = async <T = unknown>(
  msg: string,
  statusCode: number = 400,
  errorCode?: string,
  data?: T
): Promise<never> => {
  console.log(msg, statusCode, "error");
  throw new APIError(msg, statusCode, errorCode, data);
};
