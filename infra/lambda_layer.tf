module "shared_lambda_layer" {
  source = "./modules/lambda_layer"

  context     = module.null_label.context
  name        = "shared-layer"
  description = "Shared utilities and dependencies for all lambdas"

  runtime         = ["nodejs20.x"]
  architecture    = ["x86_64", "arm64"]
  deployment_type = "zip"
  zip_project     = false

  filename = "${path.root}/../backend/build/layers/shared_layer.zip"

  upload_to_s3 = false
}

module "rag_layer" {
  source = "./modules/lambda_layer"

  context     = module.null_label.context
  name        = "rag-layer"
  description = "RAG Training Layer"

  runtime         = ["python3.12"]
  architecture    = ["x86_64"]
  deployment_type = "zip"
  zip_project     = true

  source_dir = "${path.root}/../python/layers/rag"
  build_path = "${path.root}/../python/build/layers/rag_layer.zip"

  upload_to_s3 = false
}

module "python_dependencies_layer" {
  source = "./modules/lambda_layer/python_dependencies"

  context = module.null_label.context
  name    = "python_dependencies"

  runtime      = ["python3.12"]
  architecture = ["x86_64"]

  deployment_type = "s3"
  zip_project     = true
  source_dir      = "${path.root}/dist/chatbot/layers/python-dependencies"
  build_path      = "${path.root}/dist/chatbot/layers/python-dependencies-layer.zip"
  upload_to_s3    = true
  s3_bucket       = local.s3_bucket_layers
  s3_key          = "lambda_layers/python_dependencies.zip"

  dependencies = [
    "pg8000==1.31.5"
  ]
}
