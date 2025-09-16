
module "vpc" {
  source  = "./modules/vpc"
  context = module.null_label.context

  vpc_cidr_range      = "10.21.0.0/16"
  create_nat_gateways = false
  route_table_by_env  = false

  public_cidr_ranges = {
    "us-west-1b" : ["10.21.11.0/24"]
    "us-west-1c" : ["10.21.12.0/24"]
  }
  private_cidr_ranges = {
    "us-west-1b" : ["10.21.21.0/24"]
    "us-west-1c" : ["10.21.22.0/24"]
  }
}
