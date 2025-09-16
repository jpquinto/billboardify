module "vpc_endpoint_gateway_dynamodb" {
  source  = "./modules/vpc_endpoint/gateway"
  context = module.null_label.context

  aws_region      = "us-west-1"
  service         = "dynamodb"
  vpc_id          = module.vpc.vpc.id
  route_table_ids = module.vpc.route_table_ids.private
}

# TODO: Update endpoint policies once the services are implemented
resource "aws_vpc_endpoint_policy" "vpc_endpoint_gateway_dynamodb_policy" {
  vpc_endpoint_id = module.vpc_endpoint_gateway_dynamodb.id
  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Effect" : "Allow",
        "Principal" : "*",
        "Action" : "*",
        "Resource" : "*"
      }
    ]
  })
}
