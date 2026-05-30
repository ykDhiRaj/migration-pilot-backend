import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '@core/errors';

type Target = 'body' | 'query' | 'params';

/**
 * Returns an Express middleware that validates `req[target]` against `schema`.
 * On success the parsed (and transformed) data replaces `req[target]`.
 * On failure throws `ValidationError` (caught by the global error handler).
 *
 * Usage:
 *   router.post('/register', validate(RegisterSchema), handler)
 *   router.get('/:id',       validate(IdParamSchema, 'params'), handler)
 */
export function validate<T>(schema: ZodSchema<T>, target: Target = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const fieldErrors = flattenZodError(result.error);
      return next(new ValidationError(fieldErrors));
    }

    (req as any)[target] = result.data;
    next();
  };
}

function flattenZodError(error: ZodError): Record<string, string[]> {
  const flat = error.flatten();
  const out: Record<string, string[]> = {};

  for (const [field, msgs] of Object.entries(flat.fieldErrors)) {
    if (msgs?.length) out[field] = msgs;
  }

  if (flat.formErrors.length) {
    out._form = flat.formErrors;
  }

  return out;
}
