locals {
  architecture_mapper = {
    x86_64 = "manylinux2014_x86_64",
    arm64  = "manylinux2014_aarch64"
  }
}

locals {
  pip_architectures            = [for arch in var.architecture : local.architecture_mapper[arch]]
  pip_install_platform_command = join(" ", [for arch in local.pip_architectures : "--platform ${arch}"])
}
