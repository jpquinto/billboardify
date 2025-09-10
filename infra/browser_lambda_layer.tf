module "browser_lambda_layer" {
  source = "./modules/lambda_layer"

  context     = module.null_label.context
  name        = "browser-layer"
  description = "Utilities and dependencies for browser lambda"

  runtime         = ["nodejs20.x"]
  architecture    = ["x86_64", "arm64"]
  deployment_type = "zip"
  zip_project     = false

  filename = "${path.root}/../backend/build/layers/browser_layer.zip"

  upload_to_s3 = false
}
