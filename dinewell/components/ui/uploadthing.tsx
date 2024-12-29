"use client";

import { useDropzone } from "@uploadthing/react/hooks";
import { generateClientDropzoneAccept } from "uploadthing/client";

export function UploadDropzone() {
  const onDrop = () => {};
  const fileTypes = ["image"];

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: generateClientDropzoneAccept(fileTypes),
  });

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Drag and drop files here, or click to select files
        </p>
      </div>
    </div>
  );
}
