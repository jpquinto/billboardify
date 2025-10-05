module "spotify-project-api" {
  source  = "./modules/api_gw"
  context = module.null_label.context

  api_name   = "spotify-project-api"
  stage_name = "prod"

  http_routes = [
    {
      http_method          = "GET"
      path                 = "get-chart"
      integration_type     = "lambda"
      lambda_invoke_arn    = module.get_chart_lambda.invoke_arn
      lambda_function_name = module.get_chart_lambda.name
      enable_cors_all      = true
      use_authorizer       = false # TODO: Enable when auth is ready
      # cache_key_parameters = [
      #   "method.request.querystring.type",
      #   "method.request.querystring.timestamp"
      # ]
      # request_parameters = {
      #   "method.request.querystring.type"      = false
      #   "method.request.querystring.timestamp" = false
      # }
    },
    {
      http_method          = "GET"
      path                 = "list-charts"
      integration_type     = "lambda"
      lambda_invoke_arn    = module.list_charts_lambda.invoke_arn
      lambda_function_name = module.list_charts_lambda.name
      enable_cors_all      = true
      use_authorizer       = false # TODO: Enable when auth is ready
    },
    {
      http_method          = "GET"
      path                 = "get-access-token"
      integration_type     = "lambda"
      lambda_invoke_arn    = module.get_access_token_lambda.invoke_arn
      lambda_function_name = module.get_access_token_lambda.name
      enable_cors_all      = true
      use_authorizer       = false # TODO: Enable when auth is ready
    },
    {
      http_method          = "GET"
      path                 = "get-song-metadata"
      integration_type     = "lambda"
      lambda_invoke_arn    = module.get_song_metadata_lambda.invoke_arn
      lambda_function_name = module.get_song_metadata_lambda.name
      enable_cors_all      = true
      use_authorizer       = false # TODO: Enable when auth is ready
    },
    {
      http_method          = "GET"
      path                 = "get-listening-history"
      integration_type     = "lambda"
      lambda_invoke_arn    = module.get_listening_history_lambda.invoke_arn
      lambda_function_name = module.get_listening_history_lambda.name
      enable_cors_all      = true
      use_authorizer       = false # TODO: Enable when auth is ready
    },
    {
      http_method          = "GET"
      path                 = "get-leaderboards"
      integration_type     = "lambda"
      lambda_invoke_arn    = module.get_leaderboards_lambda.invoke_arn
      lambda_function_name = module.get_leaderboards_lambda.name
      enable_cors_all      = true
      use_authorizer       = false # TODO: Enable when auth is ready
    },
    {
      http_method          = "POST"
      path                 = "add-training-data"
      integration_type     = "lambda"
      lambda_invoke_arn    = module.add_training_data_lambda.invoke_arn
      lambda_function_name = module.add_training_data_lambda.name
      enable_cors_all      = true
      use_authorizer       = false # TODO: Enable when auth is ready
    },
  ]
  authorizer_type = "COGNITO_USER_POOLS"
  api_type        = ["REGIONAL"]
}
