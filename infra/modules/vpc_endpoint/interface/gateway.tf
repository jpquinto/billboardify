resource "aws_vpc_endpoint" "interface_vpc_endpoint" {
  vpc_id              = var.vpc_id
  service_name        = "com.amazonaws.${var.aws_region}.${var.service}"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = var.subnet_ids
  private_dns_enabled = var.private_dns_enabled
  security_group_ids  = local.security_group_ids

  tags = module.label_interface_vpc_endpoint.tags
}
