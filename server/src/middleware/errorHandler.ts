import type { ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  const statusCode = response.statusCode === 200 ? 500 : response.statusCode;

  response.status(statusCode).json({
    success: false,
    message: error instanceof Error ? error.message : 'Internal server error'
  });
};
