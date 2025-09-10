

module "song_chart_playlist_generator_lambda" {
  source  = "./modules/lambda"
  context = module.null_label.context

  name            = "song-chart-playlist-generator-lambda"
  handler         = "handler.handler"
  source_dir      = "${path.root}/../backend/dist/song_chart_playlist_generator"
  build_path      = "${path.root}/../backend/build/song_chart_playlist_generator/song_chart_playlist_generator.zip"
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
    SONG_CHART_HISTORY_BUCKET_NAME : module.song_chart_history_bucket.bucket_name
    SPOTIFY_REFRESH_TOKEN = local.spotify_secrets.SPOTIFY_REFRESH_TOKEN
    SPOTIFY_CLIENT_ID     = local.spotify_secrets.SPOTIFY_CLIENT_ID
    SPOTIFY_CLIENT_SECRET = local.spotify_secrets.SPOTIFY_CLIENT_SECRET
  }
}

resource "aws_iam_policy" "song_chart_playlist_generator_policy" {
  name        = "song-chart-playlist-generator-policy"
  description = "Allows the song chart playlist generator Lambda to read from S3"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "s3:GetObject"
        ],
        Resource = "${module.song_chart_history_bucket.bucket_arn}/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "song_chart_playlist_generator_attach" {
  role       = module.song_chart_playlist_generator_lambda.role_name
  policy_arn = aws_iam_policy.song_chart_playlist_generator_policy.arn
}
