const CLASSES_KEY = "classes";
const TASKS_KEY = "tasks";

const classForm = document.getElementById("class-form");
const taskForm = document.getElementById("task-form");
const editDialog = document.getElementById("edit-dialog");
const confirmDialog = document.getElementById("confirm-dialog");

// Sort classes alphabetically by course code
const byCode = (a, b) => a.code.localeCompare(b.code);


// ===== Small helper for building page elements =====

function el(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}


// ===== Meeting time boxes (work in any class form) =====

function addMeetingBox(form) {
    const meetingsBox = form.querySelector(".meetings");
    const copy = meetingsBox.querySelector(".meeting").cloneNode(true);

    // Clear anything copied from the first meeting box
    copy.querySelectorAll("input[type='time']").forEach(input => input.value = "");
    copy.querySelectorAll("input[type='checkbox']").forEach(box => box.checked = false);
    copy.querySelector(".meeting-type").selectedIndex = 0;

    const removeButton = el("button", "btn btn-secondary remove-meeting", "Remove");
    removeButton.type = "button";
    copy.appendChild(removeButton);

    meetingsBox.appendChild(copy);
    return copy;
}

function removeExtraMeetings(form) {
    form.querySelectorAll(".meeting").forEach((box, index) => {
        if (index > 0) box.remove();
    });
}

function setupClassForm(form) {
    form.querySelector(".add-meeting").addEventListener("click", () => addMeetingBox(form));

    form.querySelector(".meetings").addEventListener("click", (event) => {
        if (event.target.classList.contains("remove-meeting")) {
            event.target.closest(".meeting").remove();
        }
    });
}


// ===== "Other" task type box (works in any task form) =====

function updateOtherField(form) {
    const isOther = form.elements.type.value === "Other";
    form.querySelector(".other-field").hidden = !isOther;
    form.elements.otherType.required = isOther;
}

function setupTaskForm(form) {
    form.elements.type.addEventListener("change", () => updateOtherField(form));
}


// ===== Read a form into an object, or fill a form from an object =====

function readClassForm(form) {
    const meetings = [];
    for (const box of form.querySelectorAll(".meeting")) {
        const days = [...box.querySelectorAll("input[type='checkbox']:checked")].map(b => b.value);
        const start = box.querySelector(".meeting-start").value;
        const end = box.querySelector(".meeting-end").value;

        if (days.length === 0) {
            showToast("Pick at least one day for each meeting time.", "error");
            return null;
        }
        if (end <= start) {
            showToast("Each meeting must end after it starts.", "error");
            return null;
        }

        meetings.push({ type: box.querySelector(".meeting-type").value, days, start, end });
    }

    const f = form.elements;
    return {
        code: f.code.value.trim(),
        title: f.title.value.trim(),
        instructor: f.instructor.value.trim(),
        location: f.location.value.trim(),
        color: f.color.value,
        meetings: meetings,
    };
}

function fillClassForm(form, savedClass) {
    const f = form.elements;
    f.code.value = savedClass.code;
    f.title.value = savedClass.title;
    f.instructor.value = savedClass.instructor;
    f.location.value = savedClass.location;
    f.color.value = savedClass.color;

    removeExtraMeetings(form);
    savedClass.meetings.forEach((meeting, index) => {
        const box = index === 0 ? form.querySelector(".meeting") : addMeetingBox(form);
        box.querySelector(".meeting-type").value = meeting.type;
        box.querySelector(".meeting-start").value = meeting.start;
        box.querySelector(".meeting-end").value = meeting.end;
        box.querySelectorAll("input[type='checkbox']").forEach(b => {
            b.checked = meeting.days.includes(b.value);
        });
    });
}

function readTaskForm(form) {
    const f = form.elements;
    const estMinutes = (Number(f.hours.value) || 0) * 60 + (Number(f.minutes.value) || 0);

    return {
        name: f.name.value.trim(),
        type: f.type.value,
        customType: f.type.value === "Other" ? f.otherType.value.trim() : "",
        classId: f.classId.value,
        dueDate: f.dueDate.value,
        dueTime: f.dueTime.value,
        estMinutes: estMinutes > 0 ? estMinutes : null,
        priority: f.priority.value,
        notes: f.notes.value.trim(),
    };
}

function fillTaskForm(form, task) {
    const f = form.elements;
    f.name.value = task.name;
    f.type.value = task.type;
    f.otherType.value = task.customType;
    f.classId.value = task.classId;
    f.dueDate.value = task.dueDate;
    f.dueTime.value = task.dueTime;
    f.hours.value = task.estMinutes ? Math.floor(task.estMinutes / 60) : "";
    f.minutes.value = task.estMinutes ? task.estMinutes % 60 : "";
    f.priority.value = task.priority;
    f.notes.value = task.notes;
    updateOtherField(form);
}


// ===== Show the saved lists =====

function makeActions(kind, id) {
    const actions = el("div", "item-actions");
    for (const action of ["edit", "delete"]) {
        const button = el("button", "btn-small", action === "edit" ? "Edit" : "Delete");
        button.type = "button";
        button.dataset.action = action;
        button.dataset.kind = kind;
        button.dataset.id = id;
        actions.append(button);
    }
    return actions;
}

function renderClasses() {
    const box = document.getElementById("class-list");
    box.innerHTML = "";

    const classes = loadData(CLASSES_KEY).sort(byCode);
    if (classes.length === 0) {
        box.append(el("p", null, "No classes saved yet."));
        return;
    }

    const list = el("ul", "item-list");
    for (const savedClass of classes) {
        const row = el("li", "item");

        const dot = el("span", "dot");
        dot.style.background = savedClass.color;

        const info = el("div", "item-info");
        info.append(el("span", "item-title", savedClass.code));
        if (savedClass.title) {
            info.append(el("span", "item-sub", savedClass.title));
        }

        row.append(dot, info, makeActions("class", savedClass.id));
        list.append(row);
    }
    box.append(list);
}

function renderTasks() {
    const box = document.getElementById("task-list");
    box.innerHTML = "";

    const classes = loadData(CLASSES_KEY).sort(byCode);
    const knownIds = new Set(classes.map(c => c.id));
    const tasks = loadData(TASKS_KEY)
        .filter(task => !isTaskFinished(task))
        .sort((a, b) => taskDueDate(a) - taskDueDate(b));

    if (tasks.length === 0) {
        box.append(el("p", null, "No tasks saved yet."));
        return;
    }

    // One group per class (alphabetical), then "No class" at the end
    const groups = classes.map(c => ({ id: c.id, name: c.code, color: c.color }));
    groups.push({ id: "", name: "No class", color: null });

    for (const group of groups) {
        const groupTasks = tasks.filter(task => {
            const classId = knownIds.has(task.classId) ? task.classId : "";
            return classId === group.id;
        });
        if (groupTasks.length === 0) continue;

        const header = el("h3", "group-title");
        if (group.color) {
            const dot = el("span", "dot");
            dot.style.background = group.color;
            header.append(dot);
        }
        header.append(group.name);
        box.append(header);

        const list = el("ul", "item-list");
        for (const task of groupTasks) {
            const row = el("li", "item");
            const info = el("div", "item-info");
            info.append(el("span", "item-title", task.name));
            info.append(el("span", "item-sub mono", `${taskTypeLabel(task)} · Due ${formatDue(task)}`));
            row.append(info, makeActions("task", task.id));
            list.append(row);
        }
        box.append(list);
    }
}

function fillClassDropdown() {
    const select = taskForm.elements.classId;
    select.innerHTML = '<option value="">None</option>';
    for (const savedClass of loadData(CLASSES_KEY).sort(byCode)) {
        select.append(new Option(savedClass.code, savedClass.id));
    }
}

function refreshAll() {
    renderClasses();
    renderTasks();
    fillClassDropdown();
}


// ===== "Are you sure?" pop-up =====

let confirmAction = null;

function askConfirm(message, action) {
    document.getElementById("confirm-message").textContent = message;
    confirmAction = action;
    confirmDialog.showModal();
}

document.getElementById("confirm-no").addEventListener("click", () => confirmDialog.close());

document.getElementById("confirm-yes").addEventListener("click", () => {
    confirmDialog.close();
    if (confirmAction) confirmAction();
});


// ===== Edit pop-up =====

function openEditor(kind, id) {
    const isClass = kind === "class";
    const key = isClass ? CLASSES_KEY : TASKS_KEY;
    const item = loadData(key).find(x => x.id === id);

    // Copy the Add form so the editor has the exact same fields
    const form = (isClass ? classForm : taskForm).cloneNode(true);
    form.removeAttribute("id");
    form.reset();

    if (isClass) {
        setupClassForm(form);
        fillClassForm(form, item);
    } else {
        setupTaskForm(form);
        fillTaskForm(form, item);
    }

    // Replace the Save button with Cancel + Update
    const saveButton = form.querySelector("button[type='submit']");
    saveButton.textContent = isClass ? "Update Class" : "Update Task";

    const cancelButton = el("button", "btn btn-secondary", "Cancel");
    cancelButton.type = "button";
    cancelButton.addEventListener("click", () => editDialog.close());

    const actions = el("div", "dialog-actions");
    saveButton.replaceWith(actions);
    actions.append(cancelButton, saveButton);

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const data = isClass ? readClassForm(form) : readTaskForm(form);
        if (!data) return;

        const items = loadData(key);
        const original = items.find(x => x.id === id);
        Object.assign(original, data);
        saveData(key, items);

        editDialog.close();
        refreshAll();
        showToast("Saved!");
    });

    editDialog.replaceChildren(el("h2", null, isClass ? "Edit Class" : "Edit Task"), form);
    editDialog.showModal();
}


// ===== Delete =====

function deleteItem(kind, id) {
    if (kind === "class") {
        const savedClass = loadData(CLASSES_KEY).find(c => c.id === id);
        const linkedCount = loadData(TASKS_KEY).filter(t => t.classId === id).length;

        let message = `Delete ${savedClass.code}?`;
        if (linkedCount > 0) {
            message += ` This will also delete ${linkedCount} linked task${linkedCount === 1 ? "" : "s"}.`;
        }

        askConfirm(message, () => {
            saveData(CLASSES_KEY, loadData(CLASSES_KEY).filter(c => c.id !== id));
            saveData(TASKS_KEY, loadData(TASKS_KEY).filter(t => t.classId !== id));
            refreshAll();
            showToast("Deleted.");
        });
    } else {
        const task = loadData(TASKS_KEY).find(t => t.id === id);

        askConfirm(`Delete "${task.name}"?`, () => {
            saveData(TASKS_KEY, loadData(TASKS_KEY).filter(t => t.id !== id));
            refreshAll();
            showToast("Deleted.");
        });
    }
}


// ===== Edit and Delete buttons in the saved lists =====

document.querySelector(".edit-grid").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const { action, kind, id } = button.dataset;
    if (action === "edit") {
        openEditor(kind, id);
    } else {
        deleteItem(kind, id);
    }
});


// ===== Save new items from the Add forms =====

classForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = readClassForm(classForm);
    if (!data) return;

    const classes = loadData(CLASSES_KEY);
    classes.push({ id: makeId(), ...data });
    saveData(CLASSES_KEY, classes);

    classForm.reset();
    removeExtraMeetings(classForm);
    refreshAll();
    showToast("Saved!");
});

taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = readTaskForm(taskForm);

    const tasks = loadData(TASKS_KEY);
    tasks.push({ id: makeId(), ...data, completed: false, completedAt: null });
    saveData(TASKS_KEY, tasks);

    taskForm.reset();
    updateOtherField(taskForm);
    refreshAll();
    showToast("Saved!");
});


// ===== When the page opens =====

setupClassForm(classForm);
setupTaskForm(taskForm);
refreshAll();