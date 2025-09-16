resource "random_string" "rds_username" {
  length  = 12
  special = false
  numeric = false

}

resource "random_password" "rds_password" {
  length           = 16
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"

}

resource "aws_secretsmanager_secret" "spotify_rds_credentials" {
  name = "spotify-rds-credentials"
}

resource "aws_secretsmanager_secret_version" "spotify_rds_credentials" {
  secret_id = aws_secretsmanager_secret.spotify_rds_credentials.id
  secret_string = jsonencode({
    username = random_string.rds_username.result
    password = random_password.rds_password.result
    engine   = "postgres"
    port     = 5432
    dbname   = "postgres"
    host     = module.spotify_rds.address
  })
}

module "spotify_rds" {
  source  = "./modules/rds"
  context = module.null_label.context

  engine = "postgres"

  instance_class = "db.t4g.micro"

  storage_type      = "gp2"
  allocated_storage = 20

  username = random_string.rds_username.result
  password = random_password.rds_password.result
  db_name  = "postgres"

  multi_az      = false
  public_access = false
  subnet_ids    = module.vpc.subnet_ids.private
  create_sg     = true

  backup_window = "13:00-14:00"

  parameter_group_family = "postgres17"

  parameters = []
}

