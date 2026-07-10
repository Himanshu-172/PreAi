import type { Request, Response } from 'express';

export function getHealth(_request: Request, response: Response) {
  response.status(200).json({
    success: true,
    message: 'PrepAI API is running'
  });
}
