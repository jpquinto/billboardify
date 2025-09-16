module "main_ctx" {
  source  = "cloudposse/label/null"
  context = var.context

  tags = {
    "module" = "bastion-host"
  }
}

module label_ec2 {
  source  = "cloudposse/label/null"
  context = module.main_ctx.context
  attributes = [
    "bastion-ec2"
  ]
}

module label_ec2_sg {
  source  = "cloudposse/label/null"
  context = module.label_ec2.context
  attributes = [
    "sg"
  ]
}