require('dotenv').config();
const express = require('express');
const cors = require('cors');
const KnowledgeBase = require('./services/knowledgeBase');
const EmailGenerator = require('./services/emailGenerator');
const emailsData = require('./data/emails.json');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const knowledgeBase = new KnowledgeBase();
const emailGenerator = new EmailGenerator();

// Carrega a base de conhecimento na inicialização
knowledgeBase.loadKnowledge().catch(console.error);

app.post('/generate-email', async (req, res) => {
  try {
    const { prompt, emailId } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt é obrigatório' });
    }

    const knowledge = knowledgeBase.getKnowledge();
    const emailData = emailId ? emailsData.find(e => e.id === emailId) : {};
    
    const generatedEmail = await emailGenerator.generateEmail(prompt, knowledge, emailData);
    
    res.json({
      success: true,
      email: generatedEmail,
      recipient: emailData
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/emails', (req, res) => {
  res.json(emailsData);
});

app.get('/reload-knowledge', async (req, res) => {
  try {
    await knowledgeBase.loadKnowledge();
    res.json({ success: true, message: 'Base de conhecimento recarregada' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao recarregar base de conhecimento' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`API disponível em http://localhost:${PORT}`);
});