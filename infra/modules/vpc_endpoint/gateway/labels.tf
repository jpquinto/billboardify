module main_ctx {
  source = "cloudposse/label/null"
  context = var.context

  tags = {
    component = "vpc_endpoint_gateway"
  }
}


module "label_interface_vpc_endpoint" {
  source = "cloudposse/label/null"
  context = module.main_ctx.context

  attributes = [var.service, "vpc-endpoint"]
}