# Vpc
resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr_range
  instance_tenancy     = "default"
  enable_dns_support   = "true"
  enable_dns_hostnames = "true"
  tags                 = module.label_vpc_resource.tags
}

#Point of this resource is to simply name and add the tags for the default security group, created with the vpc
resource "aws_default_security_group" "default" {
  vpc_id = aws_vpc.this.id
  tags   = module.label_default_security_group_resource.tags
}