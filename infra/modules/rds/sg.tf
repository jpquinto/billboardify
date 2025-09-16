resource "aws_security_group" "sg" {
  count = var.create_sg ? 1 : 0

  name        = module.label_rds_sg[0].id
  description = "Security group for ${module.label_rds.id} RDS instance"
  vpc_id      = data.aws_subnet.rds_subnet[0].vpc_id

  tags = module.label_rds_sg[0].tags

  lifecycle {
    create_before_destroy = true
  }
}
