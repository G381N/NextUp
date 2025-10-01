# **App Name**: NextUp

## Core Features:

- User Authentication: Enable users to create accounts and log in using Firebase Authentication to access their personalized task lists.
- Task and Folder Management: Allow users to create, edit, and delete tasks and folders.  Enable categorizing tasks into folders.
- Image-to-Task: Import tasks by extracting text from images using OCR technology, automatically creating editable tasks.
- Automated Task Prioritization: Automatically reorder tasks based on CPU scheduling algorithms, suggesting the most efficient 'next task' using AI estimation for task duration/complexity as a tool.
- Minimalistic UI: Provide a clean, intuitive user interface with both light and dark modes. Ensure a clutter-free layout.
- Data Persistence: Persistently store tasks and folders for each user using Firebase Firestore.
- Collapsible Sidebar: Implement a thin, collapsible sidebar for navigation. Allow creation of folders, tasks, and import of tasks via icons in the sidebar.

## Style Guidelines:

- Background: Near-white (#FAFAFA) in light mode, pure black (#000000) in dark mode. This will give the app the modern minimalist feel from Apple Reminders or X/Twitter as requested by the user. Both colors have low saturation and the brightness is the one changing from the dark to the light mode.
- Primary: Use dark grey (#333333) in light mode, pure white (#FFFFFF) in dark mode. Primary has similar saturation compared to the background, with both options not too bright, to have a visual balance on the selected white backgrounds, while assuring the correct readability.
- Accent: Use a light grey (#AAAAAA) to create highlights without clashing with the clean look.
- Body and headline font: 'Inter', a grotesque-style sans-serif, to be used for all text, as it offers a neutral and machined look while being readable both as headline and for long amounts of text. No code will be displayed on the app.
- Use simple, monochrome icons (light grey in light mode, darker grey in dark mode) for folder and task categories.
- Maintain a clean, clutter-free layout, inspired by Apple's Reminders app. Use a thin, collapsible sidebar similar to Twitter/X.
- Implement smooth, subtle animations when reordering tasks and loading new content, to add a little dynamics to the overall look.