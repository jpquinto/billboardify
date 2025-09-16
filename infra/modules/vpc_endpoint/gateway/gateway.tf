
resource "aws_vpc_endpoint" "gateway_vpc_endpoint" {
  vpc_id            = var.vpc_id
  service_name      = "com.amazonaws.${var.aws_region}.${var.service}"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = var.route_table_ids
  policy            = var.policy

  tags = module.label_interface_vpc_endpoint.tags
}
