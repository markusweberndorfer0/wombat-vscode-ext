export interface ProjectModel {
  name: string;
  links: Links;
  parameters: Parameters;
  include_files: IncludeFile[];
  source_files: SourceFile[];
  data_files: any[];
  binary_files: BinaryFile[];
}

export interface Links {
  project_file: ProjectFile;
  include_directory: IncludeDirectory;
  src_directory: SrcDirectory;
  data_directory: DataDirectory;
  bin_directory: BinDirectory;
  binary: Binary;
  lib_directory: LibDirectory;
  self: Self;
}

export interface ProjectFile {
  href: string;
}

export interface IncludeDirectory {
  href: string;
}

export interface SrcDirectory {
  href: string;
}

export interface DataDirectory {
  href: string;
}

export interface BinDirectory {
  href: string;
}

export interface Binary {
  href: string;
}

export interface LibDirectory {
  href: string;
}

export interface Self {
  href: string;
}

export interface Parameters {
  language: string;
  user: string;
}

export interface IncludeFile {
  name: string;
  path: string;
  type: string;
  links: Links2;
}

export interface Links2 {
  self: Self2;
}

export interface Self2 {
  href: string;
}

export interface SourceFile {
  name: string;
  path: string;
  type: string;
  links: Links3;
}

export interface Links3 {
  self: Self3;
}

export interface Self3 {
  href: string;
}

export interface BinaryFile {
  name: string;
  path: string;
  type: string;
  links: Links4;
}

export interface Links4 {
  self: Self4;
}

export interface Self4 {
  href: string;
}
export interface Root {
  name: string;
  links: Links;
  parameters: Parameters;
  include_files: IncludeFile[];
  source_files: SourceFile[];
  data_files: any[];
  binary_files: BinaryFile[];
}

export interface Links {
  project_file: ProjectFile;
  include_directory: IncludeDirectory;
  src_directory: SrcDirectory;
  data_directory: DataDirectory;
  bin_directory: BinDirectory;
  binary: Binary;
  lib_directory: LibDirectory;
  self: Self;
}

export interface ProjectFile {
  href: string;
}

export interface IncludeDirectory {
  href: string;
}

export interface SrcDirectory {
  href: string;
}

export interface DataDirectory {
  href: string;
}

export interface BinDirectory {
  href: string;
}

export interface Binary {
  href: string;
}

export interface LibDirectory {
  href: string;
}

export interface Self {
  href: string;
}

export interface Parameters {
  language: string;
  user: string;
}

export interface IncludeFile {
  name: string;
  path: string;
  type: string;
  links: Links2;
}

export interface Links2 {
  self: Self2;
}

export interface Self2 {
  href: string;
}

export interface SourceFile {
  name: string;
  path: string;
  type: string;
  links: Links3;
}

export interface Links3 {
  self: Self3;
}

export interface Self3 {
  href: string;
}

export interface BinaryFile {
  name: string;
  path: string;
  type: string;
  links: Links4;
}

export interface Links4 {
  self: Self4;
}

export interface Self4 {
  href: string;
}
