/// <reference types="vite/client" />

declare module "*.module.css" {
  const content: Record<string, string>;
  export default content;
}

declare module "*.css" {
  const content: string;
  export default content;
}

// Add type definition for showDirectoryPicker
interface Window {
  showDirectoryPicker?: (options?: DirectoryPickerOptions) => Promise<FileSystemDirectoryHandle>;
}

interface DirectoryPickerOptions {
  mode?: "read" | "readwrite";
  startIn?: "desktop" | "documents" | "downloads" | "music" | "pictures" | "videos";
}

interface FileSystemDirectoryHandle {
  name: string;
  kind: "directory";
  getFileHandle(name: string, options?: any): Promise<FileSystemFileHandle>;
  getDirectoryHandle(name: string, options?: any): Promise<FileSystemDirectoryHandle>;
  removeEntry(name: string, options?: any): Promise<void>;
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
}

interface FileSystemFileHandle {
  name: string;
  kind: "file";
  getFile(): Promise<File>;
  createWritable(options?: any): Promise<any>;
}

type FileSystemHandle = FileSystemFileHandle | FileSystemDirectoryHandle;
