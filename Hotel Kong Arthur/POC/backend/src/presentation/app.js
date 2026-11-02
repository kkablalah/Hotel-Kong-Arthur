// Express-appen: middleware, kontraktvalidering og routes. Starter ikke selv serveren, så tests kan bruge den.
const path = require('node:path');
const express = require('express');
const OpenApiValidator = require('express-openapi-validator');
const { notFoundHandler, errorHandler } = require('./errors');

const roomsRouter = require('./routes/rooms');
const bookingsRouter = require('./routes/bookings');
const metricsRouter = require('./routes/metrics');
const cocktailRouter = require('./routes/cocktail');

const specPath = path.join(__dirname, '../../../openapi/openapi.yaml');

// Stierne her bruges også af kontrakttesten (T056).
const routers = {
  '/api': roomsRouter,
  '/api/bookings': bookingsRouter,
  '/api/metrics': metricsRouter,
  '/api/cocktail': cocktailRouter,
};

function allowSwaggerUi(req, res, next) {
  res.set('Access-Control-Allow-Origin', 'http://localhost:8080');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  return next();
}

const app = express();
app.use(allowSwaggerUi);
app.use(express.json());
app.use(
  OpenApiValidator.middleware({
    apiSpec: specPath,
    validateRequests: true,
    validateResponses: true,
  })
);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

for (const [mountPath, router] of Object.entries(routers)) {
  app.use(mountPath, router);
}

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = { app, routers, specPath };
