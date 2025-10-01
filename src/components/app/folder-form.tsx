'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { IconPicker } from './icon-picker';
import { iconNames } from '@/lib/icons';
import { useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Folder } from '@/types';
import { addDoc, collection, doc, serverTimestamp, updateDoc, writeBatch, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';

const folderSchema = z.object({
  name: z.string().min(1, 'Folder name is required.'),
  icon: z.string().refine((val) => iconNames.includes(val), 'Invalid icon.'),
});

type FolderFormValues = z.infer<typeof folderSchema>;

interface FolderFormProps {
  userId: string;
  folder?: Folder;
  onSuccess?: () => void;
}

async function deleteFolderWithTasks(folderId: string, userId: string) {
    if (!userId) {
        throw new Error('User not authenticated');
    }
    const folderRef = doc(db, 'users', userId, 'folders', folderId);
    
    // Create a batch write to delete the folder and all its tasks atomically
    const batch = writeBatch(db);

    // Delete the folder
    batch.delete(folderRef);

    // Find and delete all tasks in the folder
    const tasksRef = collection(db, 'users', userId, 'tasks');
    const q = query(tasksRef, where('folderId', '==', folderId));
    const tasksSnapshot = await getDocs(q);
    tasksSnapshot.forEach((taskDoc) => {
        batch.delete(taskDoc.ref);
    });

    await batch.commit();
}


export function FolderForm({ userId, folder, onSuccess }: FolderFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FolderFormValues>({
    resolver: zodResolver(folderSchema),
    defaultValues: {
      name: folder?.name || '',
      icon: folder?.icon || 'FileText',
    },
  });

  const onSubmit = (values: FolderFormValues) => {
    if (!userId) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'You must be logged in to create or update a folder.'
        });
        return;
    }
    startTransition(async () => {
      try {
        if (folder) {
          const folderRef = doc(db, 'users', userId, 'folders', folder.id);
          await updateDoc(folderRef, values);
          toast({ title: 'Success', description: 'Folder updated successfully.' });
        } else {
          await addDoc(collection(db, 'users', userId, 'folders'), {
            ...values,
            userId,
            createdAt: serverTimestamp(),
          });
          toast({ title: 'Success', description: 'Folder created successfully.' });
        }
        onSuccess?.();
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description:
            error instanceof Error ? error.message : 'An unknown error occurred.',
        });
      }
    });
  };

  const handleDelete = () => {
    if (!folder || !userId) return;
    startDeleteTransition(async () => {
        try {
            await deleteFolderWithTasks(folder.id, userId);
            toast({ title: 'Folder deleted', description: `The "${folder.name}" folder and all its tasks have been removed.` });
            router.push('/folders');
            onSuccess?.();
        } catch (error) {
            const message = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ variant: 'destructive', title: 'Error deleting folder', description: message });
        }
    });
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-6">
          <div className="flex items-center gap-4">
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <IconPicker value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel className="sr-only">Folder Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Folder Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending
              ? 'Saving...'
              : folder
              ? 'Save Changes'
              : 'Create Folder'}
          </Button>
        </form>
      </Form>
      {folder && (
        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Deleting a folder will also permanently delete all tasks within it. This action cannot be undone.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">Delete Folder</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the <strong>{folder.name}</strong> folder and all tasks inside it. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting ? 'Deleting...' : 'Yes, delete folder'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </>
  );
}

// Made by Gebin George. Check out my other work on gebin.net
