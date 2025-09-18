terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# S3 Bucket para PDFs
resource "aws_s3_bucket" "pdfs_bucket" {
  bucket = "${var.project_name}-pdfs-${random_string.suffix.result}"
}

resource "aws_s3_bucket_versioning" "pdfs_versioning" {
  bucket = aws_s3_bucket.pdfs_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# DynamoDB para emails
resource "aws_dynamodb_table" "emails_table" {
  name           = "${var.project_name}-emails"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }
}

# Lambda Function
resource "aws_lambda_function" "email_generator" {
  filename         = "lambda-function.zip"
  function_name    = "${var.project_name}-email-generator"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.lambda_function.output_base64sha256
  runtime         = "nodejs18.x"
  timeout         = 30

  environment {
    variables = {
      OPENAI_API_KEY = var.openai_api_key
      PDFS_BUCKET    = aws_s3_bucket.pdfs_bucket.bucket
      EMAILS_TABLE   = aws_dynamodb_table.emails_table.name
    }
  }
}

# API Gateway
resource "aws_api_gateway_rest_api" "email_api" {
  name = "${var.project_name}-api"
}

resource "aws_api_gateway_resource" "generate_email" {
  rest_api_id = aws_api_gateway_rest_api.email_api.id
  parent_id   = aws_api_gateway_rest_api.email_api.root_resource_id
  path_part   = "generate-email"
}

resource "aws_api_gateway_method" "generate_email_post" {
  rest_api_id   = aws_api_gateway_rest_api.email_api.id
  resource_id   = aws_api_gateway_resource.generate_email.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda_integration" {
  rest_api_id = aws_api_gateway_rest_api.email_api.id
  resource_id = aws_api_gateway_resource.generate_email.id
  http_method = aws_api_gateway_method.generate_email_post.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.email_generator.invoke_arn
}

resource "aws_api_gateway_deployment" "api_deployment" {
  depends_on = [aws_api_gateway_integration.lambda_integration]

  rest_api_id = aws_api_gateway_rest_api.email_api.id
  stage_name  = "prod"
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.email_generator.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.email_api.execution_arn}/*/*"
}

resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
}