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
  returnObject?: boolean;
}

export const FileUpload = ({ onChange, value, endpoint, returnObject }: FileUploadProps) => {
  const url = typeof value === "string" ? value : value?.url;
  const type =
    typeof value === "string"
      ? value.split(".").pop()?.toLowerCase() || ""
      : value?.type || "";

  if (url && !type.includes("pdf")) {
    return (
      <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
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
      <div className="relative mx-auto mt-2 flex w-fit flex-col items-center rounded-md bg-background/10 p-2">
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
    <div className="mx-auto flex w-full justify-center">
      <div className="w-full">
        <UploadDropzone
          endpoint={endpoint}
          onClientUploadComplete={(res) => {
            const file = res?.[0];
            if (res && res.length > 0) {
              if (returnObject) {
                onChange({ url: file.ufsUrl, type: file.type });
              } else if (typeof value === "string" || value === undefined) {
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
      </div>
    </div>
  );
};
