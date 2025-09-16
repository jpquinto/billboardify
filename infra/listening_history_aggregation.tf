
module "listening_history_aggregator_lambda" {
  source  = "./modules/lambda"
  context = module.null_label.context

  name            = "listening-history-aggregator-lambda"
  handler         = "handler.handler"
  source_dir      = "${path.root}/../backend/dist/listening_history_aggregator"
  build_path      = "${path.root}/../backend/build/listening_history_aggregator/listening_history_aggregator.zip"
  runtime         = "nodejs20.x"
  memory          = 256
  time_limit      = 60
  deployment_type = "zip"
  zip_project     = true

  create_sg                   = true
  enable_vpc_access           = true
  subnet_ids                  = module.vpc.subnet_ids.private
  ipv6_allowed_for_dual_stack = false

  layers = [
    module.shared_lambda_layer.layer_arn,
  ]

  environment_variables = {
    REGION : var.aws_region
    AWS_ACCOUNT_ID : local.account_id
    AGGREGATION_STATUS_TABLE_NAME : module.status_timestamps_table.name
    LISTENING_HISTORY_TABLE_NAME : module.listening_history_table.name
    DB_USERNAME : local.rds_secrets.username
    DB_PASSWORD : local.rds_secrets.password
    DB_HOST : local.rds_secrets.host
  }
}

resource "aws_iam_policy" "listening_history_aggregator_policy" {
  name        = "listening-history-aggregator-policy"
  description = "Allows the listening history aggregator Lambda to write to the DynamoDB table."

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "dynamodb:*",
        ],
        Resource = "*" // module.listening_history_table.arn
      },
      {
        Effect = "Allow",
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem"
        ],
        Resource = [module.status_timestamps_table.arn]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "listening_history_aggregator_attach" {
  role       = module.listening_history_aggregator_lambda.role_name
  policy_arn = aws_iam_policy.listening_history_aggregator_policy.arn
}

module "sg_lambda_to_rds" {
  source                 = "./modules/sg/each_other"
  from_name              = module.listening_history_aggregator_lambda.name
  to_name                = "RDS"
  from_security_group_id = module.listening_history_aggregator_lambda.security_group_ids[0]

  to_security_group_id = module.spotify_rds.security_group_ids[0]
  port                 = 5432
}

module "sg_lambda_to_ddb_endpoint" {
  source                 = "./modules/sg/prefix_list"
  from_name              = module.listening_history_aggregator_lambda.name
  to_name                = "DynamoDB VPC Endpoint"
  from_security_group_id = module.listening_history_aggregator_lambda.security_group_ids[0]
  to_prefix_list_ids     = [module.vpc_endpoint_gateway_dynamodb.prefix_list_id]
  port                   = 443
}
