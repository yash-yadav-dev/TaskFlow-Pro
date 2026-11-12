TASKFLOW PRO — SETUP GUIDE
==========================

WHAT'S NEW
- Premium dashboard and redesigned hero section
- Overview dashboard with task statistics and completion ring
- Categories: Personal, Academic, Work, Projects, Other
- Priority levels: Low, Medium, High, Urgent
- Due dates and overdue indicators
- Task status: To do, In progress, Completed
- Search, filter and sorting
- Kanban board with drag-and-drop and status selector
- Monthly calendar with due-date markers
- Analytics by status and category
- Dark mode
- Local file persistence (no MySQL, no external Java libraries)
- Existing tasks from the original TaskFlow are migrated automatically

REQUIREMENTS
- JDK 17 or newer
- Windows

HOW TO RUN
1. Extract the complete ZIP file.
2. Open the TaskFlow_Pro folder.
3. Double-click run.bat.
   OR open PowerShell in this folder and run:
   .\run.bat
4. Open http://localhost:8080 in your browser.
5. Keep the black terminal window open while using the application.
6. Press Ctrl+C in the terminal to stop the server.

DATA
Tasks are stored locally in data/tasks.csv.
The original four-column task records are upgraded automatically on first launch.
Do not delete this file if you want to keep your tasks.

TROUBLESHOOTING
- If the browser cannot connect, make sure run.bat is still running.
- If Java is not recognized, install JDK 17 and reopen the terminal.
- If port 8080 is already in use, close the other app using it.
- Open the extracted project folder itself, not an individual source folder.

TECHNOLOGY
Frontend: HTML, CSS, JavaScript
Backend: Java 17 HttpServer
Storage: Local text file with Base64-encoded fields
No MySQL. No Maven. No external Java dependencies.
