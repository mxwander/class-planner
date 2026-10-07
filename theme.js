// The three theme choices, in the order the button cycles through them
const THEMES = ["light", "dark", "auto"];
const ICONS = { light: "☀", dark: "☾", auto: "◐" };
const LABELS = { light: "Light", dark: "Dark", auto: "Auto" };


// Read the saved choice from the browser. Default to "auto" if there isn't one.
function getSavedTheme() {
    const saved = localStorage.getItem("theme");
    return THEMES.includes(saved) ? saved : "auto";
}


// Tell the CSS which theme to use
function applyTheme(theme) {
    if (theme === "auto") {
        document.documentElement.removeAttribute("data-theme");
    } else {
        document.documentElement.setAttribute("data-theme", theme);
    }
}


// Update the button's icon and hover text
function updateButton(theme) {
    const button = document.getElementById("theme-toggle");
    button.textContent = ICONS[theme];
    button.title = `Theme: ${LABELS[theme]}`;
    button.setAttribute("aria-label", `Theme: ${LABELS[theme]}`);
}


// 1. Apply the saved theme immediately, before the page appears
applyTheme(getSavedTheme());

// 2. Once the page has loaded, set up the button
document.addEventListener("DOMContentLoaded", () => {
    updateButton(getSavedTheme());

    document.getElementById("theme-toggle").addEventListener("click", () => {
        const current = getSavedTheme();
        const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
        localStorage.setItem("theme", next);
        applyTheme(next);
        updateButton(next);
    });
});