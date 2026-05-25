"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { useSocket } from "@/components/providers/socket-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/common/file-upload";
import { useModal } from "@/hooks/use-modal-store";

const formSchema = z.object({
  fileUrl: z.object({
    url: z.string().min(1, "File URL is required"),
    type: z.string().optional(),
  }),
});

type MessagePayload =
  | {
    content: string;
    fileUrl: string;
    fileType: "pdf" | "img";
    senderId: string;
    conversationId: string;
  }
  | {
    content: string;
    fileUrl: string;
    fileType: "pdf" | "img";
    memberId: string;
    channelId: string;
  };

export const MessageFileModal = () => {
  const { isOpen, onClose, type, data } = useModal();
  const { query } = data || {};
  const isModalOpen = isOpen && type === "messageFile";
  const { socket } = useSocket();
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { fileUrl: { url: "", type: "" } },
  });

  const isLoading = form.formState.isSubmitting;

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!socket || !query?.memberId) return;

    const fileType = values.fileUrl.type?.includes("pdf") ? "pdf" : "img";

    let payload: MessagePayload;

    if (query.chatType === "conversation" && query.conversationId) {
      payload = {
        content: values.fileUrl.url,
        fileUrl: values.fileUrl.url,
        fileType,
        senderId: query.memberId, // Sửa: memberId → senderId
        conversationId: query.conversationId,
      };
      socket.emit("dm:create", payload);
    } else if (query.chatType === "channel" && query.channelId) {
      payload = {
        content: values.fileUrl.url,
        fileUrl: values.fileUrl.url,
        fileType,
        memberId: query.memberId, // FE gửi userId, backend map sang Member
        channelId: query.channelId,
      };
      socket.emit("channel:message:create", payload);
    }

    form.reset();
    router.refresh();
    handleClose();
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white text-black p-0 overflow-hidden">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center font-bold">
            Give me!
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-500 italic">
            Wanna send some things?
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 px-6 pb-6"
          >
            <div className="flex justify-center px-6">
              <FormField
                control={form.control}
                name="fileUrl"
                render={({ field }) => (
                  <FormItem className="w-full flex justify-center">
                    <FormControl>
                      <FileUpload
                        endpoint="messageFile"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="flex justify-center">
              <Button
                className="w-1/3 bg-blue-500 border-slate-50 border-2 text-white hover:bg-blue-600 hover:text-white hover:border-blue-400 px-4 py-2 text-sm"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
