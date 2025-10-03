import argparse
import ast
import json
import os
import shutil
import subprocess
import sys
from importlib.metadata import PackageNotFoundError, packages_distributions, version
from pathlib import Path
from typing import Any, List


class ImportTarget(object):
    def __init__(self, absolute_path: str, relative_path: str, is_package: bool, module_name: str):
        self.absolute_path = absolute_path
        self.relative_path = relative_path
        self.is_package = is_package
        self.module_name = module_name

    def get_tree(self) -> ast.Module:
        with open(self.absolute_path, "r") as file:
            file_content = file.read()
        return ast.parse(file_content)

    def __eq__(self, other: Any):
        if not isinstance(other, ImportTarget):
            return False
        return (
            self.absolute_path == other.absolute_path
            and self.relative_path == other.relative_path
            and self.is_package == other.is_package
            and self.module_name == other.module_name
        )

    def __str__(self) -> str:
        return f"ImportTarget(module={self.module_name}, path={self.relative_path})"

    def __repr__(self) -> str:
        return (
            f"ImportTarget("
            f"absolute_path='{self.absolute_path}',"
            f"relative_path='{self.relative_path}',"
            f"is_package={self.is_package},"
            f"module_name='{self.module_name}'"
            f")"
        )


class ImportLine(object):
    def __init__(self, module_name: str, items: List[str]):
        self.module_name = module_name
        self.items = items

    def __eq__(self, other: Any):
        if not isinstance(other, ImportLine):
            return False
        return self.module_name == other.module_name and self.items == other.items

    def __str__(self) -> str:
        items_str = f" -> [{', '.join(self.items)}]" if self.items else ""
        return f"ImportLine({self.module_name}{items_str})"

    def __repr__(self) -> str:
        return f"ImportLine(module_name='{self.module_name}', items={self.items})"


class ExternalModule:
    def __init__(self, name: str, version: str):
        self.name = name
        self.version = version

    def __eq__(self, other: Any) -> bool:
        if not isinstance(other, ExternalModule):
            return False
        return self.name == other.name and self.version == other.version

    def __str__(self) -> str:
        return f"ExternalModule({self.name}=={self.version})"

    def __repr__(self) -> str:
        return f"ExternalModule(name='{self.name}', version='{self.version}')"


class Packager:
    def __init__(
        self,
        *,
        entry_file_path: str,
        export_dir: str,
        sys_paths: List[str] | None = None,
        additional_modules: List[str] | None = None,
    ):
        if sys_paths is None:
            sys_paths = []

        if additional_modules is None:
            additional_modules = []

        self.entry_file_path = os.path.abspath(entry_file_path)
        self.export_dir = export_dir
        self.sys_paths = [os.path.dirname(self.entry_file_path)] + sys_paths
        self.additional_modules = additional_modules
        self.distribution_map = {k: v[0] for k, v in packages_distributions().items()}
        self.modules: List[ImportTarget] = []
        self.stdlib_modules: List[str] = []
        self.external_modules: List[ExternalModule] = []
        self.unknown_modules: List[str] = []

    ##########################
    # Dicovering import line #
    ##########################
    def process_import_line(self, import_line: ImportLine) -> None:
        """
        Process an import line by finding possible import targets and discovering them.
        Note that if the import line is coming from third-party modules like `import json` or `from io import BytesIO`,
        possible_import_targets will be empty because find_valid_module_names will return only None
        """

        possible_import_targets = self.find_possible_import_targets(import_line)

        if not possible_import_targets:
            # Check if it's a stdlib module
            module_name = import_line.module_name.split(".")[0]
            if module_name in sys.stdlib_module_names:
                if module_name not in self.stdlib_modules:
                    self.stdlib_modules.append(module_name)
            else:
                # Try to get version info
                try:
                    # Sometimes the distribution name is different from the module name
                    # For example dotenv modules is distributed as python-dotenv, or yaml is distributed as PyYAML
                    distribution_name = self.distribution_map[module_name]
                    module_version = version(distribution_name)
                    external_module = ExternalModule(distribution_name, module_version)
                    if external_module not in self.external_modules:
                        self.external_modules.append(external_module)
                except (PackageNotFoundError, KeyError):
                    if module_name not in self.unknown_modules:
                        self.unknown_modules.append(module_name)
        else:
            for possible_import_target in possible_import_targets:
                if possible_import_target not in self.modules:
                    self.modules.append(possible_import_target)
                    self.discover_module(possible_import_target)

    def find_possible_import_targets(self, import_line: ImportLine) -> List[ImportTarget]:
        """
        Find all possible import targets for a given import line
        """

        """
        Generate all possible module names
        In case of ImportLine(module_name="module.submodule", items=["function1", "function2"])
        module_names = ["module", "module.submodule", "module.submodule.function1", "module.submodule.function2"]
        """
        module_name_parts = import_line.module_name.split(".")
        module_names = [".".join(module_name_parts[0 : index + 1]) for index in range(len(module_name_parts))] + [
            import_line.module_name + "." + item for item in import_line.items
        ]

        # Filter valid module names
        import_targets = [self.find_valid_module_names(module_name) for module_name in module_names]
        import_targets = [import_target for import_target in import_targets if import_target is not None]
        return import_targets

    def find_valid_module_names(self, module_name: str) -> ImportTarget | None:
        """
        Try to find a valid file for the given module name. Return None if not found.
        Try to find a file relative to all sys paths, trying both file import and module import (__init__.py)
        """

        for sys_path in self.sys_paths:
            for is_package in (True, False):
                if is_package:
                    suffix = "/__init__.py"
                else:
                    suffix = ".py"

                relative_path = module_name.replace(".", "/") + suffix
                """
                Check if the file exists at the given path in the format of {sys_path}/{module_name}{suffix}
                Returns the first valid one, otherwise returns None
                """
                full_module_path = os.path.join(sys_path, relative_path)
                if os.path.exists(full_module_path):
                    """
                    In case sys_path=src and module_name=module.submodule, these are the two possible options:
                    ImportTarget(
                        full_module_path=src/module/submodule/__init__.py,
                        relative_path=module/submodule/__init__.py,
                        is_package=True,
                        module_name=module.submodule
                    )
                    or
                    ImportTarget(
                        full_module_path=src/module/submodule.py,
                        relative_path=module/submodule.py,
                        is_package=False,
                        module_name=module.submodule
                    )
                    """
                    return ImportTarget(
                        full_module_path,
                        relative_path=relative_path,
                        is_package=is_package,
                        module_name=module_name,
                    )
        return None

    ######################
    # Discovering module #
    ######################
    def discover_module(self, import_target: ImportTarget) -> None:
        """
        Find all import lines in the import_target and process them
        """

        import_lines = self.find_import_statements(import_target)
        for import_line in import_lines:
            self.process_import_line(import_line)

    def find_import_statements(self, import_target: ImportTarget) -> List[ImportLine]:
        """
        Find all import lines in the import_target
        """

        # Get the AST of the file
        tree = import_target.get_tree()

        import_lines: List[ImportLine] = []
        for node in ast.walk(tree):
            """
            Simple import statement, e.g. import os, pandas
            In this case, node = Import(names=[alias(name='os', asname=None), alias(name='pandas', asname='pd')])
            This will be converted to ImportLine(module_name="os", items=[]), ImportLine(module_name="pandas", items=[])
            """
            if isinstance(node, ast.Import):
                for alias in node.names:
                    module_name = alias.name
                    import_lines.append(ImportLine(module_name, []))

            elif isinstance(node, ast.ImportFrom):
                # Note: node.level is the number of dots at the beginning of the import statement
                if node.level == 0:
                    """
                    Absolute import: from module import function1, function2
                    In this case, node = ImportFrom(module='module',
                        names=[alias(name='function1', asname=None), alias(name='function2', asname=None)], level=0
                    )
                    This will be converted to ImportLine(module_name="module", items=["function1", "function2"])
                    """
                    assert node.module is not None
                    module_name = node.module
                else:
                    """
                    Relative import: from .module import function or from ..module import function
                    We differentiate four cases:
                    - A) sibling import (level 1) from a file:
                        File: src/module/file.py
                        import_target.module_name: src.module.file
                        Import statement: from .other import function
                    - B) sibling import (level 1) from a package:
                        File: src/module/__init__.py
                        import_target.module_name: src.module
                        Import statement: from .other import function
                    - C) parent import (level 2) from a file:
                        File: src/module/file.py
                        import_target.module_name: src.module.file
                        Import statement: from ..other import function
                    - D) parent import (level 2) from a package:
                        File: src/module/__init__.py
                        import_target.module_name: src.module
                        Import statement: from ..other import function
                    """
                    level = node.level

                    if import_target.is_package:
                        """
                        If the source file is a package, the level is decreased by 1 because
                        import_target.module_name is already set to the parent folder.
                        File: src/module/__init__.py -> import_target.module_name: src.module
                        B) -> level 0; D) -> level 1

                        If the source file is a file, the level is not changed.
                        File: src/module/file.py -> import_target.module_name: src.module.file
                        A) -> level 1; C) -> level 2
                        """
                        level -= 1

                    if level == 0:
                        """
                        If the level is 0, it is B)
                        import_target.module_name is already points to the parent package of the importable module
                        """
                        parent_package_name = import_target.module_name
                    else:
                        """
                        If A), C) or D)
                        Remove {level} parts from the end of the import_target.module_name
                        to get the parent package of the importable module
                        """
                        parent_package_name = ".".join(import_target.module_name.split(".")[:-level])

                    if node.module is None:
                        """
                        node.module is empty
                        from .. import function
                        module name is the parent package name
                        TODO: what in case of `from . import function`?
                        """
                        module_name = parent_package_name
                    # elif parent_package_name == "":  # Relative import from the entry file is not possible
                    #     # TODO: Explain more, why are checking parent_package_name?
                    #     module_name = node.module
                    else:
                        """
                        Otherwise, append the module name to the parent package name
                        """
                        module_name = parent_package_name + "." + node.module

                import_lines.append(ImportLine(module_name, [name.name for name in node.names]))
        return import_lines

    ###############
    # Entry point #
    ###############
    def collect_modules(self) -> List[ImportTarget]:
        """Discover all modules that are imported by the entry file"""

        """
        Initial import target is the entry file
        E.g. ImportTarget(
            absolute_path='/path_to_project/src/module/main.py',
            relative_path='main.py',
            is_package=False,
            module_name=''
        )
        """
        initial_import_target = ImportTarget(
            self.entry_file_path, relative_path=os.path.basename(self.entry_file_path), is_package=False, module_name=""
        )
        self.modules = [initial_import_target]
        self.discover_module(initial_import_target)
        return self.modules

    def package(self) -> None:
        modules = self.collect_modules()
        export_dir_full_path = os.path.abspath(self.export_dir)

        if os.path.exists(export_dir_full_path):
            shutil.rmtree(export_dir_full_path)

        Path(export_dir_full_path).mkdir(parents=True)
        for module in modules:
            path_suffix = module.relative_path
            new_path = os.path.join(export_dir_full_path, path_suffix)
            Path(os.path.dirname(new_path)).mkdir(parents=True, exist_ok=True)
            shutil.copy(module.absolute_path, new_path)

        for path in self.additional_modules:
            if os.path.isdir(path):
                abs_path = os.path.abspath(path)
                path_suffix = os.path.basename(abs_path)
                new_path = os.path.join(export_dir_full_path, path_suffix)
                shutil.copytree(abs_path, new_path)


architecture_mapper = {"x86_64": "manylinux2014_x86_64", "arm64": "manylinux2014_aarch64"}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("script")
    parser.add_argument("--export-dir", required=True)
    parser.add_argument("--sys-paths", nargs="*", default=[])
    parser.add_argument("--additional-modules", nargs="*", default=[])
    parser.add_argument("--extra-requirements", nargs="*", default=[])
    parser.add_argument("--architecture", default="")
    parser.add_argument("--install-dependencies", nargs="*", default=[])
    parser.add_argument("--no-reqs", action="store_true")
    args = parser.parse_args()

    entry_file_path = args.script
    export_dir = args.export_dir
    sys_paths = args.sys_paths
    additional_modules = args.additional_modules
    extra_requirements = args.extra_requirements
    install_dependencies = args.install_dependencies
    generate_requirements = not args.no_reqs

    packager = Packager(
        entry_file_path=entry_file_path,
        export_dir=export_dir,
        sys_paths=list(set(sys_paths)),
        additional_modules=list(set(additional_modules)),
    )
    packager.package()

    if install_dependencies and len(install_dependencies) > 0:
        for dependency in install_dependencies:
            subprocess.run(
                [
                    "pip",
                    "install",
                    "-t",
                    export_dir,
                    "--platform",
                    architecture_mapper[args.architecture],
                    "--no-compile",
                    "--only-binary=:all:",
                    dependency,
                ],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.STDOUT,
                check=True,
            )

    if generate_requirements:
        # subprocess.run(["pipreqs", "--mode=gt", export_dir], stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
        # if len(extra_requirements) > 0:
        #     with open(
        #         f"{export_dir}/requirements.txt", "a"
        #     ) as f:  # TODO: Detect version constraint from pyproject.toml
        #         for dep in extra_requirements:
        #             f.write(f"{dep}\n")

        with open(f"{export_dir}/requirements.txt", "w") as f:
            f.write(
                "".join(
                    [
                        f"{dependency.name}=={dependency.version}\n"
                        for dependency in sorted(packager.external_modules, key=lambda x: x.name.lower())
                    ]
                )
            )
            if len(extra_requirements) > 0:
                for dependency in extra_requirements:
                    f.write(f"{dependency}\n")

    result = {"success": "true", "build_directory": os.path.normpath(export_dir)}
    print(json.dumps(result))


if __name__ == "__main__":
    main()
