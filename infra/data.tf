data "aws_secretsmanager_secret_version" "spotify_api_secrets" {
  secret_id = "SpotifyAPICreds"
}

locals {
  spotify_secrets = jsondecode(data.aws_secretsmanager_secret_version.spotify_api_secrets.secret_string)
}
