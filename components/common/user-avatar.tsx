import {Avatar, AvatarImage} from "@/components/ui/avatar"
import {cn} from "@/lib/utils"

interface UserAvatarProps {
    src?: string;
    className?: string;
    isOnline?: boolean;
    badgeClassName?: string;
};

export const UserAvatar = ({
    src,
    className,
    isOnline,
    badgeClassName
}: UserAvatarProps) => {
    return (
        <div className={cn("relative inline-block h-7 w-7 md:h-10 md:w-10", className)}>
            <div className="overflow-hidden rounded-full h-full w-full">
                <Avatar className="h-full w-full border-0 bg-transparent">
                    <AvatarImage src={src} />
                </Avatar>
            </div>
            {isOnline && (
                <span className={cn(
                    "pointer-events-none absolute bottom-0 right-0 z-20 block h-3 w-3 rounded-full border-2 border-white bg-green-500 shadow dark:border-zinc-900",
                    badgeClassName
                )} />
            )}
        </div>
    )
}