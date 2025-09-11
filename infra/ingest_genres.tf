module "ingest_genres_lambda" {
  source  = "./modules/lambda"
  context = module.null_label.context

  name            = "ingest-genres-data-lambda"
  handler         = "handler.handler"
  source_dir      = "${path.root}/../backend/dist/ingest_genres"
  build_path      = "${path.root}/../backend/build/ingest_genres/ingest_genres.zip"
  runtime         = "nodejs20.x"
  memory          = 1536
  time_limit      = 60
  deployment_type = "zip"
  zip_project     = true

  layers = [
    module.shared_lambda_layer.layer_arn,
  ]

  environment_variables = {
    REGION : var.aws_region
    AWS_ACCOUNT_ID : local.account_id
    LISTENING_HISTORY_TABLE_NAME : module.listening_history_table.name
    ARTIST_HISTORY_TABLE_NAME : module.artist_history_table.name
    SPOTIFY_REFRESH_TOKEN = local.spotify_secrets.SPOTIFY_REFRESH_TOKEN
    SPOTIFY_CLIENT_ID     = local.spotify_secrets.SPOTIFY_CLIENT_ID
    SPOTIFY_CLIENT_SECRET = local.spotify_secrets.SPOTIFY_CLIENT_SECRET
  }
}

resource "aws_iam_policy" "ingest_genres_policy" {
  name        = "ingest-genres-policy"
  description = "Allows the ingest genres Lambda to scan and update the listening history table."

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "dynamodb:Scan",
          "dynamodb:UpdateItem",
          "dynamodb:GetItem"
        ],
        Resource = module.listening_history_table.arn # Fixed table reference
      },
      {
        Effect = "Allow",
        Action = [
          "secretsmanager:GetSecretValue"
        ],
        Resource = "*" # Adjust to specific secret ARN if you have one
      },
      {
        Effect = "Allow",
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem"
        ],
        Resource = [module.status_timestamps_table.arn,
          module.artist_history_table.arn
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ingest_genres_attach" {
  role       = module.ingest_genres_lambda.role_name
  policy_arn = aws_iam_policy.ingest_genres_policy.arn
}
