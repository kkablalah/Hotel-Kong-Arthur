// Fejl fra forretningsreglerne. Business-laget kender kun fejlkoden, ikke HTTP-statuskoden.
class BusinessError extends Error {
  constructor(code, message, details) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

module.exports = { BusinessError };
