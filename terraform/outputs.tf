output "api_gateway_url" {
  description = "URL da API Gateway"
  value       = "${aws_api_gateway_rest_api.email_api.execution_arn}/prod"
}

output "s3_bucket_name" {
  description = "Nome do bucket S3 para PDFs"
  value       = aws_s3_bucket.pdfs_bucket.bucket
}

output "dynamodb_table_name" {
  description = "Nome da tabela DynamoDB"
  value       = aws_dynamodb_table.emails_table.name
}

output "lambda_function_name" {
  description = "Nome da função Lambda"
  value       = aws_lambda_function.email_generator.function_name
}