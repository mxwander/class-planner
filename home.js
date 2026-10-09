const TODO_DAYS = 10;


// ===== To-Do checklist =====

function makeTodoItem(task, classById, now) {
    const status = taskStatus(task, now);
    const savedClass = classById.get(task.classId);

    const row = el("li", `todo-item status-${status}`);
    row.dataset.id = task.id;

    const check = el("input", "todo-check");
    check.type = "checkbox";
    check.checked = task.completed;
    check.setAttribute("aria-label", `Mark "${task.name}" complete`);

    const dot = el("span", "dot");
    if (savedClass) {
        dot.style.background = savedClass.color;
    } else {
        dot.style.visibility = "hidden";   // keeps rows lined up
    }

    // Line 1: name · class
    const info = el("div", "item-info");
    const title = el("span", "item-title", task.name);
    if (savedClass) {
        title.append(el("span", "todo-class", ` · ${savedClass.code}`));
    }

    // Line 2: type · due date · estimated time
    const meta = [taskTypeLabel(task), `Due ${formatDue(task)}`];
    if (task.estMinutes) meta.push(`Est. ${formatDuration(task.estMinutes)}`);
    info.append(title, el("span", "item-sub mono", meta.join(" · ")));

    row.append(check, dot, info);

    if (task.priority) {
        row.append(el("span", `priority priority-${task.priority.toLowerCase()}`, task.priority));
    }
    return row;
}

function renderTodo() {
    const box = document.getElementById("todo-list");
    box.innerHTML = "";

    const now = new Date();
    const windowEnd = new Date(now);
    windowEnd.setDate(windowEnd.getDate() + TODO_DAYS);
    windowEnd.setHours(23, 59, 59, 999);

    const classById = new Map(loadData("classes").map(c => [c.id, c]));

    // Tasks that belong on the checklist right now, soonest due first
    const tasks = loadData("tasks")
        .filter(task => !isTaskFinished(task))
        .filter(task => taskStatus(task, now) === "overdue" || taskDueDate(task) <= windowEnd)
        .sort((a, b) => taskDueDate(a) - taskDueDate(b));

    if (tasks.length === 0) {
        box.append(el("p", null, `Nothing due in the next ${TODO_DAYS} days.`));
        return;
    }

    const groups = [
        ["Overdue", ["overdue"]],
        ["Upcoming", ["upcoming"]],
        ["Completed", ["done", "late"]],
    ];

    for (const [label, statuses] of groups) {
        const groupTasks = tasks.filter(task => statuses.includes(taskStatus(task, now)));
        if (groupTasks.length === 0) continue;

        box.append(el("h3", null, label));
        const list = el("ul", "item-list");
        for (const task of groupTasks) {
            list.append(makeTodoItem(task, classById, now));
        }
        box.append(list);
    }
}

// Checkbox click = check off / uncheck. Click anywhere else on a row = details pop-up.
document.getElementById("todo-list").addEventListener("click", (event) => {
    const row = event.target.closest(".todo-item");
    if (!row) return;

    if (event.target.classList.contains("todo-check")) {
        setTaskCompleted(row.dataset.id, event.target.checked);
        renderTodo();
    } else {
        openTaskDetails(row.dataset.id, renderTodo);
    }
});


// ===== When the page opens =====

renderTodo();

// Re-check every minute so tasks turn red, or drop off, without a refresh
setInterval(renderTodo, 60 * 1000);