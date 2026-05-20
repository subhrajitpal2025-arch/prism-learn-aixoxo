import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, X, ListTodo } from "lucide-react";

type Todo = { id: string; text: string; done: boolean; createdAt: number };

const STORAGE_KEY = "lovable.todos.v1";

function load(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Todo[];
  } catch {
    return [];
  }
}

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    setTodos(load());
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setTodos((t) => [
      { id: crypto.randomUUID(), text, done: false, createdAt: Date.now() },
      ...t,
    ]);
    setInput("");
  };

  const toggle = (id: string) =>
    setTodos((t) => t.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
  const remove = (id: string) => setTodos((t) => t.filter((x) => x.id !== id));

  const remaining = todos.filter((t) => !t.done).length;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListTodo className="size-4 text-accent" />
          <h3 className="text-sm font-medium">To-do list</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {remaining} pending · {todos.length} total
        </span>
      </div>

      <form onSubmit={add} className="mb-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a task…"
          className="glass flex-1 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          type="submit"
          className="grid size-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground glow"
          aria-label="Add task"
        >
          <Plus className="size-4" />
        </button>
      </form>

      <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {todos.length === 0 && (
            <motion.li
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass rounded-2xl p-3 text-center text-xs text-muted-foreground"
            >
              No tasks yet. Add one above ✨
            </motion.li>
          )}
          {todos.map((t) => (
            <motion.li
              key={t.id}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="glass flex items-center gap-3 rounded-2xl p-3"
            >
              <button
                onClick={() => toggle(t.id)}
                aria-label={t.done ? "Mark incomplete" : "Mark complete"}
                className={`grid size-6 shrink-0 place-items-center rounded-full border transition ${
                  t.done
                    ? "border-transparent bg-gradient-primary text-primary-foreground glow"
                    : "border-white/20 hover:border-accent hover:bg-white/5"
                }`}
              >
                {t.done && <Check className="size-3.5" />}
              </button>
              <span
                className={`flex-1 text-sm transition ${
                  t.done ? "text-muted-foreground line-through" : ""
                }`}
              >
                {t.text}
              </span>
              <button
                onClick={() => remove(t.id)}
                aria-label="Delete task"
                className="grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-white/10 hover:text-red-400"
              >
                <X className="size-3.5" />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
