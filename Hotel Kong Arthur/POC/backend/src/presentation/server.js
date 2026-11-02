// Starter backenden. Porten er fast, fordi alle services bruger backend:8000 (plan afsnit 7).
const { app } = require('./app');

const PORT = 8000;

app.listen(PORT, () => {
  console.log(`Backend lytter på port ${PORT}`);
});
