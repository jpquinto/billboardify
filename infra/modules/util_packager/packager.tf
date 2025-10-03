data "external" "packager_program" {
  program = flatten([
    "python", "${path.module}/packager.py",
    var.entry_file_path,
    "--export-dir", var.export_dir,
    length(var.sys_paths) > 0 ? flatten(["--sys-paths", var.sys_paths]) : [],
    length(var.additional_modules) > 0 ? flatten(["--additional-modules", var.additional_modules]) : [],
    length(var.extra_requirements) > 0 ? flatten(["--extra-requirements", var.extra_requirements]) : [],
    var.install_dependencies != null ? flatten(["--architecture", var.install_dependencies.architecture, "--install-dependencies", var.install_dependencies.dependencies]) : [],
    var.no_reqs ? ["--no-reqs"] : []
  ])
}
