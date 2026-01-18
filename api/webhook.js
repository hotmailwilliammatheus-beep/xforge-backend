// ARQUIVO: api/webhook.js
const admin = require('firebase-admin');
const mercadopago = require('mercadopago'); // Importante para checar o pagamento

// 1. Configura o Mercado Pago
mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN
});

// 2. Inicializa o Firebase
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY 
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
        : undefined,
    })
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  // Correção de CORS para o Webhook também
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // O Mercado Pago as vezes manda GET para testar se o link existe
  if (req.method !== 'POST') {
    return res.status(200).send('Webhook Online');
  }

  try {
    const { query, body } = req;
    
    // 3. PEGA O ID DO PAGAMENTO
    // O Mercado Pago pode mandar o ID na URL (query) ou no corpo (body)
    const paymentId = query.id || query['data.id'] || (body.data && body.data.id);

    if (!paymentId) {
        // Se for um aviso sem ID de pagamento (ex: aviso de sistema), ignoramos
        return res.status(200).send('Ignorado: Sem ID de pagamento');
    }

    // 4. VERIFICAÇÃO DE SEGURANÇA (Crucial!)
    // Vamos perguntar ao Mercado Pago: "Esse ID pagou mesmo?"
    const payment = await mercadopago.payment.get(paymentId);
    
    const statusPagamento = payment.body.status;
    const emailUsuario = payment.body.external_reference; // O e-mail que você enviou no checkout

    console.log(`Pagamento ${paymentId}: ${statusPagamento} para ${emailUsuario}`);

    // 5. Se estiver APROVADO, libera o Premium
    if (statusPagamento === 'approved' && emailUsuario) {
        
        // Busca o usuário no Firebase
        const snapshot = await db.collection('users')
            .where('email', '==', emailUsuario)
            .limit(1)
            .get();

        if (snapshot.empty) {
            console.log("Usuário não encontrado no banco.");
            // Retornamos 200 para o MP parar de mandar aviso, mesmo com erro nosso
            return res.status(200).send('Erro: Usuário não existe');
        }

        const userId = snapshot.docs[0].id;
        
        // Atualiza para Premium
        await db.collection('users').doc(userId).update({
            isPremium: true,
            premiumDate: admin.firestore.FieldValue.serverTimestamp(),
            metodo: 'mercadopago_automatico'
        });

        console.log("SUCESSO: Premium Ativado!");
        return res.status(200).send('OK: Ativado');
    }

    return res.status(200).send('OK: Recebido (Pendente ou Recusado)');

  } catch (erro) {
    console.error("Erro no Webhook:", erro);
    return res.status(200).send('Erro processado'); 
  }
}