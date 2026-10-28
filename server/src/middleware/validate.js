import { ApiError } from '../utils/ApiError.js';

// validate(schema, 'body' | 'query' | 'params') parses input and stores the cleaned value.
// req.query is read-only in Express 5, so parsed query lands on req.validQuery.
export const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source] ?? {});
  if (!result.success) {
    const issue = result.error.issues[0];
    const where = issue.path.length ? `${issue.path.join('.')}: ` : '';
    return next(ApiError.unprocessable(`${where}${issue.message}`));
  }
  if (source === 'query') req.validQuery = result.data;
  else req[source] = result.data;
  next();
};
