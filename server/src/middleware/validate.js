export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    return next(Object.assign(result.error, { isZod: true }));
  }
  req[source] = result.data;
  next();
};
