const CLASSES_KEY = "classes";
const TASKS_KEY = "tasks";


// ===== Add and remove meeting times =====

const meetingsBox = document.getElementById("meetings");

document.getElementById("add-meeting").addEventListener("click", () => {
    const copy = meetingsBox.querySelector(".meeting").cloneNode(true);

    // Clear anything copied from the first meeting box
    copy.querySelectorAll("input[type='time']").forEach(input => input.value = "");
    copy.querySelectorAll("input[type='checkbox']").forEach(box => box.checked = false);
    copy.querySelector(".meeting-type").selectedIndex = 0;

    // Extra meeting boxes get a Remove button
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "btn btn-secondary remove-meeting";
    removeButton.textContent = "Remove";
    copy.appendChild(removeButton);

    meetingsBox.appendChild(copy);
});

meetingsBox.addEventListener("click", (event) => {
    if (event.target.classList.contains("remove-meeting")) {
        event.target.closest(".meeting").remove();
    }
});


// ===== Show the "Type name" box only when "Other" is picked =====

const taskType = document.getElementById("task-type");
const otherField = document.getElementById("task-other-field");
const otherInput = document.getElementById("task-other-type");

function updateOtherField() {
    const isOther = taskType.value === "Other";
    otherField.hidden = !isOther;
    otherInput.required = isOther;
}

taskType.addEventListener("change", updateOtherField);


// ===== Fill the task form's Class dropdown with saved classes =====

function fillClassDropdown() {
    const select = document.getElementById("task-class");
    select.innerHTML = '<option value="">None</option>';

    for (const savedClass of loadData(CLASSES_KEY)) {
        const option = document.createElement("option");
        option.value = savedClass.id;
        option.textContent = savedClass.code;
        select.appendChild(option);
    }
}


// ===== Save a class =====

const classForm = document.getElementById("class-form");

classForm.addEventListener("submit", (event) => {
    event.preventDefault();   // Stop the page from reloading

    const meetings = [];
    for (const box of meetingsBox.querySelectorAll(".meeting")) {
        const days = [...box.querySelectorAll("input[type='checkbox']:checked")].map(b => b.value);
        const start = box.querySelector(".meeting-start").value;
        const end = box.querySelector(".meeting-end").value;

        if (days.length === 0) {
            showToast("Pick at least one day for each meeting time.", "error");
            return;
        }
        if (end <= start) {
            showToast("Each meeting must end after it starts.", "error");
            return;
        }

        meetings.push({
            type: box.querySelector(".meeting-type").value,
            days: days,
            start: start,
            end: end,
        });
    }

    const newClass = {
        id: makeId(),
        code: document.getElementById("class-code").value.trim(),
        title: document.getElementById("class-title").value.trim(),
        instructor: document.getElementById("class-instructor").value.trim(),
        location: document.getElementById("class-location").value.trim(),
        color: document.getElementById("class-color").value,
        meetings: meetings,
    };

    const classes = loadData(CLASSES_KEY);
    classes.push(newClass);
    saveData(CLASSES_KEY, classes);

    // Clear the form and remove any extra meeting boxes
    classForm.reset();
    meetingsBox.querySelectorAll(".meeting").forEach((box, index) => {
        if (index > 0) box.remove();
    });

    fillClassDropdown();
    showToast("Saved!");
});


// ===== Save a task =====

const taskForm = document.getElementById("task-form");

taskForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const hours = Number(document.getElementById("task-hours").value) || 0;
    const minutes = Number(document.getElementById("task-minutes").value) || 0;
    const estMinutes = hours * 60 + minutes;

    const newTask = {
        id: makeId(),
        name: document.getElementById("task-name").value.trim(),
        type: taskType.value,
        customType: taskType.value === "Other" ? otherInput.value.trim() : "",
        classId: document.getElementById("task-class").value,
        dueDate: document.getElementById("task-date").value,
        dueTime: document.getElementById("task-time").value,
        estMinutes: estMinutes > 0 ? estMinutes : null,
        priority: document.getElementById("task-priority").value,
        notes: document.getElementById("task-notes").value.trim(),
        completed: false,
        completedAt: null,
    };

    const tasks = loadData(TASKS_KEY);
    tasks.push(newTask);
    saveData(TASKS_KEY, tasks);

    taskForm.reset();
    updateOtherField();
    showToast("Saved!");
});


// ===== When the page opens =====

fillClassDropdown();