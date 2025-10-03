locals {
  security_group_ids = var.create_sg ? concat(aws_security_group.sg[*].id, coalesce(var.security_group_ids, [])) : var.security_group_ids
}
