const PDFReader = require('./pdfReader');

class KnowledgeBase {
  constructor(bucketName = process.env.PDFS_BUCKET) {
    this.pdfReader = new PDFReader(bucketName);
    this.knowledge = '';
  }

  async loadKnowledge() {
    const pdfContents = await this.pdfReader.readAllPDFs();
    this.knowledge = pdfContents
      .map(pdf => `=== ${pdf.filename} ===\n${pdf.content}`)
      .join('\n\n');
    
    console.log(`Base de conhecimento carregada: ${pdfContents.length} PDFs`);
    return this.knowledge;
  }

  getKnowledge() {
    return this.knowledge;
  }
}

module.exports = KnowledgeBase;