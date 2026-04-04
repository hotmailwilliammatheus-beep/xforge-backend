export default async function handler(req, res) {
    // 1. Libera o CORS apenas para o seu frontend poder ler a resposta
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

    // Responde ao preflight do navegador
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 2. Coloque sua chave secreta AQUI (ela não vaza para o usuário)
    const SONJJ_API_KEY = "SUA_API_KEY_AQUI";

    // 3. Pega os parâmetros que o nosso frontend vai enviar
    const { path, email, id, payload } = req.query;

    if (!path) {
        return res.status(400).json({ error: 'O parâmetro "path" é obrigatório.' });
    }

    // 4. Monta a URL oficial da Sonjj
    const targetUrl = new URL(`https://app.sonjj.com${path}`);
    if (email) targetUrl.searchParams.append('email', email);
    if (id) targetUrl.searchParams.append('id', id);
    if (payload) targetUrl.searchParams.append('payload', payload);

    try {
        // 5. Faz a requisição oficial passando a SUA chave no cabeçalho
        const fetchRes = await fetch(targetUrl.toString(), {
            method: 'GET',
            headers: {
                'X-Api-Key': SONJJ_API_KEY,
                'Accept': 'application/json'
            }
        });

        // 6. Lê a resposta da Sonjj
        const textData = await fetchRes.text();

        try {
            // Tenta devolver como JSON bonitinho
            const jsonData = JSON.parse(textData);
            return res.status(fetchRes.status).json(jsonData);
        } catch (parseError) {
            // Se não for JSON (ex: erro 404 vazio), devolve como texto mesmo
            return res.status(fetchRes.status).send(textData);
        }

    } catch (error) {
        console.error("Erro interno no Proxy Vercel:", error);
        return res.status(500).json({ error: 'Falha ao se comunicar com a Sonjj.' });
    }
}
