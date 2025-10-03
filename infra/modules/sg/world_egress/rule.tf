resource "aws_security_group_rule" "rule" {
  description       = "Allow ${var.name} world egress"
  type              = "egress"
  from_port         = var.from_port
  to_port           = var.to_port
  protocol          = var.protocol
  security_group_id = var.security_group_id

  cidr_blocks      = var.ipv4_cidr_range
  ipv6_cidr_blocks = var.ipv6_cidr_range
}
