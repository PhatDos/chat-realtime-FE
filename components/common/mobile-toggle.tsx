import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "../ui/button";
import { NavigationSidebar } from "../navigation/navigation-sidebar";
import { ServerSidebar } from "../server/server-sidebar";

export const MobileToggle = ({ serverId }: { serverId: string }) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 flex flex-row gap-0">
        <div className="w-[72px]">
          <NavigationSidebar enableSocketListeners={false} />
        </div>
        <ServerSidebar serverId={serverId} enableSocketListeners={false} />
      </SheetContent>
    </Sheet>
  );
};
