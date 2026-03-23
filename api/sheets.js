// Vercel serverless proxy — forwards requests to the Google Apps Script web app.
// Set SHEETS_API_URL in Vercel environment variables (no VITE_ prefix needed;
// this runs server-side so the URL never appears in the browser bundle).

export default async function handler(req, res) {
  const apiUrl = process.env.SHEETS_API_URL;
  if (!apiUrl) {
    return res.status(500).json({ error: 'SHEETS_API_URL not configured' });
  }

  const url = new URL(apiUrl);
  Object.entries(req.query).forEach(([k, v]) => url.searchParams.set(k, String(v)));

  try {
    const response = await fetch(url.toString());
    const data = await response.json();
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: 'Failed to reach Sheets API', detail: String(err) });
  }
}
