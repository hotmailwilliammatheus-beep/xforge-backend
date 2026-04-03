export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const response = await fetch('https://api.internal.temp-mail.io/api/v3/domains', {
            method: 'GET',
            headers: {
                'accept': '*/*',
                'application-name': 'web',
                'application-version': '4.0.0',
                'x-cors-header': 'iaWg3pchvFx48fY',
                'user-agent': 'Mozilla/5.0'
            }
        });

        if (!response.ok) throw new Error(`Erro na API interna: ${response.status}`);
        const data = await response.json();
        
        const formatted = data.domains.map(d => ({ domain: d.name.replace('@', '') }));
        res.status(200).json({ 'hydra:member': formatted });
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar domínios Temp-Mail" });
    }
}
