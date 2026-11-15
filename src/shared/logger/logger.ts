/**
 * Clean native console logger (Pino completely removed)
 */
export const logger = {
  info: (message: any, ...optionalParams: any[]): void => {
    if (typeof message === "string") {
      console.log(message, ...optionalParams);
    } else {
      console.log(...optionalParams, message);
    }
  },
  warn: (message: any, ...optionalParams: any[]): void => {
    if (typeof message === "string") {
      console.warn(message, ...optionalParams);
    } else {
      console.warn(...optionalParams, message);
    }
  },
  error: (message: any, ...optionalParams: any[]): void => {
    if (typeof message === "string") {
      console.error(message, ...optionalParams);
    } else {
      console.error(...optionalParams, message);
    }
  },
  debug: (_message: any, ..._optionalParams: any[]): void => {},
};

export type Logger = typeof logger;
