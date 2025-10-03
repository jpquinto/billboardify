module main_ctx {
  source = "cloudposse/label/null"
  context = var.context

  tags = {
    component = "vpc_endpoint_interface"
  }
}

module "label_interface_vpc_endpoint" {
  source = "cloudposse/label/null"
  context = module.main_ctx.context

  attributes = [var.service, "vpc-endpoint"]
}

module "label_vpc_endpoint_sg" {
  count  = var.create_sg ? 1 : 0
  source = "cloudposse/label/null"

  context =module.label_interface_vpc_endpoint.context
  attributes = ["sg"]
}
