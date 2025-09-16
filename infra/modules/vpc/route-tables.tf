resource "aws_route_table" "public_rts" {
  for_each = var.route_table_by_env ? toset([0]) : toset(local.public_subnet_azs)
  vpc_id   = aws_vpc.this.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.this.id
  }

  tags = var.route_table_by_env ? module.label_rtb_public_env_resource.tags : module.label_rtb_public_resource[each.key].tags
}

resource "aws_route_table" "private_rts" {
  for_each = var.route_table_by_env ? toset([0]) : toset(local.private_subnet_azs)
  vpc_id   = aws_vpc.this.id

  tags = var.route_table_by_env ? module.label_rtb_private_env_resource.tags : module.label_rtb_private_resource[each.key].tags
}

resource "aws_route_table_association" "public_rt_assocs" {
  for_each       = aws_subnet.public_subnets
  subnet_id      = each.value.id
  route_table_id = var.route_table_by_env ? aws_route_table.public_rts[0].id : aws_route_table.public_rts[each.value.availability_zone].id
}

resource "aws_route_table_association" "private_rt_assocs" {
  for_each       = aws_subnet.private_subnets
  subnet_id      = each.value.id
  route_table_id = var.route_table_by_env ? aws_route_table.private_rts[0].id : aws_route_table.private_rts[each.value.availability_zone].id
}
