export default async function handler(req, res) {
  try {
    const apiUrl = process.env.SHEETS_API_URL;
    if (!apiUrl) {
      return res.status(500).json({ error: 'SHEETS_API_URL env var is not set' });
    }

    const url = new URL(apiUrl);
    Object.entries(req.query).forEach(([k, v]) => url.searchParams.set(k, String(v)));

    const response = await fetch(url.toString(), { redirect: 'follow' });
    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      // Apps Script returned non-JSON (e.g. an error page) — surface it for debugging
      return res.status(502).json({ error: 'Non-JSON response from Sheets API', body: text.slice(0, 500) });
    }

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: 'Sheets API proxy failed', detail: String(err) });
  }
}
