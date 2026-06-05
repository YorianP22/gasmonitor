export default async function handler(req, res) {
 
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });


  const GAS_URL = 'https://script.google.com/macros/s/AKfycbwrzYnTZM7JIcDv4sqsG3iFbCclENqIcepG0ISGqceWVAFtSNeI0fQS5Ifs7MnTuwnPow/exec';

  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body) 
    });

    const text = await response.text();
  
    try {
      const json = JSON.parse(text);
      return res.status(response.status).json(json);
    } catch (e) {
      console.error('GAS mengembalikan HTML:', text.substring(0, 200));
      return res.status(502).json({ 
        error: 'GAS response bukan JSON', 
        hint: 'Cek pas Deploy Status e ke semua ya',
        preview: text.substring(0, 200)
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Proxy error', details: err.message });
  }
}