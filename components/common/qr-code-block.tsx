"use client";

import QRCode from "react-qr-code";

interface QRCodeBlockProps {
  value: string;
  title: string;
  description?: string;
  size?: number;
}

export const QRCodeBlock = ({ value, title, description, size = 120 }: QRCodeBlockProps) => {
  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {title}
        </h4>
        {description ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {description}
          </p>
        ) : null}
      </div>

      <div className="flex justify-center rounded-2xl bg-white p-4">
        <QRCode
          value={value}
          size={size}
        />
      </div>
    </div>
  );
};