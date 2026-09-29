try {
  process.loadEnvFile();
} catch {}
if (!process.env.ADMIN_API_TOKEN) {
  console.error('Run npm run setup first.');
  process.exit(1);
}
const [id, status] = process.argv.slice(2);
if (id && (!status || !['pending', 'contacted', 'confirmed', 'cancelled'].includes(status))) {
  console.error(
    'Usage: npm run bookings OR npm run bookings -- BOOKING_ID contacted|confirmed|cancelled|pending',
  );
  process.exit(1);
}
const base = process.env.ADMIN_API_BASE || `http://localhost:${process.env.PORT || 4173}`;
try {
  const response = await fetch(
    base + '/api/bookings' + (id ? '/' + encodeURIComponent(id) : '?limit=100'),
    {
      method: id ? 'PATCH' : 'GET',
      headers: {
        Authorization: 'Bearer ' + process.env.ADMIN_API_TOKEN,
        'Content-Type': 'application/json',
      },
      ...(id ? { body: JSON.stringify({ status }) } : {}),
    },
  );
  const data = await response.json();
  if (!response.ok) throw new Error(`${response.status}: ${data.error}`);
  if (id) console.log(data);
  else
    console.table(
      data.bookings.map(({ id, name, phone, preferred_date, preferred_time, status }) => ({
        id,
        name,
        phone,
        date: preferred_date,
        time: preferred_time,
        status,
      })),
    );
} catch (error) {
  console.error('Could not access bookings:', error.message);
  process.exitCode = 1;
}
