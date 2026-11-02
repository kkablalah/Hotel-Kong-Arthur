// Fælles fejlformat. Svaret indeholder aldrig stack traces eller interne detaljer (NFR-10).
const { BusinessError } = require('../business/errors');

const statusByCode = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  NO_DATA: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
};

function sendError(res, status, code, message, details) {
  const error = { code, message };
  if (details && details.length > 0) error.details = details;
  res.status(status).json({ error });
}

function notFoundHandler(req, res) {
  sendError(res, 404, 'NOT_FOUND', 'Ressourcen findes ikke');
}

// Express genkender en fejlhåndtering på de fire parametre, så next skal stå her.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof BusinessError) {
    return sendError(res, statusByCode[err.code] || 500, err.code, err.message, err.details);
  }
  // Fejl fra express-openapi-validator og fra læsning af JSON.
  if (err.status === 400 || err.status === 415) {
    const details = (err.errors || []).map((e) => ({ field: e.path, message: e.message }));
    return sendError(res, 400, 'VALIDATION_ERROR', 'Ugyldigt input', details);
  }
  if (err.status === 404) return sendError(res, 404, 'NOT_FOUND', 'Ressourcen findes ikke');
  if (err.status === 405) return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Metoden er ikke tilladt');

  console.error('Uventet fejl:', err.message);
  return sendError(res, 500, 'INTERNAL_ERROR', 'Der opstod en uventet fejl');
}

module.exports = { notFoundHandler, errorHandler };
