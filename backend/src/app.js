import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import bookingRoutes from './routes/bookings.js';

const app = express();
const PORT = process.env.PORT || 3000;

// --- Præsentationslag: middelvare ---
app.use(cors());
app.use(express.json());

// OpenAPI specifikation tilgængelig via Swagger UI
const swaggerDocument = YAML.load('./openapi.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API ruter (præsentationslag)
app.use('/api', bookingRoutes);

// Sundhedstjek
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'hotel-kong-arthur-backend' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ikke fundet' });
});

// Global fejlhåndtering
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Intern serverfejl', detail: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend kører på http://0.0.0.0:${PORT}`);
  console.log(`Swagger UI tilgængelig på http://0.0.0.0:${PORT}/api-docs`);
});

export default app;
