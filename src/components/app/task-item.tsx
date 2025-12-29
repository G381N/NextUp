'use client';

import React from 'react';
import { useTransition, useState, useRef, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Edit, Calendar, GripVertical, Trash2 } from 'lucide-react';
import type { Task, Folder } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
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
} from '../ui/alert-dialog';
import { TaskForm } from './task-form';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, doc, updateDoc, writeBatch, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { cn } from '@/lib/utils';
import { format, isToday } from 'date-fns';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Textarea } from '../ui/textarea';
import { useAppStore } from '@/store/app-store';

interface TaskItemProps {
  task: Task;
  tasks: Task[]; // Pass the whole list for creating a new task
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function TaskItem({ task, tasks }: TaskItemProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [isEditSheetOpen, setIsEditSheetOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const setIsSaving = useAppStore((state) => state.setIsSaving);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: task.completed });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  const [folders] = useCollection(
    user ? query(collection(db, 'users', user.uid, 'folders'), where('userId', '==', user.uid)) : null
  );

  const handleToggleCompletion = () => {
    if (!user) return;
    setIsSaving(true);
    startTransition(async () => {
      try {
        const taskRef = doc(db, 'users', user.uid, 'tasks', task.id);
        const completedAt = !task.completed ? serverTimestamp() : null;
        // Ensure the animation shows for at least 500ms
        await Promise.all([
          updateDoc(taskRef, { completed: !task.completed, completedAt }),
          sleep(500)
        ]);
      } catch (e) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to update task.',
        });
      } finally {
        setIsSaving(false);
      }
    });
  };

  const handleDeleteTask = async () => {
    if (!user) return;
    setIsDeleting(true);
    setIsSaving(true);
    try {
      const taskRef = doc(db, 'users', user.uid, 'tasks', task.id);
      await deleteDoc(taskRef);
      toast({
        title: 'Task deleted',
        description: 'The task has been permanently removed.',
      });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete task.',
      });
    } finally {
      setIsDeleting(false);
      setIsSaving(false);
    }
  };

  const handleTitleClick = () => {
    if (task.completed) return;
    setIsEditing(true);
  };

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
      adjustTextareaHeight(textareaRef.current);
    }
  }, [isEditing]);

  const adjustTextareaHeight = (el: HTMLTextAreaElement) => {
    el.style.height = 'inherit';
    el.style.height = `${el.scrollHeight}px`;
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTitle(e.target.value);
    adjustTextareaHeight(e.target);
  };

  const saveTitle = async () => {
    if (!user || title.trim() === task.title) {
      setIsEditing(false);
      if (title.trim() === '') setTitle(task.title); // Revert if empty
      return;
    }

    if (title.trim() === '') {
      setIsEditing(false);
      setTitle(task.title);
      return;
    }

    setIsSaving(true);
    try {
      const taskRef = doc(db, 'users', user.uid, 'tasks', task.id);
      await Promise.all([
        updateDoc(taskRef, { title: title.trim() }),
        sleep(500)
      ]);
      setIsEditing(false);
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update task title.',
      });
      setTitle(task.title); // Revert on error
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      await createNewTaskBelow();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setTitle(task.title);
    }
  };

  const createNewTaskBelow = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const batch = writeBatch(db);

      // First, save the current task's title if it has changed
      if (title.trim() !== task.title) {
        const currentTaskRef = doc(db, 'users', user.uid, 'tasks', task.id);
        batch.update(currentTaskRef, { title: title.trim() || "Untitled Task" });
      }

      // Logic to create the new task
      const uncompletedTasks = tasks.filter(t => !t.completed).sort((a, b) => a.order - b.order);
      const currentIndex = uncompletedTasks.findIndex(t => t.id === task.id);

      // If task not found or it's a completed task, something is wrong.
      if (currentIndex === -1) {
        throw new Error("Could not find the current task in the uncompleted list.");
      }

      const newOrder = uncompletedTasks[currentIndex].order + 1;

      // Create the new blank task
      const newTaskRef = doc(collection(db, 'users', user.uid, 'tasks'));
      batch.set(newTaskRef, {
        title: "", // New task is blank
        completed: false,
        folderId: task.folderId,
        userId: task.userId,
        order: newOrder,
        createdAt: serverTimestamp(),
      });

      // Re-order all subsequent tasks to make room
      for (let i = currentIndex + 1; i < uncompletedTasks.length; i++) {
        const taskToUpdate = uncompletedTasks[i];
        const taskRef = doc(db, 'users', user.uid, 'tasks', taskToUpdate.id);
        // We shift every subsequent task's order down by one.
        batch.update(taskRef, { order: taskToUpdate.order + 1 });
      }

      await Promise.all([batch.commit(), sleep(500)]);

      // We don't change component state here, we let Firestore's real-time updates handle it.
      // The new task will appear and this component will re-render with the updated title.
      setIsEditing(false);

    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to create a new task.';
      toast({
        variant: 'destructive',
        title: 'Error creating task',
        description: message,
      });
      setTitle(task.title); // Revert title on error
    } finally {
      setIsSaving(false);
    }
  }


  const renderDeadline = () => {
    if (!task.deadline) return null;
    const deadlineDate = task.deadline.toDate();
    const deadlineText = (showTime || isToday(deadlineDate))
      ? format(deadlineDate, 'p, PP') // e.g., 11:00 AM, Sep 27, 2025
      : format(deadlineDate, 'PP'); // e.g., Sep 27, 2025

    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 cursor-pointer" onClick={() => setShowTime(prev => !prev)}>
        <Calendar className="h-3.5 w-3.5" />
        <span>{deadlineText}</span>
      </div>
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex items-center gap-4 rounded-md bg-transparent px-4 py-3.5 transition-colors hover:bg-secondary',
        task.completed && 'opacity-50',
        isDragging && 'shadow-xl z-50 bg-secondary'
      )}
    >
      {/* Drag Handle */}
      {!task.completed && (
        <div {...attributes} {...listeners} className="touch-none cursor-grab text-muted-foreground/40 opacity-0 transition-opacity duration-200 hover:text-foreground group-hover:opacity-100">
          <GripVertical className="h-4 w-4" />
        </div>
      )}
      {task.completed && <div className="w-4" />}

      <Checkbox
        id={`task-${task.id}`}
        checked={task.completed}
        onCheckedChange={handleToggleCompletion}
        disabled={isPending}
        className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 data-[state=checked]:border-accent data-[state=checked]:bg-accent transition-all duration-200"
      />

      <div className="flex-1 flex flex-col justify-center min-w-0">
        {isEditing ? (
          <Textarea
            ref={textareaRef}
            value={title}
            onChange={handleTitleChange}
            onBlur={saveTitle}
            onKeyDown={handleKeyDown}
            className="resize-none h-auto min-h-0 p-0 text-[15px] font-semibold border-none focus-visible:ring-0 leading-tight bg-transparent placeholder:text-muted-foreground/50 text-foreground"
            rows={1}
            placeholder="What needs to be done?"
          />
        ) : (
          <span
            onClick={handleTitleClick}
            className={cn(
              'text-[15px] font-semibold leading-tight truncate transition-colors duration-200',
              task.completed ? 'text-muted-foreground line-through decoration-muted-foreground/50' : 'text-foreground cursor-text',
              !task.title && 'text-muted-foreground/40 italic'
            )}
          >
            {task.title || "Untitled Task"}
          </span>
        )}

        {/* Metadata Row */}
        {!task.completed && (task.deadline || showTime) && (
          <div className="flex items-center gap-2 mt-0.5">
            {renderDeadline()}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
        {task.completed ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-transparent" disabled={isDeleting}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Task?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this task. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteTask} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-transparent">
                <Edit className="h-3.5 w-3.5" />
              </Button>
            </SheetTrigger>
            <SheetContent onOpenAutoFocus={(e) => e.preventDefault()}>
              <SheetHeader>
                <SheetTitle>Edit Task</SheetTitle>
              </SheetHeader>
              <TaskForm
                userId={user!.uid}
                task={task}
                onSuccess={() => setIsEditSheetOpen(false)}
                folders={folders?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Folder)) || []}
              />
            </SheetContent>
          </Sheet>
        )}
      </div>
    </div>
  );
}

// Made by Gebin George. Check out my other work on gebin.net
