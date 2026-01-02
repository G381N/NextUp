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
import { useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Task, Folder } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePathname } from 'next/navigation';
import { addDoc, collection, doc, serverTimestamp, updateDoc, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { CalendarIcon, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, set, getHours, getMinutes } from 'date-fns';
import { Calendar } from '../ui/calendar';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';

const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required.'),
  deadline: z.date().optional(),
  folderId: z.string().min(1, 'Please select a folder.'),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskFormProps {
  userId: string;
  folders: Folder[];
  task?: Task;
  onSuccess?: () => void;
}

function DateTimePicker({ field }: { field: any }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(field.value);
  const [view, setView] = React.useState<'date' | 'time'>('date');
  const dialogContentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setDate(field.value);
  }, [field.value]);

  React.useEffect(() => {
    if (!isOpen) {
      setTimeout(() => setView('date'), 150);
    }
  }, [isOpen]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      setDate(undefined);
      return;
    }
    const now = new Date();
    const hours = date instanceof Date ? getHours(date) : getHours(now);
    const minutes = date instanceof Date ? getMinutes(date) : getMinutes(now);

    const newDateTime = set(selectedDate, { hours, minutes });
    setDate(newDateTime);
    setView('time');
  };

  const handleTimeChange = ({ hour, minute, period }: { hour: number, minute: number, period: 'am' | 'pm' }) => {
    if (!date) return;
    let hours = hour;
    if (period === 'pm' && hours < 12) {
      hours += 12;
    }
    if (period === 'am' && hours === 12) { // Midnight case
      hours = 0;
    }
    const newDateTime = set(date, { hours, minutes: minute });
    setDate(newDateTime);
  };

  const handleSave = () => {
    field.onChange(date);
    setIsOpen(false);
  };

  const currentHour = date ? getHours(date) : new Date().getHours();
  const currentMinute = date ? getMinutes(date) : new Date().getMinutes();
  const currentPeriod = currentHour >= 12 ? 'pm' : 'am';
  let displayHour = currentHour % 12;
  if (displayHour === 0) displayHour = 12; // Noon/midnight case

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start pl-3 text-left font-normal",
            !field.value && "text-muted-foreground"
          )}
        >
          {field.value ? (
            format(field.value, "PP, p")
          ) : (
            <span>Pick a date and time</span>
          )}
          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </DialogTrigger>
      <DialogContent ref={dialogContentRef} className="w-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {view === 'date' ? 'Select Deadline Date' : 'Select Deadline Time'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Select the date and time for the task deadine.
          </DialogDescription>
        </DialogHeader>

        {view === 'date' && (
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            disabled={(d) =>
              d < new Date(new Date().setHours(0, 0, 0, 0))
            }
            initialFocus
          />
        )}

        {view === 'time' && date && (
          <div className="flex flex-col items-center gap-4 p-4">
            <p className="text-center text-sm text-muted-foreground">
              Selected date: {format(date, "PPP")}
            </p>
            <div className="flex items-center gap-2">
              <Select
                value={String(displayHour)}
                onValueChange={(value) => handleTimeChange({ hour: Number(value), minute: currentMinute, period: currentPeriod as 'am' | 'pm' })}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-56" container={dialogContentRef.current}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(hour => (
                    <SelectItem key={hour} value={String(hour)}>{String(hour).padStart(2, '0')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>:</span>
              <Select
                value={String(currentMinute).padStart(2, '0')}
                onValueChange={(value) => handleTimeChange({ hour: displayHour, minute: Number(value), period: currentPeriod as 'am' | 'pm' })}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-56" container={dialogContentRef.current}>
                  {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(minute => (
                    <SelectItem key={minute} value={minute}>{minute}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={currentPeriod}
                onValueChange={(value) => handleTimeChange({ hour: displayHour, minute: currentMinute, period: value as 'am' | 'pm' })}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" container={dialogContentRef.current}>
                  <SelectItem value="am">AM</SelectItem>
                  <SelectItem value="pm">PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter className="justify-between sm:justify-between">
          {view === 'time' ? (
            <Button variant="ghost" onClick={() => setView('date')}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          ) : <div />}
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TaskForm({ userId, folders, task, onSuccess }: TaskFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const { toast } = useToast();
  const pathname = usePathname();
  const currentFolderId = pathname.split('/folders/')[1];

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || '',
      deadline: task?.deadline ? task.deadline.toDate() : undefined,
      folderId: task?.folderId || currentFolderId || folders[0]?.id || '',
    },
  });

  const onSubmit = (values: TaskFormValues) => {
    if (!userId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to create or update a task.'
      });
      return;
    }
    startTransition(async () => {
      try {
        const data: any = {
          title: values.title,
          folderId: values.folderId,
          deadline: values.deadline ? Timestamp.fromDate(values.deadline) : null,
        };

        if (task) {
          const taskRef = doc(db, 'users', userId, 'tasks', task.id);
          await updateDoc(taskRef, data);
          toast({ title: 'Success', description: 'Task updated successfully.' });
        } else {
          await addDoc(collection(db, 'users', userId, 'tasks'), {
            ...data,
            userId,
            completed: false,
            order: Date.now(),
            createdAt: serverTimestamp(),
          });
          toast({ title: 'Success', description: 'Task created successfully.' });
        }
        form.reset();
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
    if (!task || !userId) return;

    startDeleteTransition(async () => {
      try {
        const taskRef = doc(db, 'users', userId, 'tasks', task.id);
        await deleteDoc(taskRef);
        toast({ title: 'Task deleted', description: `The task "${task.title}" has been removed.` });
        onSuccess?.();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({ variant: 'destructive', title: 'Error deleting task', description: message });
      }
    });
  };

  if (!folders.length) {
    return (
      <div className="py-6 text-center text-muted-foreground">
        <p>Please create a folder first before adding a task.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col justify-between space-y-6 py-6">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Finalize project report" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Deadline (Optional)</FormLabel>
                  <FormControl>
                    <DateTimePicker field={field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="folderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Folder</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a folder" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {folders.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          {folder.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? 'Saving...' : task ? 'Save Changes' : 'Create Task'}
            </Button>

            {task && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">Delete Task</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the task: <strong>{task.title}</strong>. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                      {isDeleting ? 'Deleting...' : 'Yes, delete task'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}

// Made by Gebin George. Check out my other work on gebin.net
