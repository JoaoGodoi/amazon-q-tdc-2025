const AWS = require('aws-sdk');
const pdf = require('pdf-parse');

class PDFReader {
  constructor(bucketName = process.env.PDFS_BUCKET) {
    this.bucketName = bucketName;
    this.s3 = new AWS.S3();
  }

  async readAllPDFs() {
    const objects = await this.s3.listObjectsV2({ Bucket: this.bucketName }).promise();
    const pdfFiles = objects.Contents.filter(obj => obj.Key.endsWith('.pdf'));
    
    const contents = [];
    
    for (const file of pdfFiles) {
      const data = await this.s3.getObject({ 
        Bucket: this.bucketName, 
        Key: file.Key 
      }).promise();
      
      const pdfData = await pdf(data.Body);
      
      contents.push({
        filename: file.Key,
        content: pdfData.text
      });
    }
    
    return contents;
  }
}

module.exports = PDFReader;