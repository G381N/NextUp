'use client'

import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Folder } from '@/types';
import TaskList from '@/components/app/task-list';
import { notFound, useParams, useRouter } from 'next/navigation';
import { getIcon } from '@/lib/icons';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { FolderForm } from '@/components/app/folder-form';
import { useAuth } from '@/hooks/use-auth';
import React, { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';


export default function FolderPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const folderId = params.folderId as string;
  const [folder, setFolder] = useState<Folder | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSettingsSheetOpen, setIsSettingsSheetOpen] = React.useState(false);

  useEffect(() => {
    if (user && folderId) {
      localStorage.setItem('lastUsedFolderId', folderId);
      const fetchFolder = async () => {
        setLoading(true);
        const folderRef = doc(db, 'users', user.uid, 'folders', folderId);
        const folderSnap = await getDoc(folderRef);
        if (folderSnap.exists()) {
          setFolder({ id: folderSnap.id, ...folderSnap.data() } as Folder);
        } else {
          localStorage.removeItem('lastUsedFolderId');
          notFound();
        }
        setLoading(false);
      };
      fetchFolder();
    } else if (!user) {
      // if user logs out, redirect
      router.push('/login');
    }
  }, [user, folderId, router]);

  if (loading || !folder) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  const FolderIcon = getIcon(folder.icon);

  return (
    <div>
      <div className="mb-6 sm:mb-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FolderIcon className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
          <h1 className="font-headline text-lg sm:text-[22px] font-bold tracking-tight text-foreground">{folder.name}</h1>
        </div>
        <Sheet open={isSettingsSheetOpen} onOpenChange={setIsSettingsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Folder Settings</SheetTitle>
            </SheetHeader>
            <FolderForm userId={user!.uid} folder={folder} onSuccess={() => setIsSettingsSheetOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
      <TaskList folderId={folderId} />
    </div>
  );
}

// Made by Gebin George. Check out my other work on gebin.net
