// api/webhook.js
const admin = require('firebase-admin');

// 1. Inicializa o Firebase com as chaves secretas (Variáveis de Ambiente)
// O "if" garante que não vai iniciar duas vezes e dar erro
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Corrige a formatação da chave privada (quebra de linha)
      privateKey: process.env.FIREBASE_PRIVATE_KEY 
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
        : undefined,
    })
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  // Apenas aceita POST (que é como os Webhooks mandam dados)
  if (req.method !== 'POST') {
    return res.status(405).send('Método não permitido');
  }

  try {
    const dados = req.body;

    // --- LÓGICA DO MERCADO PAGO (Exemplo) ---
    // Você deve adaptar isso dependendo se usar Stripe, MP, etc.
    // O Mercado Pago geralmente manda: type: "payment" e data.id
    
    // Vamos supor uma lógica genérica simplificada:
    // O gateway precisa mandar o status "approved" e o email do usuário
    const statusPagamento = dados.status; // ou dados.data.status
    const emailUsuario = dados.external_reference; // É aqui que vc mandou o email na hora de criar o link

    if (statusPagamento === 'approved' && emailUsuario) {
        
        console.log(`Recebido pagamento para: ${emailUsuario}`);

        // 2. Busca o usuário no banco pelo E-mail
        const snapshot = await db.collection('users')
            .where('email', '==', emailUsuario)
            .limit(1)
            .get();

        if (snapshot.empty) {
            console.log("Usuário não encontrado.");
            return res.status(404).send('Usuário não encontrado no banco');
        }

        // 3. Atualiza para Premium
        const userId = snapshot.docs[0].id;
        
        await db.collection('users').doc(userId).update({
            isPremium: true,
            premiumDate: admin.firestore.FieldValue.serverTimestamp(),
            metodo: 'webhook_vercel_v1'
        });

        console.log("Sucesso! Premium ativado.");
        return res.status(200).send('OK: Premium Ativado');
    }

    // Se o pagamento for pendente ou recusado
    return res.status(200).send('OK: Recebido, mas não aprovado.');

  } catch (erro) {
    console.error("Erro no servidor:", erro);
    return res.status(500).send('Erro interno do servidor');
  }
}