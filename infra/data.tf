data "aws_secretsmanager_secret_version" "spotify_api_secrets" {
  secret_id = "SpotifyAPICreds"
}

data "aws_secretsmanager_secret_version" "rds_secrets" {
  secret_id = "spotify-rds-credentials"
}

locals {
  spotify_secrets = jsondecode(data.aws_secretsmanager_secret_version.spotify_api_secrets.secret_string)
}

locals {
  rds_secrets = jsondecode(data.aws_secretsmanager_secret_version.rds_secrets.secret_string)
}

data "aws_lambda_layer_version" "spotify_sparticuz" {
  layer_name = "spotify-sparticuz-layer"
}

data "aws_lambda_layer_version" "spotify_sharp" {
  layer_name = "spotify-sharp-layer"
}
