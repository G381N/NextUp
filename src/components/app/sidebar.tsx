'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuAction,
  useSidebar,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  FolderPlus,
  PlusCircle,
  Settings,
  ChevronLeft,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Folder } from '@/types';
import { Logo } from './logo';
import { UserNav } from './user-nav';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { FolderForm } from './folder-form';
import { TaskForm } from './task-form';
import { getIcon } from '@/lib/icons';
import { cn } from '@/lib/utils';


function SidebarLogo() {
  const { toggleSidebar, state } = useSidebar();
  return (
    <button
      onClick={() => toggleSidebar()}
      className={cn(
        'flex w-full items-center gap-2.5 text-lg font-semibold tracking-tight text-foreground transition-all duration-200',
        state === 'collapsed' && 'justify-center'
      )}
    >
      <Logo />
    </button>
  );
}

function CollapseSidebarButton() {
  const { toggleSidebar, state } = useSidebar();

  if (state === 'collapsed') {
    return null;
  }

  return (
    <button
      onClick={() => toggleSidebar()}
      className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
      title="Collapse sidebar (⌘B)"
    >
      <ChevronLeft className="h-4 w-4" />
    </button>
  );
}

function FolderSettingsSheet({ folder, children }: { folder: Folder, children: React.ReactNode }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild onClick={(e) => e.stopPropagation()}>{children}</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Folder Settings</SheetTitle>
        </SheetHeader>
        <FolderForm userId={user!.uid} folder={folder} onSuccess={() => setIsOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}


export default function AppSidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const { state } = useSidebar();

  const [folders, loading] = useCollection(
    user ? query(collection(db, 'users', user.uid, 'folders'), where('userId', '==', user.uid)) : null
  );

  const [isFolderSheetOpen, setIsFolderSheetOpen] = React.useState(false);
  const [isTaskSheetOpen, setIsTaskSheetOpen] = React.useState(false);


  const [isElectron, setIsElectron] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'electronAPI' in window) {
      setIsElectron(true);
    }
  }, []);

  return (
    <Sidebar
      collapsible="icon"
      variant="inset"
      side="left"
      className={cn(
        "border-r border-border/50 transition-all duration-200",
        isElectron && "top-9 h-[calc(100vh-2.25rem)]"
      )}
    >
      {/* Header */}
      <SidebarHeader className="flex flex-row items-center justify-between px-3 py-4">
        <SidebarLogo />
        <CollapseSidebarButton />
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* Actions Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
            Actions
          </SidebarGroupLabel>
          <SidebarMenu className="mt-1">
            <Sheet open={isTaskSheetOpen} onOpenChange={setIsTaskSheetOpen}>
              <SheetTrigger asChild>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip={{ children: 'New Task', side: 'right' }}
                    className="h-9 rounded-lg"
                  >
                    <PlusCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">New Task</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Create a new task</SheetTitle>
                </SheetHeader>
                <TaskForm
                  userId={user!.uid}
                  onSuccess={() => setIsTaskSheetOpen(false)}
                  folders={folders?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Folder)) || []}
                />
              </SheetContent>
            </Sheet>

            <Sheet open={isFolderSheetOpen} onOpenChange={setIsFolderSheetOpen}>
              <SheetTrigger asChild>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip={{ children: 'New Folder', side: 'right' }}
                    className="h-9 rounded-lg"
                  >
                    <FolderPlus className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">New Folder</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Create a new folder</SheetTitle>
                </SheetHeader>
                <FolderForm userId={user!.uid} onSuccess={() => setIsFolderSheetOpen(false)} />
              </SheetContent>
            </Sheet>
          </SidebarMenu>
        </SidebarGroup>

        {/* Separator */}
        <SidebarSeparator className="my-3 mx-2 bg-border/30 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:w-6" />

        {/* Folders Section */}
        <SidebarGroup className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <SidebarGroupLabel className="px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
            Folders
          </SidebarGroupLabel>
          <SidebarMenu className="mt-1 space-y-0.5">
            {loading && (
              <>
                <SidebarMenuItem>
                  <div className="h-9 animate-pulse rounded-lg bg-secondary/50" />
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <div className="h-9 animate-pulse rounded-lg bg-secondary/50" />
                </SidebarMenuItem>
              </>
            )}
            {folders?.docs.map((doc) => {
              const folder = { id: doc.id, ...doc.data() } as Folder;
              const FolderIcon = getIcon(folder.icon);
              const isActive = pathname === `/folders/${folder.id}`;

              return (
                <SidebarMenuItem key={folder.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={{ children: folder.name, side: 'right' }}
                    className={cn(
                      "h-9 rounded-lg transition-all duration-150",
                      isActive && "bg-secondary/80 font-medium"
                    )}
                  >
                    <Link href={`/folders/${folder.id}`}>
                      <FolderIcon className={cn(
                        "h-4 w-4",
                        isActive ? "text-foreground" : "text-muted-foreground"
                      )} />
                      <span className="text-sm">{folder.name}</span>
                    </Link>
                  </SidebarMenuButton>
                  <FolderSettingsSheet folder={folder}>
                    <SidebarMenuAction
                      showOnHover
                      className="rounded-md hover:bg-secondary"
                    >
                      <Settings className="h-3.5 w-3.5" />
                    </SidebarMenuAction>
                  </FolderSettingsSheet>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-border/30 p-2">
        <UserNav />
      </SidebarFooter>
    </Sidebar>
  );
}

// Made by Gebin George. Check out my other work on gebin.net
