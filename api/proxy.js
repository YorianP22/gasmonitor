// api/proxy.js
export default async function handler(req, res) {
  // Hanya menerima POST
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const GAS_URL = 'https://script.google.com/macros/s/AKfycbwrzYnTZM7JIcDv4sqsG3iFbCclENqIcepG0ISGqceWVAFtSNeI0fQS5Ifs7MnTuwnPow/exec';
  
  // Timeout 9 detik (Vercel limit 10 detik)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9000);

  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const text = await response.text();
    // Coba parse sebagai JSON
    try {
      const json = JSON.parse(text);
      return res.status(response.status).json(json);
    } catch (parseError) {
      console.error('GAS response not JSON:', text.substring(0, 500));
      return res.status(502).json({
        success: false,
        error: 'Google Apps Script mengembalikan HTML, bukan JSON.',
        hint: 'Periksa deployment Web App (Execute as: Me, Akses: Anyone)',
        preview: text.substring(0, 300)
      });
    }
  } catch (fetchError) {
    clearTimeout(timeoutId);
    console.error('Proxy fetch error:', fetchError);
    if (fetchError.name === 'AbortError') {
      return res.status(504).json({ success: false, error: 'Timeout: Google Apps Script tidak merespon dalam 9 detik' });
    }
    return res.status(502).json({ success: false, error: fetchError.message });
  }
}
