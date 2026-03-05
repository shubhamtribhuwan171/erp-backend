export class HttpError extends Error {
  status: number
  code?: string

  constructor(status: number, message: string, code?: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.code = code
  }
}

export function isHttpError(err: unknown): err is HttpError {
  return err instanceof HttpError || (typeof err === 'object' && err !== null && (err as any).name === 'HttpError')
}

export const httpErrors = {
  badRequest: (message = 'Bad request', code?: string) => new HttpError(400, message, code),
  unauthorized: (message = 'Unauthorized', code?: string) => new HttpError(401, message, code),
  forbidden: (message = 'Forbidden', code?: string) => new HttpError(403, message, code),
  notFound: (message = 'Not found', code?: string) => new HttpError(404, message, code),
  conflict: (message = 'Conflict', code?: string) => new HttpError(409, message, code),
}
