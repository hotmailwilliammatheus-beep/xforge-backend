export default async function handler(req, res) {
    // Configura o CORS para permitir que o seu site no Firebase acesse essa API
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); // Permite qualquer origem
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    // Se for uma requisição OPTIONS (preflight do navegador), responde OK rápido
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
                'x-cors-header': 'iaWg3pchvFx48fY', // O Token mágico
                'user-agent': 'Mozilla/5.0'
            }
        });

        if (!response.ok) {
            throw new Error(`Erro na API interna: ${response.status}`);
        }

        const data = await response.json();
        
        // Padroniza a resposta para o formato que o seu HTML (X_ForgeMail) já entende
        const formatted = data.domains.map(d => ({ 
            domain: d.name.replace('@', '') 
        }));

        res.status(200).json({ 'hydra:member': formatted });
    } catch (error) {
        console.error("Erro interno no proxy de dominios:", error);
        res.status(500).json({ error: "Erro ao buscar domínios Temp-Mail" });
    }
}
