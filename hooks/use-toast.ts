"use client";

import * as React from "react";

import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 3000;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

type ActionType =
  | "ADD_TOAST"
  | "UPDATE_TOAST"
  | "DISMISS_TOAST"
  | "REMOVE_TOAST";

type Action =
  | { type: Extract<ActionType, "ADD_TOAST">; toast: ToasterToast }
  | { type: Extract<ActionType, "UPDATE_TOAST">; toast: Partial<ToasterToast> }
  | { type: Extract<ActionType, "DISMISS_TOAST">; toastId?: ToasterToast["id"] }
  | { type: Extract<ActionType, "REMOVE_TOAST">; toastId?: ToasterToast["id"] };

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t,
        ),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t,
        ),
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  for (const listener of listeners) {
    listener(memoryState);
  }
}

type Toast = Omit<ToasterToast, "id">;

type ToastHandle = {
  id: string;
  dismiss: () => void;
  update: (props: ToasterToast) => void;
};

type ServerMessageNotificationPayload = {
  senderName: string;
  channelName: string;
  serverName?: string;
  content?: string;
};

type ServerToast = {
  successJoin: (serverName: string) => ToastHandle;
  errorJoinInvalidInvite: (message?: string) => ToastHandle;
  errorJoin: (message?: string) => ToastHandle;
  infoMessageNotification: (
    payload: ServerMessageNotificationPayload,
  ) => ToastHandle;
  successCreate: (serverName: string) => ToastHandle;
  errorCreate: (message?: string) => ToastHandle;
  successCreateFirst: (serverName: string) => ToastHandle;
  errorCreateFirst: (message?: string) => ToastHandle;
  successDelete: (serverName?: string) => ToastHandle;
  errorDelete: (message?: string) => ToastHandle;
  successLeave: (serverName?: string) => ToastHandle;
  errorLeave: (message?: string) => ToastHandle;
  successUpdate: (serverName: string) => ToastHandle;
  errorUpdate: (message?: string) => ToastHandle;
};

type ChannelToast = {
  successCreate: (channelName: string) => ToastHandle;
  errorCreate: (message?: string) => ToastHandle;
  successUpdate: (channelName: string) => ToastHandle;
  errorUpdate: (message?: string) => ToastHandle;
  successDelete: (channelName?: string) => ToastHandle;
  errorDelete: (message?: string) => ToastHandle;
  errorUpdateNotification: (message?: string) => ToastHandle;
};

type AiToast = {
  infoUnreadSummaryNoContent: (message?: string) => ToastHandle;
  errorUnreadSummary: (message?: string) => ToastHandle;
};

type AppToast = ((props: Toast) => ToastHandle) & {
  server: ServerToast;
  channel: ChannelToast;
  ai: AiToast;
};

function dispatchToast({ ...props }: Toast): ToastHandle {
  const id = genId();

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id: id,
    dismiss,
    update,
  };
}

const successToast = (title: string, description: string) =>
  dispatchToast({
    title,
    description,
    variant: "success",
  });

const errorToast = (title: string, description: string) =>
  dispatchToast({
    title,
    description,
    variant: "destructive",
  });

const infoToast = (title: string, description: string) =>
  dispatchToast({
    title,
    description,
    variant: "info",
  });

const serverToast: ServerToast = {
  successJoin: (serverName: string) =>
    successToast("Success", `You have joined "${serverName}"!`),
  errorJoinInvalidInvite: (message?: string) =>
    errorToast(
      "Error",
      message ?? "Server not found or invite code is invalid",
    ),
  errorJoin: (message?: string) =>
    errorToast(
      "Error",
      message ?? "Failed to join server. Please try again!",
    ),
  infoMessageNotification: ({
    senderName,
    channelName,
    serverName,
    content,
  }: ServerMessageNotificationPayload) => {
    const messageContent = content || "Sent a file";

    return dispatchToast({
      variant: "info",
      className: "shadow-2xl backdrop-blur",
      title: `Server: ${serverName ? `${serverName} from Channel ` : ""}#${channelName}`,
      description: `${senderName}: ${
        messageContent.length > 20
          ? `${messageContent.substring(0, 20)}...`
          : messageContent
      }`,
    });
  },
  successCreate: (serverName: string) =>
    successToast("Server created", `Server "${serverName}" has been created!`),
  errorCreate: (message?: string) =>
    errorToast(
      "Error",
      message ?? "Failed to create server. Please try again!",
    ),
  successCreateFirst: (serverName: string) =>
    successToast(
      "Welcome!",
      `Server "${serverName}" has been created successfully!`,
    ),
  errorCreateFirst: (message?: string) =>
    errorToast(
      "Error",
      message ?? "Failed to create your first server. Please try again!",
    ),
  successDelete: (serverName?: string) =>
    successToast(
      "Server deleted",
      serverName
        ? `Server "${serverName}" has been deleted!`
        : "Server has been deleted!",
    ),
  errorDelete: (message?: string) =>
    errorToast(
      "Error",
      message ?? "Failed to delete server. Please try again!",
    ),
  successLeave: (serverName?: string) =>
    successToast(
      "Server left",
      serverName
        ? `You have left server "${serverName}"!`
        : "You have left the server!",
    ),
  errorLeave: (message?: string) =>
    errorToast(
      "Error",
      message ?? "Failed to leave server. Please try again!",
    ),
  successUpdate: (serverName: string) =>
    successToast("Server updated", `Server "${serverName}" has been updated!`),
  errorUpdate: (message?: string) =>
    errorToast(
      "Error",
      message ?? "Failed to update server. Please try again!",
    ),
};

const channelToast: ChannelToast = {
  successCreate: (channelName: string) =>
    successToast("Channel created", `Channel "${channelName}" has been created!`),
  errorCreate: (message?: string) =>
    errorToast(
      "Error",
      message ?? "Failed to create channel. Please try again!",
    ),
  successUpdate: (channelName: string) =>
    successToast("Channel updated", `Channel "${channelName}" has been updated!`),
  errorUpdate: (message?: string) =>
    errorToast(
      "Error",
      message ?? "Failed to update channel. Please try again!",
    ),
  successDelete: (channelName?: string) =>
    successToast(
      "Channel deleted",
      channelName
        ? `Channel "${channelName}" has been deleted!`
        : "Channel has been deleted!",
    ),
  errorDelete: (message?: string) =>
    errorToast(
      "Error",
      message ?? "Failed to delete channel. Please try again!",
    ),
  errorUpdateNotification: (message?: string) =>
    errorToast(
      "Notification update failed",
      message ?? "Could not update channel notification setting.",
    ),
};

const aiToast: AiToast = {
  infoUnreadSummaryNoContent: (message?: string) =>
    infoToast("AI unread-summary", message ?? "AI did not return content"),
  errorUnreadSummary: (message?: string) =>
    errorToast(
      "AI unread-summary failed, try again",
      message ?? "Failed to fetch summary",
    ),
};

const toast = Object.assign(dispatchToast, {
  server: serverToast,
  channel: channelToast,
  ai: aiToast,
}) as AppToast;

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { useToast, toast };
