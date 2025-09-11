module "spotify-project-api" {
  source  = "./modules/api_gw"
  context = module.null_label.context

  api_name   = "spotify-project-api"
  stage_name = "prod"

  http_routes = [
    {
      http_method          = "GET",
      path                 = "get-chart",
      integration_type     = "lambda"
      lambda_invoke_arn    = module.get_chart_lambda.invoke_arn
      lambda_function_name = module.get_chart_lambda.name
      enable_cors_all      = true
      use_authorizer       = false # TODO: Enable when auth is ready
    },
    {
      http_method          = "GET",
      path                 = "list-charts",
      integration_type     = "lambda"
      lambda_invoke_arn    = module.list_charts_lambda.invoke_arn
      lambda_function_name = module.list_charts_lambda.name
      enable_cors_all      = true
      use_authorizer       = false # TODO: Enable when auth is ready
    },
  ]
  authorizer_type = "COGNITO_USER_POOLS"
  api_type        = ["REGIONAL"]
}
