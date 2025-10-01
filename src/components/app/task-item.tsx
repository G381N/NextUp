'use client';

import React from 'react';
import { useTransition, useState, useRef, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Edit, Calendar, GripVertical } from 'lucide-react';
import type { Task, Folder } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { TaskForm } from './task-form';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, doc, updateDoc, writeBatch, addDoc, serverTimestamp } from 'firebase/firestore';
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
    
    if(title.trim() === '') {
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
      const uncompletedTasks = tasks.filter(t => !t.completed).sort((a,b) => a.order - b.order);
      const currentIndex = uncompletedTasks.findIndex(t => t.id === task.id);
      
      // If task not found or it's a completed task, something is wrong.
      if(currentIndex === -1) {
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
        'group flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50',
        task.completed && 'bg-muted/30 opacity-70',
        isDragging && 'shadow-lg'
      )}
    >
      {!task.completed && (
        <div {...attributes} {...listeners} className="touch-none mt-0.5 cursor-grab p-1">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      {task.completed && <div className="w-6" />}

      <Checkbox
        id={`task-${task.id}`}
        checked={task.completed}
        onCheckedChange={handleToggleCompletion}
        disabled={isPending}
        className="h-5 w-5 mt-0.5"
      />
      <div className="flex-1">
        {isEditing ? (
            <Textarea
              ref={textareaRef}
              value={title}
              onChange={handleTitleChange}
              onBlur={saveTitle}
              onKeyDown={handleKeyDown}
              className="resize-none h-auto min-h-0 p-0 text-sm font-medium border-none focus-visible:ring-0 leading-snug"
              rows={1}
            />
        ) : (
            <span
              onClick={handleTitleClick}
              className={cn(
                'text-sm font-medium whitespace-pre-wrap',
                task.completed ? 'text-muted-foreground line-through' : 'cursor-text',
                // Add min-height to prevent layout shift for empty tasks
                !task.title && !isEditing ? 'min-h-[20px] block' : ''
              )}
            >
              {task.title}
            </span>
        )}
        {renderDeadline()}
      </div>
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Edit className="h-4 w-4" />
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
      </div>
    </div>
  );
}

// Made by Gebin George. Check out my other work on gebin.net
