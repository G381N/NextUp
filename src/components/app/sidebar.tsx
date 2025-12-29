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
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
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
          'flex w-full items-center gap-2 text-lg font-bold tracking-tight text-foreground',
           state === 'collapsed' && 'justify-center'
        )}
      >
        <Logo showText={state === 'expanded'} />
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
        className="text-muted-foreground hover:text-foreground transition-colors"
        title="Collapse sidebar"
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

  const [folders, loading, error] = useCollection(
    user ? query(collection(db, 'users', user.uid, 'folders'), where('userId', '==', user.uid)) : null
  );

  const [isFolderSheetOpen, setIsFolderSheetOpen] = React.useState(false);
  const [isTaskSheetOpen, setIsTaskSheetOpen] = React.useState(false);


  return (
    <Sidebar
      collapsible="icon"
      variant="inset"
      side="left"
      className="border-r"
    >
      <SidebarHeader className="flex flex-row items-center justify-between">
        <SidebarLogo />
        <CollapseSidebarButton />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Actions</SidebarGroupLabel>
          <SidebarMenu>
            <Sheet open={isTaskSheetOpen} onOpenChange={setIsTaskSheetOpen}>
              <SheetTrigger asChild>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip={{ children: 'New Task', side: 'right' }}>
                        <PlusCircle />
                        <span>New Task</span>
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
                    <SidebarMenuButton tooltip={{ children: 'New Folder', side: 'right' }}>
                        <FolderPlus />
                        <span>New Folder</span>
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
        
        <SidebarSeparator className="my-1 group-data-[collapsible=icon]:my-2 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:w-2/3" />

        <SidebarGroup className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <SidebarGroupLabel>Folders</SidebarGroupLabel>
          <SidebarMenu>
            {loading && (
              <>
                <SidebarMenuButton className="h-8 animate-pulse rounded-md bg-muted" />
                <SidebarMenuButton className="h-8 animate-pulse rounded-md bg-muted" />
              </>
            )}
            {folders?.docs.map((doc) => {
              const folder = { id: doc.id, ...doc.data() } as Folder;
              const FolderIcon = getIcon(folder.icon);
              return (
                <SidebarMenuItem key={folder.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === `/folders/${folder.id}`}
                    tooltip={{ children: folder.name, side: 'right' }}
                  >
                    <Link href={`/folders/${folder.id}`}>
                      <FolderIcon className="h-4 w-4" />
                      <span>{folder.name}</span>
                    </Link>
                  </SidebarMenuButton>
                   <FolderSettingsSheet folder={folder}>
                      <SidebarMenuAction showOnHover>
                          <Settings />
                      </SidebarMenuAction>
                  </FolderSettingsSheet>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <UserNav />
      </SidebarFooter>
    </Sidebar>
  );
}

// Made by Gebin George. Check out my other work on gebin.net
