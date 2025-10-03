data "external" "install_dependencies" {
  program = [
    "sh",
    "-c",
    <<-EOF
    rm -rf ${var.source_dir} && \
    mkdir -p ${var.source_dir}/python && \
    python -m pip install \
    --target ${var.source_dir}/python \
    ${local.pip_install_platform_command} \
    --no-compile \
    --only-binary=:all: \
    ${join(" ", var.dependencies)} >> /dev/null 2>&1 && \
    echo '{"result": "success"}'
    EOF
  ]
}
