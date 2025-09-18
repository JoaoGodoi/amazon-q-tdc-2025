const AWS = require('aws-sdk');
const OpenAI = require('openai');

const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.handler = async (event) => {
  try {
    const { prompt, emailId } = JSON.parse(event.body);
    
    // Buscar PDFs do S3
    const knowledge = await loadKnowledgeFromS3();
    
    // Buscar dados do email do DynamoDB
    const emailData = emailId ? await getEmailFromDynamoDB(emailId) : {};
    
    // Gerar email com OpenAI
    const generatedEmail = await generateEmailWithOpenAI(prompt, knowledge, emailData);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        email: generatedEmail,
        recipient: emailData
      })
    };
  } catch (error) {
    console.error('Erro:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno do servidor' })
    };
  }
};

async function loadKnowledgeFromS3() {
  const params = { Bucket: process.env.PDFS_BUCKET };
  const objects = await s3.listObjectsV2(params).promise();
  
  let knowledge = '';
  for (const obj of objects.Contents) {
    if (obj.Key.endsWith('.pdf')) {
      // Aqui você implementaria a extração de texto do PDF
      // Por simplicidade, assumindo que o texto já está extraído
      const data = await s3.getObject({ Bucket: process.env.PDFS_BUCKET, Key: obj.Key }).promise();
      knowledge += `=== ${obj.Key} ===\n${data.Body.toString()}\n\n`;
    }
  }
  return knowledge;
}

async function getEmailFromDynamoDB(emailId) {
  const params = {
    TableName: process.env.EMAILS_TABLE,
    Key: { id: emailId.toString() }
  };
  
  const result = await dynamodb.get(params).promise();
  return result.Item || {};
}

async function generateEmailWithOpenAI(prompt, knowledge, emailData) {
  const systemPrompt = `Você é um assistente especializado em gerar emails personalizados.
  
Base de conhecimento disponível:
${knowledge}

Dados do destinatário: ${JSON.stringify(emailData)}

Gere um email profissional e personalizado baseado na base de conhecimento fornecida.`;

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt }
    ],
    max_tokens: 1000,
    temperature: 0.7
  });

  return response.choices[0].message.content;
}