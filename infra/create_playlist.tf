module "create_playlist_lambda" {
  source  = "./modules/lambda"
  context = module.null_label.context

  name            = "create-playlist-lambda"
  handler         = "handler.handler"
  source_dir      = "${path.root}/../backend/dist/create_playlist"
  build_path      = "${path.root}/../backend/build/create_playlist/create_playlist.zip"
  runtime         = "nodejs20.x"
  memory          = 256
  time_limit      = 60
  deployment_type = "zip"
  zip_project     = true

  layers = [
    module.shared_lambda_layer.layer_arn,
  ]

  environment_variables = {
    REGION : var.aws_region
    AWS_ACCOUNT_ID : local.account_id
    SPOTIFY_REFRESH_TOKEN = local.spotify_secrets.SPOTIFY_REFRESH_TOKEN
    SPOTIFY_CLIENT_ID     = local.spotify_secrets.SPOTIFY_CLIENT_ID
    SPOTIFY_CLIENT_SECRET = local.spotify_secrets.SPOTIFY_CLIENT_SECRET
  }
}
