'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, orderBy, writeBatch, doc, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import TaskItem from './task-item';
import type { Task } from '@/types';
import BoxLoader from '@/components/ui/box-loader';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { AlertCircle, ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
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
  const [showCompleted, setShowCompleted] = React.useState(false);
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
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    const batch = writeBatch(db);
    let dirty = false;

    tasks.forEach(task => {
      if (task.completed && task.completedAt) {
        const completedDate = (task.completedAt as Timestamp).toDate();
        if (completedDate < fiveDaysAgo) {
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
      <div className="flex items-center justify-center py-20">
        <BoxLoader />
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
      <div className="space-y-0 pb-0">
        <div className="task-list-container rounded-xl bg-card p-2 divide-y divide-white/[0.06]">
          <SortableContext items={uncompletedTasks} strategy={verticalListSortingStrategy}>
            {uncompletedTasks.map((task) => (
              <TaskItem key={task.id} task={task} tasks={tasks} />
            ))}
          </SortableContext>
        </div>

        {completedTasks.length > 0 && (
          <div className="pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCompleted(!showCompleted)}
              className="h-8 w-full justify-start gap-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-transparent px-1 mb-2"
            >
              {showCompleted ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              <span>Completed ({completedTasks.length})</span>
            </Button>

            {showCompleted && (
              <div className="task-list-container mt-2 rounded-xl bg-card/30 p-2 opacity-60 divide-y divide-white/[0.04]">
                <div className="px-4 py-2 text-[10px] text-muted-foreground/50 text-center uppercase tracking-wider">
                  Auto-deleted after 5 days
                </div>
                {completedTasks.map((task) => (
                  <TaskItem key={task.id} task={task} tasks={tasks} />
                ))}
              </div>
            )}
          </div>
        )}

        {tasks.length > 0 && (
          <div className="mt-8 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground/40 select-none">
            <Sparkles className="h-3 w-3" />
            <span>Priority adjusted automatically</span>
          </div>
        )}

        {completedTasks.length > 0 && uncompletedTasks.length === 0 && !showCompleted && (
          <div className="py-8 text-center text-muted-foreground/50 text-sm">
            <p>All clear!</p>
          </div>
        )}
      </div>
    </DndContext>
  );
}

// Made by Gebin George. Check out my other work on gebin.net

