module "spotify-project-api" {
  source  = "./modules/api_gw"
  context = module.null_label.context

  api_name   = "spotify-project-api"
  stage_name = "prod"

  http_routes = [
    {
      http_method          = "GET",
      path                 = "get-song-chart",
      integration_type     = "lambda"
      lambda_invoke_arn    = module.get_song_chart_lambda.invoke_arn
      lambda_function_name = module.get_song_chart_lambda.name
      enable_cors_all      = true
      use_authorizer       = false # TODO: Enable when auth is ready
    },
  ]
  authorizer_type = "COGNITO_USER_POOLS"
  api_type        = ["REGIONAL"]
}
