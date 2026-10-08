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
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add("hide"), 2000);
    setTimeout(() => toast.remove(), 2300);
}