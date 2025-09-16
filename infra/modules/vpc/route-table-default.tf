resource "aws_default_route_table" "default" {
  default_route_table_id = aws_vpc.this.default_route_table_id
  tags                   = module.label_rtb_resource.tags
}

