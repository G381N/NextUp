'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, orderBy, writeBatch, doc, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import TaskItem from './task-item';
import type { Task } from '@/types';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { AlertCircle } from 'lucide-react';
import { Separator } from '../ui/separator';
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers';

interface TaskListProps {
  folderId: string;
}

export default function TaskList({ folderId }: TaskListProps) {
  const { user } = useAuth();
  const [tasksCollection, loading, error] = useCollection(
    user
      ? query(
          collection(db, 'users', user.uid, 'tasks'),
          where('folderId', '==', folderId),
          orderBy('completed', 'asc'),
          orderBy('order', 'asc')
        )
      : null
  );

  const tasks: Task[] = (tasksCollection?.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Task[]) || [];
  
  useEffect(() => {
    if (!user || tasks.length === 0) return;

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const batch = writeBatch(db);
    let dirty = false;

    tasks.forEach(task => {
      if (task.completed && task.completedAt) {
        const completedDate = (task.completedAt as Timestamp).toDate();
        if (completedDate < twentyFourHoursAgo) {
          const taskRef = doc(db, 'users', user.uid, 'tasks', task.id);
          batch.delete(taskRef);
          dirty = true;
        }
      }
    });

    if (dirty) {
      batch.commit().catch(console.error);
    }
  }, [tasks, user]);


  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    
    if (!user) return;

    const oldIndex = tasks.findIndex((task) => task.id === active.id);
    const newIndex = tasks.findIndex((task) => task.id === over.id);

    const newTasksOrder = arrayMove(tasks, oldIndex, newIndex);

    // Update the 'order' property in Firestore
    const batch = writeBatch(db);
    newTasksOrder.forEach((task, index) => {
        const taskRef = doc(db, 'users', user.uid, 'tasks', task.id);
        batch.update(taskRef, { order: index });
    });
    await batch.commit();
  };

  const uncompletedTasks = tasks?.filter(task => !task.completed) || [];
  const completedTasks = tasks?.filter(task => task.completed) || [];

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (error) {
    const isIndexError = error.code === 'failed-precondition';
    const firestoreIndexURL = `https://console.firebase.google.com/v1/r/project/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/firestore/indexes?create_composite=ClVwcm9qZWN0cy9zdHVkaW8tNDAyNTQ2ODQwOS05MGUxOC9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvdGFza3MvaW5kZXhlcy9fEAEaDAoIZm9sZGVySWQQARoNCgljb21wbGV0ZWQQARoJCgVvcmRlchABGgwKCF9fbmFtZV9fEAE`;

    return (
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error fetching tasks</AlertTitle>
            <AlertDescription>
                {isIndexError ? (
                    <>
                        <p className="mb-2">A Firestore index is required to sort and filter these tasks. Please create the index to continue.</p>
                        <Button asChild>
                            <a href={firestoreIndexURL} target="_blank" rel="noopener noreferrer">Create Index</a>
                        </Button>
                    </>
                ) : (
                    <p>{error.message}</p>
                )}
            </AlertDescription>
        </Alert>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <p>No tasks in this folder yet.</p>
        <p className="text-sm">Ready to add one?</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
    >
      <div className="space-y-2">
        <SortableContext items={uncompletedTasks} strategy={verticalListSortingStrategy}>
          {uncompletedTasks.map((task) => (
            <TaskItem key={task.id} task={task} tasks={tasks} />
          ))}
        </SortableContext>
        
        {completedTasks.length > 0 && uncompletedTasks.length > 0 && (
          <div className="relative py-2">
            <Separator />
            <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 whitespace-nowrap bg-background px-2 text-xs text-muted-foreground">
              <span>Completed</span>
              <span className='text-muted-foreground/80'>(items are deleted after 24 hours)</span>
            </div>
          </div>
        )}

        {completedTasks.length > 0 && uncompletedTasks.length === 0 && (
           <div className="py-16 text-center text-muted-foreground">
              <p>All tasks completed!</p>
           </div>
        )}
        
        {/* Completed tasks are not sortable for now */}
        {completedTasks.map((task) => (
          <TaskItem key={task.id} task={task} tasks={tasks} />
        ))}
      </div>
    </DndContext>
  );
}

// Made by Gebin George. Check out my other work on gebin.net
