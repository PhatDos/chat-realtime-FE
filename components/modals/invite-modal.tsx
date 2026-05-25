"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useModal } from "@/hooks/use-modal-store";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Check, Copy, RefreshCw } from "lucide-react";
import { useOrigin } from "@/hooks/use-origin";
import { useState } from "react";
import { useApiClient } from "@/hooks/use-api-client";
import { refreshServerInviteCode } from "@/services/servers/servers-service";
import { QRCodeBlock } from "@/components/common/qr-code-block";

export const InviteModal = () => {
    const { onOpen, isOpen, onClose, type, data } = useModal();
    const origin = useOrigin();
    const api = useApiClient();

    const isModalOpen = isOpen && type === "invite";
    const { server } = data;
    const inviteUrl = `${origin}/invite/${server?.inviteCode}`;

    const [ copied, setCopied ] = useState(false);
    const [ isLoading, setIsLoading ] = useState(false);
    const onCopy = () => {
        navigator.clipboard.writeText(inviteUrl);
        setCopied(true);

        setTimeout(() => {
            setCopied(false);
        }, 2000);
    }

    const onNew = async () => {
        try {
            setIsLoading(true);
            const response = await refreshServerInviteCode(api, server?.id as string)

            onOpen("invite", { server: response })
        } catch (err) {
            console.log(err);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={isModalOpen} onOpenChange={onClose}>
            <DialogContent className="bg-white text-black p-0 overflow-hidden">
                <DialogHeader className="pt-8 px-6">
                    <DialogTitle className="text-2xl text-center font-bold">
                        Invite people to your server 🎉
                    </DialogTitle>
                </DialogHeader>
                <div className="p-6">
                    <Label
                        className="uppercase text-xs font-bold 
                        text-zinc-500 dark:text-secondary/70"
                    >
                        Server invite link
                    </Label>
                    <div className="flex items-center mt-2 gap-x-2">
                        <Input disabled={isLoading} className="bg-zinc-300/50 border-0 
                        focus-visible:ring-0
                        text-black focus-visible:ring-offset-0"
                            value={inviteUrl}
                            readOnly>
                        </Input>
                        <Button disabled={isLoading} onClick={onCopy} size="icon">
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                    </div>
                    <div className="mt-6">
                        <QRCodeBlock
                            title="Invite QR"
                            description="Scan to open the invite link instantly."
                            value={inviteUrl}
                            size={200}
                        />
                    </div>
                    <Button onClick={onNew} disabled={isLoading} variant="link"
                        size="sm"
                        className="text-xs text-zinc-500 mt-4">
                        Generate a new link
                        <RefreshCw className="w-4 h-4 mr-2" />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}