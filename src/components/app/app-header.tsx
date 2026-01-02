'use client';

import React from 'react';
import { useTransition } from 'react';
import { SidebarTrigger } from '../ui/sidebar';
import { Button } from '../ui/button';
import { Bolt, ChevronDown, ImagePlus, Mic, Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { runTaskPrioritization } from '@/app/actions/prioritize';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../ui/sheet';
import { TaskForm } from './task-form';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, writeBatch, doc, serverTimestamp, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Folder, Task } from '@/types';
import { importTasksFromImage } from '@/app/actions/ocr';
import { usePathname } from 'next/navigation';
import { Input } from '../ui/input';
import { transcribeAudio } from '@/ai/flows/transcribe-audio';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/app-store';

function ImportTasksSheet({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const formRef = React.useRef<HTMLFormElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImport = (formData: FormData) => {
    const currentFolderId = pathname.split('/folders/')[1];
    if (!currentFolderId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a folder first.' });
      return;
    }

    startTransition(async () => {
      const result = await importTasksFromImage(formData);
      if (result.success && result.tasks) {
        const batch = writeBatch(db);
        const tasksRef = collection(db, 'users', user!.uid, 'tasks');
        result.tasks.forEach(title => {
          if (title.trim()) {
            const newDocRef = doc(tasksRef);
            batch.set(newDocRef, {
              title: title.trim(),
              completed: false,
              folderId: currentFolderId,
              userId: user!.uid,
              order: Date.now(),
              createdAt: serverTimestamp(),
            });
          }
        });

        await batch.commit();
        toast({ title: 'Import successful', description: `${result.tasks.length} tasks were imported.` });
        setIsOpen(false);
      } else {
        toast({ variant: 'destructive', title: 'Import failed', description: result.error });
      }
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Import Tasks from Image</SheetTitle>
          <SheetDescription>
            Upload an image containing tasks to automatically import them.
          </SheetDescription>
        </SheetHeader>
        <form ref={formRef} action={handleImport} className="space-y-6 py-6">
          <p className='text-sm text-muted-foreground'>Select an image file containing a list of your tasks. We'll use AI to extract them.</p>
          <Input
            ref={fileInputRef}
            type="file"
            name="image"
            accept="image/*"
            required
          />
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Importing...' : 'Import Tasks'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function ImportFromVoiceSheet({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isRecording, setIsRecording] = React.useState(false);
  const [isTranscribing, setIsTranscribing] = React.useState(false);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);

  const { user } = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = handleTranscription;
      audioChunksRef.current = [];
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast({ variant: 'destructive', title: 'Microphone Error', description: 'Could not access the microphone. Please check your browser permissions.' });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsTranscribing(true);
    }
  };

  const handleTranscription = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64Audio = reader.result as string;
      const currentFolderId = pathname.split('/folders/')[1];
      if (!currentFolderId) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please select a folder first.' });
        setIsTranscribing(false);
        return;
      }

      try {
        const taskTitles = await transcribeAudio({ audioDataUri: base64Audio });
        if (taskTitles && taskTitles.length > 0) {
          const batch = writeBatch(db);
          const tasksRef = collection(db, 'users', user!.uid, 'tasks');
          taskTitles.forEach(title => {
            if (title.trim()) {
              const newDocRef = doc(tasksRef);
              batch.set(newDocRef, {
                title: title.trim(),
                completed: false,
                folderId: currentFolderId,
                userId: user!.uid,
                order: Date.now(),
                createdAt: serverTimestamp(),
              });
            }
          });
          await batch.commit();
          toast({ title: 'Import successful', description: `${taskTitles.length} tasks were imported.` });
          setIsOpen(false);
        } else {
          toast({ title: 'No tasks found', description: "We couldn't detect any tasks in your recording." });
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Transcription failed', description: error instanceof Error ? error.message : 'An unknown error occurred.' });
      } finally {
        setIsTranscribing(false);
      }
    };
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Import Tasks from Voice</SheetTitle>
          <SheetDescription>
            Speak to add tasks. Click the microphone to start recording.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col items-center justify-center space-y-6 py-12">
          <p className="text-center text-sm text-muted-foreground">
            {isRecording ? "Recording your tasks... Click to stop." : "Click the button and speak your tasks."}
          </p>
          <Button
            size="icon"
            className="h-24 w-24 rounded-full"
            variant={isRecording ? 'destructive' : 'outline'}
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={isTranscribing}
          >
            {isTranscribing ? (
              <Loader2 className="h-10 w-10 animate-spin" />
            ) : (
              <Mic className="h-10 w-10" />
            )}
          </Button>
          {isTranscribing && <p className="text-sm text-muted-foreground">Transcribing your audio...</p>}
        </div>
      </SheetContent>
    </Sheet>
  );
}


export default function AppHeader() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isPrioritizing, startTransition] = useTransition();
  const [isTaskSheetOpen, setIsTaskSheetOpen] = React.useState(false);
  const pathname = usePathname();
  const { isSaving } = useAppStore();

  const [folders] = useCollection(
    user ? query(collection(db, 'users', user.uid, 'folders'), where('userId', '==', user.uid)) : null
  );

  const handlePrioritize = () => {
    if (!user) return;
    const folderId = pathname.split('/folders/')[1];
    if (!folderId) {
      toast({ variant: 'destructive', title: 'No folder selected', description: 'Please select a folder to prioritize.' });
      return;
    }

    startTransition(async () => {
      const folderTasksQuery = query(
        collection(db, 'users', user.uid, 'tasks'),
        where('folderId', '==', folderId),
        where('completed', '==', false)
      );
      const tasksSnapshot = await getDocs(folderTasksQuery);

      if (tasksSnapshot.empty) {
        toast({ title: 'No tasks to prioritize', description: 'This folder has no active tasks.' });
        return;
      }

      const folderTasks = tasksSnapshot.docs.map(doc => {
        const data = doc.data();
        const task = {
          id: doc.id,
          ...data,
        } as Task;

        // Convert Timestamps to serializable format (ISO strings)
        return {
          ...task,
          createdAt: task.createdAt instanceof Timestamp ? task.createdAt.toDate().toISOString() : undefined,
          deadline: task.deadline instanceof Timestamp ? task.deadline.toDate().toISOString() : undefined,
        };
      });

      const allTasksHaveDeadline = folderTasks.every(task => !!task.deadline);
      let prioritizedTasks;

      try {
        if (allTasksHaveDeadline) {
          toast({ title: 'Sorting by deadline...', description: 'All tasks have deadlines, sorting locally.' });
          prioritizedTasks = [...folderTasks].sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());
        } else {
          toast({ title: 'Prioritizing Tasks...', description: 'Our AI is re-ordering your tasks for optimal productivity.' });
          prioritizedTasks = await runTaskPrioritization(folderTasks);
        }

        const batch = writeBatch(db);
        prioritizedTasks.forEach((task, index: number) => {
          if (task.id) {
            const taskRef = doc(db, 'users', user!.uid, 'tasks', task.id);
            batch.update(taskRef, { order: index });
          }
        });
        await batch.commit();

        toast({ title: 'Tasks Prioritized!', description: 'Your tasks have been successfully re-ordered.' });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({
          variant: 'destructive',
          title: 'Error Prioritizing Tasks',
          description: (
            <div className="mt-2 w-full overflow-auto rounded-md bg-destructive-foreground/10 p-2">
              <code className="text-xs text-destructive-foreground whitespace-pre-wrap">
                {errorMessage}
              </code>
            </div>
          )
        });
      }
    });
  };

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background px-3 lg:px-6">
      <SidebarTrigger className="lg:hidden h-9 w-9" />
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        {isSaving && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground animate-fade-in">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Saving...</span>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrioritize}
          disabled={isPrioritizing}
          className="px-2 sm:px-3"
        >
          <Bolt className={cn("h-4 w-4 sm:mr-2", isPrioritizing && "animate-spin")} />
          <span className="hidden sm:inline">
            {isPrioritizing ? 'Prioritizing...' : 'Prioritize'}
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" disabled={isPrioritizing} className="px-2 sm:px-3">
              <span className="hidden sm:inline">New</span>
              <Plus className="h-4 w-4 sm:hidden" />
              <ChevronDown className="ml-1 h-3 w-3 sm:ml-2 sm:h-4 sm:w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <Sheet open={isTaskSheetOpen} onOpenChange={setIsTaskSheetOpen}>
              <SheetTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} disabled={isPrioritizing}>
                  <Plus className="mr-2 h-4 w-4" />
                  <span>New Task</span>
                </DropdownMenuItem>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Create a new task</SheetTitle>
                  <SheetDescription>
                    Add a new task to your list. Fill out the details below.
                  </SheetDescription>
                </SheetHeader>
                <TaskForm
                  userId={user!.uid}
                  onSuccess={() => setIsTaskSheetOpen(false)}
                  folders={folders?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Folder)) || []}
                />
              </SheetContent>
            </Sheet>

            <ImportTasksSheet>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()} disabled={isPrioritizing}>
                <ImagePlus className="mr-2 h-4 w-4" />
                <span>Import from Image</span>
              </DropdownMenuItem>
            </ImportTasksSheet>

            <ImportFromVoiceSheet>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()} disabled={isPrioritizing}>
                <Mic className="mr-2 h-4 w-4" />
                <span>Import from Voice</span>
              </DropdownMenuItem>
            </ImportFromVoiceSheet>

          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}


// Made by Gebin George. Check out my other work on gebin.net
