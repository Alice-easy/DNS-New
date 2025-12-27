"use client";

import * as React from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  Globe,
  Server,
  FileText,
  Settings,
  Activity,
  LogOut,
  ChevronDown,
  Menu,
  Shield,
  History,
  GitCompare,
  Radar,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

interface NavItem {
  titleKey: "dashboard" | "providers" | "domains" | "records" | "monitoring" | "alerts" | "changes" | "logs" | "settings" | "admin";
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { titleKey: "dashboard", href: "/", icon: Activity },
  { titleKey: "providers", href: "/providers", icon: Server },
  { titleKey: "domains", href: "/domains", icon: Globe },
  { titleKey: "records", href: "/records", icon: FileText },
  { titleKey: "monitoring", href: "/monitoring", icon: Radar },
  { titleKey: "alerts", href: "/alerts", icon: Bell },
  { titleKey: "changes", href: "/changes", icon: GitCompare },
  { titleKey: "logs", href: "/logs", icon: History },
  { titleKey: "settings", href: "/settings", icon: Settings },
  { titleKey: "admin", href: "/admin", icon: Shield, adminOnly: true },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const t = useTranslations("Navigation");

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href;
    return (
      <Link
        href={item.href}
        className={cn(
          "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
            : cn(
                "text-muted-foreground/80 hover:text-foreground",
                "hover:bg-accent/50 hover:shadow-sm",
                "before:absolute before:left-0 before:h-0 before:w-0.5",
                "before:bg-primary before:transition-all before:duration-200",
                "hover:before:h-full"
              )
        )}
        onClick={() => setSidebarOpen(false)}
      >
        <item.icon className={cn(
          "h-4 w-4 transition-transform duration-200",
          "group-hover:scale-110",
          isActive && "drop-shadow-sm"
        )} />
        {t(item.titleKey)}
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Globe className="h-6 w-6" />
          <span>DNS Manager</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems
          .filter((item) => !item.adminOnly || user?.role === "admin")
          .map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
      </nav>

      {/* User section */}
      {user && (
        <div className="border-t p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user.image || undefined} />
                  <AvatarFallback>
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate text-left text-sm">
                  {user.name || user.email}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  {t("settings")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <form action="/api/auth/signout" method="POST" className="w-full">
                  <button type="submit" className="flex w-full items-center">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("signOut")}
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden w-[220px] flex-shrink-0 border-r border-border/50 bg-gradient-to-b from-card/80 to-card/50 backdrop-blur-md lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-50 flex h-14 items-center justify-between gap-4 border-b border-border/40 bg-card/80 backdrop-blur-lg px-4 shadow-sm">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
            </Sheet>
            <Link href="/" className="flex items-center gap-2 font-semibold lg:hidden">
              <Globe className="h-5 w-5" />
              <span>DNS Manager</span>
            </Link>
          </div>

          {/* Language Switcher - always visible */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-background">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
