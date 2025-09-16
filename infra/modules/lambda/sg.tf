resource "aws_security_group" "sg" {
  count = var.create_sg ? 1 : 0

  name        = "${var.name}-sg"
  description = "Security group for ${module.label_lambda.id}"
  vpc_id      = data.aws_subnet.lambda_subnet[0].vpc_id

  lifecycle {
    create_before_destroy = true
  }
}
