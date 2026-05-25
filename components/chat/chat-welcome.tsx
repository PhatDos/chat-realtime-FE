import { Hash } from "lucide-react";

interface ChatWelcomeProps {
    name: string;
    type: "channel" | "conversation";
};



export const ChatWelcome = ({
    name,
    type
}: ChatWelcomeProps) => {
    return (
        <div className="space-y-4 px-4 mb-4 animate-fade-in">
            {type === "channel" && (
                <div className="h-[75px] w-[75px] rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-600 dark:via-purple-600 dark:to-pink-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-bounce-slow">
                    <Hash className="h-12 w-12 text-white drop-shadow-md"/>
                </div>
            )}
            <div>
                <p className="text-xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                    {type === "channel" ? "Welcome to #" : ""}{name}
                </p>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                {type === "channel" 
                ? `This is the start of the #${name} channel. All messages here are part of this conversation.` 
                :`This is the start of your conversation with ${name}. Messages are encrypted and private.`}
            </p>
        </div>
    )
}