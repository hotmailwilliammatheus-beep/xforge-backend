const mercadopago = require('mercadopago');

// Pega o token das configurações da Vercel
mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN
});

export default async function handler(req, res) {
  // --- INICIO: CORREÇÃO DE SEGURANÇA (CORS) ---
  // Isso permite que seu site (mesmo local ou web.app) fale com esse backend
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Se o navegador fizer uma pergunta de verificação (OPTIONS), respondemos OK
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  // --- FIM DA CORREÇÃO ---

  if (req.method !== 'POST') {
    return res.status(405).send('Método não permitido');
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    // Configuração da compra
    const preference = {
      items: [
        {
          title: 'X_ForgeMail Premium (Vitalício)',
          unit_price: 10.00, // Preço R$ 10,00
          quantity: 1,
          currency_id: 'BRL'
        }
      ],
      external_reference: email, // O e-mail vai "grudado" na compra
      notification_url: "https://xforge-backend.vercel.app/api/webhook", // Avisa o webhook
      back_urls: {
        success: "https://xforgemail.web.app", // Para onde volta se der certo
        failure: "https://xforgemail.web.app",
        pending: "https://xforgemail.web.app"
      },
      auto_return: "approved"
    };

    const response = await mercadopago.preferences.create(preference);
    
    // Devolve o link de pagamento
    return res.status(200).json({ link: response.body.init_point });

  } catch (error) {
    console.error("Erro MP:", error);
    return res.status(500).json({ error: 'Erro ao gerar link de pagamento' });
  }
}