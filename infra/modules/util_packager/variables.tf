###########
# General
###########

variable "entry_file_path" {
  type        = string
  description = "Path of the entry file from where dependency discovery will start. Must be a valid file path."
}

variable "export_dir" {
  type        = string
  description = "Path of the export directory where packaged files will be placed. Must be a valid directory path."
}

###########
# Dependencies
###########

variable "sys_paths" {
  type        = list(string)
  description = "List of paths to search for Python dependencies. Usually, it is the project directory."
  default     = []
}

variable "additional_modules" {
  type        = list(string)
  description = "List of additional Python modules to include in the build. These files will be copied to the export directory."
  default     = []
}

variable "extra_requirements" {
  type        = list(string)
  description = "List of extra Python package requirements to be installed. These packages will be added to the generated requirements.txt file."
  default     = []

  validation {
    condition     = alltrue([for dep in var.extra_requirements : can(regex("^[a-zA-Z0-9-_\\[\\]]+==\\d+(?:\\.\\d+)*$", dep))])
    error_message = "All `extra_requirements` must have exact version specified. Example: 'requests==2.28.1'"
  }
}

variable "install_dependencies" {
  type = object({
    architecture = string
    dependencies = list(string)
  })
  description = "Configuration for architecture-specific Python packages installation. The packages will be installed as side-dependencies in the export directory. The `architecture` specifies the target architecture, and `dependencies` lists the packages to install. Valid values for architecture: [x86_64, arm64]."
  default     = null

  validation {
    condition     = var.install_dependencies == null ? true : length(var.install_dependencies.dependencies) > 0
    error_message = "The `dependencies` list must contain at least one package if `install_dependencies` is specified."
  }

  validation {
    condition     = var.install_dependencies == null ? true : contains(["x86_64", "arm64"], var.install_dependencies.architecture)
    error_message = "Valid values for `architecture`: [x86_64, arm64]."
  }

  validation {
    condition     = var.install_dependencies == null ? true : alltrue([for dep in var.install_dependencies.dependencies : can(regex("^[a-zA-Z0-9-_\\[\\]]+==\\d+(?:\\.\\d+)*$", dep))])
    error_message = "All `install_dependencies` dependencies must have exact version specified. Example: 'requests==2.28.1'"
  }
}

variable "no_reqs" {
  type        = bool
  description = "Whether to skip generating requirements.txt file."
  default     = false
}
