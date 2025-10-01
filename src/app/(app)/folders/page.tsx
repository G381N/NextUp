'use client';

import { Folder as FolderIcon, FolderPlus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, getDocs, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import type { Folder } from '@/types';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { FolderForm } from '@/components/app/folder-form';

export default function FoldersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isFolderSheetOpen, setIsFolderSheetOpen] = React.useState(false);

  const [folders, loading] = useCollection(
    user ? query(collection(db, 'users', user.uid, 'folders'), where('userId', '==', user.uid)) : null
  );

  useEffect(() => {
    if (loading || !user || !folders) return;

    // Don't redirect if there are no folders, so we can show the "Create Folder" button.
    if (folders.docs.length === 0) return;

    // Logic for redirection
    const redirect = async () => {
      // 1. Check for last used folder
      const lastUsedFolderId = localStorage.getItem('lastUsedFolderId');
      if (lastUsedFolderId) {
        // Check if the folder still exists
        const folderExists = folders?.docs.some(doc => doc.id === lastUsedFolderId);
        if (folderExists) {
            router.replace(`/folders/${lastUsedFolderId}`);
            return;
        } else {
            localStorage.removeItem('lastUsedFolderId');
        }
      }

      // 2. If only one folder exists, redirect to it
      if (folders?.docs.length === 1) {
        const singleFolderId = folders.docs[0].id;
        router.replace(`/folders/${singleFolderId}`);
        return;
      }
    };

    redirect();

  }, [folders, loading, router, user]);
  
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    )
  }

  // If there are folders, but none are selected (e.g. multi-folder user on first load)
  if (!loading && folders && folders.docs.length > 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <div className="rounded-full bg-secondary p-6">
          <FolderIcon className="h-16 w-16 text-muted-foreground" />
        </div>
        <h2 className="mt-6 text-2xl font-semibold">Select a folder</h2>
        <p className="mt-2 max-w-xs text-muted-foreground">
          Choose a folder from the sidebar to view its tasks, or create a new
          folder to get started.
        </p>
      </div>
    );
  }

  // If there are no folders
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="rounded-full bg-secondary p-6">
        <FolderIcon className="h-16 w-16 text-muted-foreground" />
      </div>
      <h2 className="mt-6 text-2xl font-semibold">No folders yet</h2>
      <p className="mt-2 max-w-xs text-muted-foreground">
        Create your first folder to start organizing your tasks.
      </p>
      <Sheet open={isFolderSheetOpen} onOpenChange={setIsFolderSheetOpen}>
        <SheetTrigger asChild>
            <Button className="mt-6">
                <FolderPlus className="mr-2 h-4 w-4" />
                Create Folder
            </Button>
        </SheetTrigger>
        <SheetContent>
            <SheetHeader>
                <SheetTitle>Create a new folder</SheetTitle>
            </SheetHeader>
            <FolderForm userId={user!.uid} onSuccess={() => setIsFolderSheetOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Made by Gebin George. Check out my other work on gebin.net
