import type { ErrorRequestHandler } from 'express';

const productionErrorMessages: Record<number, string> = {
  400: 'Invalid request',
  401: 'Authentication is required',
  403: 'Access denied',
  404: 'Resource not found',
  409: 'Request conflict',
  413: 'Uploaded file is too large',
  429: 'Too many requests'
};

function getProductionMessage(statusCode: number) {
  return productionErrorMessages[statusCode] ?? 'Internal server error';
}

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  const statusCode = response.statusCode === 200 ? 500 : response.statusCode;
  const isProduction = process.env.NODE_ENV === 'production';
  const message = isProduction
    ? getProductionMessage(statusCode)
    : error instanceof Error
      ? error.message
      : 'Internal server error';

  if (isProduction && statusCode >= 500) {
    console.error('Request failed', {
      statusCode,
      errorName: error instanceof Error ? error.name : 'UnknownError',
      method: request.method,
      path: request.path,
      timestamp: new Date().toISOString()
    });
  }

  response.status(statusCode).json({
    success: false,
    message
  });
};
