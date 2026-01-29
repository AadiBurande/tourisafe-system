import { UserNav } from "@/components/user-nav";
import Link from "next/link";
import { QrCode, PanelLeft } from "lucide-react";
import { ThemeToggler } from "@/components/theme-toggler";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

export default function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
       <Link href="/" className="flex items-center gap-2 mr-auto sm:hidden">
            <QrCode className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold">VisitPass</span>
        </Link>
      <div className="ml-auto flex items-center gap-2">
            <ThemeToggler />
            <UserNav />
        </div>
    </header>
  );
}
