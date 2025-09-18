const KnowledgeBase = require('../src/services/knowledgeBase');
const PDFReader = require('../src/services/pdfReader');

// Mock do PDFReader
jest.mock('../src/services/pdfReader');

describe('Services Tests', () => {
  describe('KnowledgeBase', () => {
    let knowledgeBase;
    let mockPDFReader;

    beforeEach(() => {
      mockPDFReader = {
        readAllPDFs: jest.fn()
      };
      PDFReader.mockImplementation(() => mockPDFReader);
      knowledgeBase = new KnowledgeBase();
    });

    test('deve carregar conhecimento dos PDFs', async () => {
      const mockPDFContents = [
        { filename: 'doc1.pdf', content: 'Conteúdo do documento 1' },
        { filename: 'doc2.pdf', content: 'Conteúdo do documento 2' }
      ];

      mockPDFReader.readAllPDFs.mockResolvedValue(mockPDFContents);

      const knowledge = await knowledgeBase.loadKnowledge();

      expect(mockPDFReader.readAllPDFs).toHaveBeenCalled();
      expect(knowledge).toContain('=== doc1.pdf ===');
      expect(knowledge).toContain('Conteúdo do documento 1');
      expect(knowledge).toContain('=== doc2.pdf ===');
      expect(knowledge).toContain('Conteúdo do documento 2');
    });

    test('deve retornar conhecimento carregado', async () => {
      const mockPDFContents = [
        { filename: 'test.pdf', content: 'Teste de conteúdo' }
      ];

      mockPDFReader.readAllPDFs.mockResolvedValue(mockPDFContents);
      
      await knowledgeBase.loadKnowledge();
      const knowledge = knowledgeBase.getKnowledge();

      expect(knowledge).toContain('=== test.pdf ===');
      expect(knowledge).toContain('Teste de conteúdo');
    });
  });
});