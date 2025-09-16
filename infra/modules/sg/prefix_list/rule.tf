resource "aws_security_group_rule" "rule_egress" {
  description       = "Allow ${var.from_name} to ${var.to_name} connection (egress rule)"
  type              = "egress"
  from_port         = var.port
  to_port           = var.port
  protocol          = var.protocol
  security_group_id = var.from_security_group_id

  prefix_list_ids = var.to_prefix_list_ids
}
