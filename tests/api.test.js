const request = require('supertest');
const express = require('express');

// Mock dos serviços
jest.mock('../src/services/knowledgeBase');
jest.mock('../src/services/emailGenerator');

const KnowledgeBase = require('../src/services/knowledgeBase');
const EmailGenerator = require('../src/services/emailGenerator');

// Setup da aplicação para teste
const app = express();
app.use(express.json());

const knowledgeBase = new KnowledgeBase();
const emailGenerator = new EmailGenerator();

app.post('/generate-email', async (req, res) => {
  try {
    const { prompt, emailId } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt é obrigatório' });
    }

    const knowledge = knowledgeBase.getKnowledge();
    const emailData = emailId ? { id: 1, nome: 'Test User' } : {};
    
    const generatedEmail = await emailGenerator.generateEmail(prompt, knowledge, emailData);
    
    res.json({
      success: true,
      email: generatedEmail,
      recipient: emailData
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/emails', (req, res) => {
  res.json([{ id: 1, nome: 'Test User', email: 'test@test.com' }]);
});

describe('API Tests', () => {
  beforeEach(() => {
    // Mock das funções
    knowledgeBase.getKnowledge = jest.fn().mockReturnValue('Base de conhecimento mock');
    emailGenerator.generateEmail = jest.fn().mockResolvedValue('Email gerado com sucesso');
  });

  test('POST /generate-email - deve gerar email com sucesso', async () => {
    const response = await request(app)
      .post('/generate-email')
      .send({
        prompt: 'Gere um email de apresentação',
        emailId: 1
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.email).toBe('Email gerado com sucesso');
    expect(emailGenerator.generateEmail).toHaveBeenCalledWith(
      'Gere um email de apresentação',
      'Base de conhecimento mock',
      { id: 1, nome: 'Test User' }
    );
  });

  test('GET /emails - deve retornar lista de emails', async () => {
    const response = await request(app).get('/emails');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { id: 1, nome: 'Test User', email: 'test@test.com' }
    ]);
  });
});