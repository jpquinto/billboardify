locals {
  public_subnet_azs  = keys(var.public_cidr_ranges)
  private_subnet_azs = keys(var.private_cidr_ranges)
}
