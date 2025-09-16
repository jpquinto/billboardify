data "aws_subnet" "rds_subnet" {
  count = (var.create_sg && length(var.subnet_ids) > 0) ? 1 : 0

  id = var.subnet_ids[0]
}
