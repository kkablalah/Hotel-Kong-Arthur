// Sæsoner efter BR-03. Datoen er ISO 8601 (YYYY-MM-DD), og værdierne er de samme som i stays.season.
function seasonOf(isoDate) {
  const monthDay = isoDate.slice(5, 10);

  if (monthDay >= '06-01' && monthDay <= '08-31') return 'high';
  if (monthDay >= '12-20' || monthDay <= '01-05') return 'high';
  if (monthDay >= '04-01' && monthDay <= '05-31') return 'mid';
  if (monthDay >= '09-01' && monthDay <= '10-31') return 'mid';
  return 'low';
}

module.exports = { seasonOf };
