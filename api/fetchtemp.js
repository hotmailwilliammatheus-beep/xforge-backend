export default async function handler(req, res) {
    // Configura o CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "Email requerido" });

    try {
        const response = await fetch(`https://api.internal.temp-mail.io/api/v3/email/${email}/messages`, {
            method: 'GET',
            headers: {
                'accept': '*/*',
                'application-name': 'web',
                'application-version': '4.0.0',
                'x-cors-header': 'iaWg3pchvFx48fY',
                'user-agent': 'Mozilla/5.0'
            }
        });

        if (!response.ok) {
            throw new Error(`Erro na API interna: ${response.status}`);
        }

        const data = await response.json();

        const formatted = data.map(msg => ({
            id: msg.id,
            subject: msg.subject,
            from: { address: msg.from },
            intro: msg.body_text ? msg.body_text.substring(0, 60) + "..." : "Clique para abrir...",
            createdAt: msg.created_at,
            body_html: msg.body_html,
            body_text: msg.body_text,
            isTempIo: true 
        }));

        res.status(200).json({ 'hydra:member': formatted });
    } catch (error) {
        console.error("Erro interno no proxy de leitura:", error);
        res.status(500).json({ error: "Erro no Proxy de mensagens" });
    }
}
