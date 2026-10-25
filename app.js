const STORAGE_KEY = "todos";
const THEME_KEY = "theme";

const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const count = document.getElementById("todo-count");
const clearDone = document.getElementById("clear-done");
const filterButtons = document.querySelectorAll(".filters button");
const themeToggle = document.getElementById("theme-toggle");

let todos = load(STORAGE_KEY, []);
let filter = "all";

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // Depolama kullanılamıyorsa uygulama yine de çalışır.
  }
}

function render() {
  const visible = todos.filter((t) =>
    filter === "active" ? !t.done : filter === "done" ? t.done : true
  );

  list.innerHTML = "";

  if (visible.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "Burada görev yok.";
    list.appendChild(empty);
  }

  for (const todo of visible) {
    const li = document.createElement("li");
    li.className = "todo-item" + (todo.done ? " done" : "");
    li.dataset.id = todo.id;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.done;
    checkbox.setAttribute("aria-label", "Tamamlandı olarak işaretle");

    const text = document.createElement("span");
    text.className = "text";
    text.textContent = todo.text;

    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "action edit";
    edit.textContent = "✎";
    edit.setAttribute("aria-label", "Görevi düzenle");

    const del = document.createElement("button");
    del.type = "button";
    del.className = "action delete";
    del.textContent = "✕";
    del.setAttribute("aria-label", "Görevi sil");

    li.append(checkbox, text, edit, del);
    list.appendChild(li);
  }

  const remaining = todos.filter((t) => !t.done).length;
  count.textContent = `${remaining} görev kaldı`;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  todos.push({ id: Date.now().toString(36), text, done: false });
  input.value = "";
  save();
  render();
});

list.addEventListener("click", (e) => {
  const item = e.target.closest(".todo-item");
  if (!item) return;
  const id = item.dataset.id;

  if (e.target.matches(".edit")) {
    startEdit(item);
    return;
  } else if (e.target.matches(".delete")) {
    todos = todos.filter((t) => t.id !== id);
  } else if (e.target.matches("input[type='checkbox']")) {
    const todo = todos.find((t) => t.id === id);
    todo.done = e.target.checked;
  } else {
    return;
  }
  save();
  render();
});

list.addEventListener("dblclick", (e) => {
  if (!e.target.matches(".text")) return;
  startEdit(e.target.closest(".todo-item"));
});

function startEdit(item) {
  const todo = todos.find((t) => t.id === item.dataset.id);
  const text = item.querySelector(".text");
  if (!todo || !text) return;

  const field = document.createElement("input");
  field.type = "text";
  field.className = "edit-input";
  field.value = todo.text;
  field.maxLength = 200;
  field.setAttribute("aria-label", "Görev metni");

  item.classList.add("editing");
  text.replaceWith(field);
  field.focus();
  field.select();

  let finished = false;
  const finish = (commit) => {
    if (finished) return;
    finished = true;
    const value = field.value.trim();
    // Boş metin kaydedilmez; görev eski hâline döner.
    if (commit && value && value !== todo.text) {
      todo.text = value;
      save();
    }
    render();
  };

  field.addEventListener("keydown", (e) => {
    if (e.key === "Enter") finish(true);
    else if (e.key === "Escape") finish(false);
  });
  field.addEventListener("blur", () => finish(true));
}

clearDone.addEventListener("click", () => {
  todos = todos.filter((t) => !t.done);
  save();
  render();
});

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filter = btn.dataset.filter;
    filterButtons.forEach((b) => b.classList.toggle("active", b === btn));
    render();
  });
});

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

applyTheme(
  load(THEME_KEY, null) ??
    (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
);

themeToggle.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next);
  try {
    localStorage.setItem(THEME_KEY, JSON.stringify(next));
  } catch {}
});

render();
