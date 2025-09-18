const OpenAI = require('openai');

class EmailGenerator {
  constructor() {
    this.mockMode = process.env.MOCK_OPENAI === 'true';
    
    if (!this.mockMode) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
  }

  async generateEmail(prompt, knowledgeBase, emailData = {}) {
    if (this.mockMode) {
      return this.generateMockEmail(prompt, emailData);
    }

    const systemPrompt = `Você é um assistente especializado em gerar emails personalizados.
    
Base de conhecimento disponível:
${knowledgeBase}

Dados do destinatário: ${JSON.stringify(emailData)}

Gere um email profissional e personalizado baseado na base de conhecimento fornecida.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Erro ao gerar email:', error);
      throw error;
    }
  }

  generateMockEmail(prompt, emailData) {
    const nome = emailData.nome || 'Cliente';
    const empresa = emailData.empresa || 'Empresa';
    
    return `Assunto: ${prompt}

Olá ${nome},

Este é um email gerado automaticamente baseado no prompt: "${prompt}"

Informações do destinatário:
- Nome: ${nome}
- Empresa: ${empresa}

Este email foi gerado em modo de teste (MOCK) para desenvolvimento local.

Atenciosamente,
Sistema de Geração de Emails`;
  }
}

module.exports = EmailGenerator;