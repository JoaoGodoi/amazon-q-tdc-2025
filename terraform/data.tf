# Archive para Lambda function
data "archive_file" "lambda_function" {
  type        = "zip"
  source_dir  = "../src"
  output_path = "lambda-function.zip"
}