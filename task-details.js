// ===== Task details pop-up (used by the Home page, and the Calendar later) =====

const STATUS_LABELS = {
    upcoming: "Not completed",
    overdue: "Overdue",
    done: "Completed",
    late: "Completed late",
};

// Open the pop-up for one task. onChange runs after it's marked complete or not complete.
function openTaskDetails(taskId, onChange) {
    const dialog = document.getElementById("details-dialog");
    const task = loadData("tasks").find(t => t.id === taskId);
    if (!task) return;

    const savedClass = loadData("classes").find(c => c.id === task.classId);
    const status = taskStatus(task);

    // Title and class
    const title = el("h2", null, task.name);

    const classLine = el("div", "details-class");
    if (savedClass) {
        const dot = el("span", "dot");
        dot.style.background = savedClass.color;
        classLine.append(dot, savedClass.title ? `${savedClass.code} · ${savedClass.title}` : savedClass.code);
    } else {
        classLine.append("No class");
    }

    // Detail rows (only the ones that have a value)
    const rows = [
        ["Status", STATUS_LABELS[status]],
        ["Type", taskTypeLabel(task)],
        ["Due", formatDue(task)],
        ["Est. time", task.estMinutes ? formatDuration(task.estMinutes) : ""],
        ["Priority", task.priority],
        ["Notes", task.notes],
    ];

    const details = el("dl", "details-list");
    for (const [label, value] of rows) {
        if (!value) continue;
        const dd = el("dd", label === "Notes" ? "details-notes" : null, value);
        if (label === "Status") dd.classList.add(`status-text-${status}`);
        details.append(el("dt", null, label), dd);
    }

    // Buttons: Edit, Close, Mark complete / Mark not complete
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    const editLink = el("a", "btn btn-secondary", "Edit");
    editLink.href = `edit.html?editTask=${encodeURIComponent(task.id)}&from=${currentPage}`;

    const closeButton = el("button", "btn btn-secondary", "Close");
    closeButton.type = "button";
    closeButton.addEventListener("click", () => dialog.close());

    const toggleButton = el("button", "btn btn-primary", task.completed ? "Mark not complete" : "Mark complete");
    toggleButton.type = "button";
    toggleButton.addEventListener("click", () => {
        setTaskCompleted(task.id, !task.completed);
        dialog.close();
        if (onChange) onChange();
        showToast(task.completed ? "Marked not complete." : "Marked complete!");
    });

    const actions = el("div", "dialog-actions");
    actions.append(editLink, closeButton, toggleButton);

    dialog.replaceChildren(title, classLine, details, actions);
    dialog.showModal();
}