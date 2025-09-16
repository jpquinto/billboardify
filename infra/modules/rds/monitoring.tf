data "aws_iam_policy_document" "monitoring_assume_role" {
  count = var.create_monitoring_role ? 1 : 0

  statement {
    effect = "Allow"

    principals {
      type = "Service"
      identifiers = ["monitoring.rds.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "enhanced_monitoring" {
  count = var.create_monitoring_role ? 1 : 0

  name        = module.label_rds_monitoring_role.id
  description = "IAM role for enhanced monitoring of ${module.label_rds.id} RDS instance"

  assume_role_policy = data.aws_iam_policy_document.monitoring_assume_role[0].json

  tags = module.label_rds_monitoring_role.tags
}


resource "aws_iam_role_policy_attachment" "monitoring" {
  count = var.create_monitoring_role ? 1 : 0

  role       = aws_iam_role.enhanced_monitoring[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}
