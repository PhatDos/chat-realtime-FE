"use client";

import { FileIcon, X } from "lucide-react";
import Image from "next/image";
import { UploadDropzone } from "@/lib/uploadthing";
import "@uploadthing/react/styles.css";

type FileValue = string | { url: string; type?: string };

interface FileUploadProps {
  onChange: (file?: FileValue) => void;
  value: FileValue;
  endpoint: "serverImage" | "messageFile";
}

export const FileUpload = ({ onChange, value, endpoint }: FileUploadProps) => {
  const url = typeof value === "string" ? value : value?.url;
  const type =
    typeof value === "string"
      ? value.split(".").pop()?.toLowerCase() || ""
      : value?.type || "";

  if (url && !type.includes("pdf")) {
    return (
      <div className="relative w-20 h-20">
        <Image
          fill
          sizes="80px"
          src={url}
          alt="Upload"
          className="rounded-full"
        />
        <button
          onClick={() => onChange(undefined)}
          className="bg-rose-500 text-white p-1 rounded-full absolute top-0 right-0 shadow-sm"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (url && type.includes("pdf")) {
    return (
      <div className="relative flex flex-col items-center p-2 mt-2 rounded-md bg-background/10">
        <FileIcon className="h-10 w-10 fill-indigo-200 stroke-indigo-400" />
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 text-sm text-indigo-500 dark:text-indigo-400 hover:underline"
        >
          File PDF
        </a>
        <button
          onClick={() => onChange(undefined)}
          className="absolute -top-2 -right-2 p-1 bg-rose-500 rounded-full shadow-sm"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // Upload UI
  return (
    <UploadDropzone
      endpoint={endpoint}
      onClientUploadComplete={(res) => {
        const file = res?.[0];
        if (res && res.length > 0) {
          if (typeof value === "string" || value === undefined) {
            onChange(file.ufsUrl);
          } else {
            onChange({ url: file.ufsUrl, type: file.type });
          }
        }
      }}
      onUploadError={(err) => {
        console.error(err);
      }}
    />
  );
};
