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