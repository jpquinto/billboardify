resource "aws_security_group" "sg" {
  count = var.create_sg ? 1 : 0

  name        = "${module.label_vpc_endpoint_sg[0].id}-interface"
  description = "Security group for ${module.label_interface_vpc_endpoint.id}"
  vpc_id      = var.vpc_id

  tags = module.label_vpc_endpoint_sg[0].tags

  lifecycle {
    create_before_destroy = true
  }
}

module "aws_security_group_all_egress_rule" {
  count = var.create_sg ? 1 : 0

  source            = "../../sg/world_egress"
  name              = "${module.label_vpc_endpoint_sg[0].id}-egress-all"
  security_group_id = aws_security_group.sg[0].id
}
