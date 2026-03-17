const STORAGE_KEY = "todo.items.v1";

const todoForm = document.getElementById("todoForm");
const todoInput = document.getElementById("todoInput");
const todoList = document.getElementById("todoList");
const countText = document.getElementById("countText");
const emptyState = document.getElementById("emptyState");
const clearCompletedBtn = document.getElementById("clearCompletedBtn");
const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));

/** @type {{id:string,text:string,done:boolean,createdAt:number}[]} */
let items = loadItems();
/** @type {"all"|"active"|"completed"} */
let filter = "all";

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x) => x && typeof x === "object")
      .map((x) => ({
        id: String(x.id ?? uid()),
        text: String(x.text ?? ""),
        done: Boolean(x.done),
        createdAt: Number.isFinite(x.createdAt) ? x.createdAt : Date.now(),
      }))
      .filter((x) => x.text.trim().length > 0);
  } catch {
    return [];
  }
}

function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function setFilter(next) {
  filter = next;
  for (const btn of filterButtons) {
    const isActive = btn.dataset.filter === filter;
    btn.classList.toggle("isActive", isActive);
    btn.setAttribute("aria-selected", String(isActive));
  }
  render();
}

function filteredItems() {
  if (filter === "active") return items.filter((i) => !i.done);
  if (filter === "completed") return items.filter((i) => i.done);
  return items;
}

function render() {
  const visible = filteredItems();
  todoList.replaceChildren(...visible.map(renderItem));

  const remaining = items.filter((i) => !i.done).length;
  const total = items.length;
  countText.textContent =
    total === 0
      ? "0 items"
      : `${remaining} left • ${total} total`;

  emptyState.hidden = total !== 0;
  clearCompletedBtn.disabled = items.every((i) => !i.done);
}

function renderItem(item) {
  const li = document.createElement("li");
  li.className = `item${item.done ? " isDone" : ""}`;
  li.dataset.id = item.id;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "check";
  checkbox.checked = item.done;
  checkbox.setAttribute("aria-label", "Mark todo as completed");
  checkbox.addEventListener("change", () => toggleDone(item.id));

  const text = document.createElement("div");
  text.className = "text";
  text.textContent = item.text;

  const del = document.createElement("button");
  del.type = "button";
  del.className = "danger";
  del.textContent = "Delete";
  del.addEventListener("click", () => removeItem(item.id));

  li.append(checkbox, text, del);
  return li;
}

function addItem(text) {
  const cleaned = text.trim();
  if (!cleaned) return;
  items = [{ id: uid(), text: cleaned, done: false, createdAt: Date.now() }, ...items];
  saveItems();
  render();
}

function toggleDone(id) {
  const idx = items.findIndex((i) => i.id === id);
  if (idx < 0) return;
  items[idx] = { ...items[idx], done: !items[idx].done };
  saveItems();
  render();
}

function removeItem(id) {
  items = items.filter((i) => i.id !== id);
  saveItems();
  render();
}

function clearCompleted() {
  items = items.filter((i) => !i.done);
  saveItems();
  render();
}

todoForm.addEventListener("submit", (e) => {
  e.preventDefault();
  addItem(todoInput.value);
  todoInput.value = "";
  todoInput.focus();
});

clearCompletedBtn.addEventListener("click", () => clearCompleted());

for (const btn of filterButtons) {
  btn.addEventListener("click", () => setFilter(btn.dataset.filter));
}

setFilter("all");
