// ===== Shared helpers for saving and loading app data =====

// Read a list (like "classes" or "tasks") from the browser. Empty list if none saved yet.
function loadData(key) {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
}

// Save a list to the browser
function saveData(key, items) {
    localStorage.setItem(key, JSON.stringify(items));
}

// Make a unique ID so each class and task can be found later for editing or deleting
function makeId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Show a short pop-up message at the top of the screen
function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    // If a pop-up window is open, show the message inside it so it isn't hidden behind it
    const host = document.querySelector("dialog[open]") || document.body;
    host.appendChild(toast);

    setTimeout(() => toast.classList.add("hide"), 2000);
    setTimeout(() => toast.remove(), 2300);
}


// ===== Task helpers =====

// The exact moment a task is due, as a JavaScript Date
function taskDueDate(task) {
    return new Date(`${task.dueDate}T${task.dueTime}`);
}

// A due date written out for people, like "Thu, Oct 9 at 11:59 PM"
function formatDue(task) {
    const due = taskDueDate(task);
    const day = due.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    const time = due.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return `${day} at ${time}`;
}

// The task's type, using the typed-in name for "Other"
function taskTypeLabel(task) {
    return task.type === "Other" ? task.customType : task.type;
}

// True once a completed task should drop off the checklist and Saved Tasks list:
// - completed on time: after its due date and time passes
// - completed late: at midnight at the end of the day it was completed
function isTaskFinished(task) {
    if (!task.completed) {
        return false;
    }
    const due = taskDueDate(task);
    const completedAt = new Date(task.completedAt);

    let dropOff = due;
    if (completedAt > due) {
        dropOff = new Date(completedAt);
        dropOff.setHours(24, 0, 0, 0);
    }
    return new Date() >= dropOff;
}


// Where a task stands right now:
// "upcoming" (not done, not due yet), "overdue" (not done, past due),
// "done" (completed on time), or "late" (completed after it was due)
function taskStatus(task, now = new Date()) {
    const due = taskDueDate(task);
    if (!task.completed) {
        return due < now ? "overdue" : "upcoming";
    }
    return new Date(task.completedAt) > due ? "late" : "done";
}

// Check off a task (done = true) or uncheck it (done = false)
function setTaskCompleted(id, done) {
    const tasks = loadData("tasks");
    const task = tasks.find(t => t.id === id);
    task.completed = done;
    task.completedAt = done ? new Date().toISOString() : null;
    saveData("tasks", tasks);
}

// 90 -> "1 hr 30 min", 120 -> "2 hr", 45 -> "45 min"
function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const parts = [];
    if (hours > 0) parts.push(`${hours} hr`);
    if (mins > 0) parts.push(`${mins} min`);
    return parts.join(" ");
}


// ===== Page-building helpers =====

// Create an element with an optional class and text: el("span", "dot")
function el(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

// plural(1, "task") -> "1 task", plural(3, "class", "classes") -> "3 classes"
function plural(count, word, pluralWord = word + "s") {
    return `${count} ${count === 1 ? word : pluralWord}`;
}