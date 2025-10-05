module "spotify-project-chatbot-api" {
  source  = "./modules/api_gw"
  context = module.null_label.context

  api_name   = "spotify-project-chatbot-api"
  stage_name = "prod"

  http_routes = [
    {
      http_method          = "POST"
      path                 = "ask-question"
      integration_type     = "lambda"
      lambda_invoke_arn    = module.chatbot_supervisor_lambda.invoke_arn
      lambda_function_name = module.chatbot_supervisor_lambda.name
      enable_cors_all      = true
      use_authorizer       = false # TODO: Enable when auth is ready
    },
  ]
  authorizer_type = "COGNITO_USER_POOLS"
  api_type        = ["REGIONAL"]
}
