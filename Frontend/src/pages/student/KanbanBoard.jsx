import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Storage ──────────────────────────────────────────────
const STORAGE_KEY = "smartcampus_kanban_v2";

const DEFAULT_COLUMNS = [
  {
    id: "todo",
    title: "To Do",
    color: "#EFA83F",
    bg: "#FFECA8",
    dot: "#EFA83F",
    shadow: "#f4d98e",
  },
  {
    id: "inprogress",
    title: "In Progress",
    color: "#F4C542",
    bg: "#FFF5D6",
    dot: "#F4C542",
    shadow: "#fbbf24",
  },
  {
    id: "review",
    title: "Review",
    color: "#d8a0c4",
    bg: "#f1d8e6",
    dot: "#c084fc",
    shadow: "#d8a0c4",
  },
  {
    id: "done",
    title: "Done",
    color: "#6FA8DC",
    bg: "#B7DBFF",
    dot: "#6FA8DC",
    shadow: "#8bb7d8",
  },
];

const DEFAULT_CARDS = {
  todo: [
    { id: "c1", title: "Read Chapter 4", desc: "Science homework", priority: "medium" },
  ],
  inprogress: [
    { id: "c2", title: "Algebra Worksheet", desc: "Math assignment 3", priority: "high" },
  ],
  review: [],
  done: [
    { id: "c3", title: "History Essay", desc: "Submitted on time", priority: "low" },
  ],
};

const PRIORITY_META = {
  high:   { label: "High",   color: "#991b1b", bg: "#fee2e2", border: "#f87171" },
  medium: { label: "Medium", color: "#92400e", bg: "#fef3c7", border: "#fbbf24" },
  low:    { label: "Low",    color: "#065f46", bg: "#d1fae5", border: "#34d399" },
};

function genId() {
  return "c" + Math.random().toString(36).slice(2, 9);
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
}

function saveState(cards) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cards)); } catch (_) {}
}

// ─── Add / Edit Card Modal ────────────────────────────────
function CardModal({ initial, onSave, onClose }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [desc, setDesc] = useState(initial?.desc ?? "");
  const [priority, setPriority] = useState(initial?.priority ?? "medium");

  const valid = title.trim().length > 0;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(7,21,33,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.88, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: "#ffffff",
          border: "4px solid #071521",
          borderRadius: 20,
          padding: "28px 28px 24px",
          width: "100%", maxWidth: 440,
          boxShadow: "8px 8px 0 #8bb7d8",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <h3 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: 20, color: "#071521", marginBottom: 20 }}>
          {initial ? "✏️ Edit Card" : "➕ New Card"}
        </h3>

        {/* Title */}
        <label style={{ fontSize: 12, fontWeight: 800, color: "#3F6E8F", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
          Title *
        </label>
        <input
          autoFocus
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === "Enter" && valid && onSave({ title: title.trim(), desc: desc.trim(), priority })}
          placeholder="What needs to be done?"
          style={{
            width: "100%", padding: "10px 14px", fontSize: 14, fontWeight: 700,
            border: "3px solid #071521", borderRadius: 10, outline: "none",
            fontFamily: "inherit", color: "#071521", marginBottom: 16,
            boxShadow: "3px 3px 0 #d8e8f4",
          }}
        />

        {/* Description */}
        <label style={{ fontSize: 12, fontWeight: 800, color: "#3F6E8F", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
          Description
        </label>
        <textarea
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Add a note… (optional)"
          rows={3}
          style={{
            width: "100%", padding: "10px 14px", fontSize: 14, fontWeight: 600,
            border: "3px solid #071521", borderRadius: 10, outline: "none",
            fontFamily: "inherit", color: "#071521", marginBottom: 16,
            resize: "vertical", boxShadow: "3px 3px 0 #d8e8f4",
          }}
        />

        {/* Priority */}
        <label style={{ fontSize: 12, fontWeight: 800, color: "#3F6E8F", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>
          Priority
        </label>
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {Object.entries(PRIORITY_META).map(([key, meta]) => (
            <button
              key={key}
              onClick={() => setPriority(key)}
              style={{
                flex: 1, padding: "8px 0", fontSize: 12, fontWeight: 900,
                border: `3px solid ${priority === key ? "#071521" : meta.border}`,
                borderRadius: 10, cursor: "pointer",
                background: priority === key ? meta.bg : "#f8fafc",
                color: priority === key ? meta.color : "#64748b",
                boxShadow: priority === key ? `3px 3px 0 #071521` : "none",
                transition: "all 0.15s",
                fontFamily: "inherit",
              }}
            >
              {meta.label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "11px 0", fontSize: 13, fontWeight: 800,
              border: "3px solid #071521", borderRadius: 10, cursor: "pointer",
              background: "#f1f5f9", color: "#071521",
              fontFamily: "inherit",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => valid && onSave({ title: title.trim(), desc: desc.trim(), priority })}
            disabled={!valid}
            style={{
              flex: 2, padding: "11px 0", fontSize: 13, fontWeight: 900,
              border: "3px solid #071521", borderRadius: 10, cursor: valid ? "pointer" : "not-allowed",
              background: valid ? "#FFECA8" : "#e2e8f0",
              color: valid ? "#071521" : "#94a3b8",
              boxShadow: valid ? "4px 4px 0 #071521" : "none",
              transition: "all 0.15s",
              fontFamily: "inherit",
            }}
          >
            {initial ? "Save Changes ✓" : "Add Card ➕"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────
function TaskCard({ card, colId, colColor, colBg, columns, index,
  onDragStart, onEdit, onDelete, onMove }) {
  const pm = PRIORITY_META[card.priority] || PRIORITY_META.medium;
  const dragRef = useRef(null);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      draggable
      onDragStart={e => {
        dragRef.current = true;
        onDragStart(e, card.id, colId);
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragEnd={() => { dragRef.current = false; }}
      style={{
        background: "#ffffff",
        border: "3px solid #071521",
        boxShadow: "3px 3px 0 #071521",
        borderRadius: 14, padding: "14px 14px 12px",
        cursor: "grab", userSelect: "none",
        position: "relative",
      }}
    >
      {/* Title */}
      <div style={{ fontSize: 15, fontWeight: 800, color: "#071521", marginBottom: 5, lineHeight: 1.35, paddingRight: 60 }}>
        {card.title}
      </div>

      {/* Desc */}
      {card.desc && (
        <div style={{ fontSize: 13, color: "#3F6E8F", fontWeight: 600, marginBottom: 10, lineHeight: 1.4 }}>
          {card.desc}
        </div>
      )}

      {/* Bottom row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{
          fontSize: 11, fontWeight: 900, padding: "3px 10px", borderRadius: 99,
          background: pm.bg, border: `2px solid ${pm.border}`, color: pm.color,
        }}>
          {pm.label}
        </span>

        {/* Move to column quick-select */}
        <div style={{ display: "flex", gap: 4 }}>
          {columns.filter(c => c.id !== colId).map(c => (
            <button
              key={c.id}
              title={`Move to ${c.title}`}
              onClick={() => onMove(card.id, colId, c.id)}
              style={{
                fontSize: 10, fontWeight: 900, padding: "2px 7px",
                border: "2px solid #071521", borderRadius: 6, cursor: "pointer",
                background: c.bg, color: "#071521",
                boxShadow: "1px 1px 0 #071521",
                fontFamily: "inherit",
              }}
            >
              → {c.title.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Action buttons top-right */}
      <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 4 }}>
        <button
          onClick={() => onEdit(card)}
          title="Edit"
          style={{
            width: 26, height: 26, border: "2px solid #071521", borderRadius: 6,
            background: "#d8e8f4", cursor: "pointer", fontSize: 12,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "1px 1px 0 #071521",
          }}
        >✏️</button>
        <button
          onClick={() => onDelete(card.id, colId)}
          title="Delete"
          style={{
            width: 26, height: 26, border: "2px solid #f87171", borderRadius: 6,
            background: "#fee2e2", cursor: "pointer", fontSize: 12,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "1px 1px 0 #f87171",
          }}
        >🗑️</button>
      </div>
    </motion.div>
  );
}

// ─── Column ───────────────────────────────────────────────
function Column({ col, cards, columns, onDragStart, onDrop, onDragOver, onDragLeave,
  isDragOver, onAddCard, onEdit, onDelete, onMove }) {

  return (
    <div
      onDrop={e => onDrop(e, col.id)}
      onDragOver={e => { e.preventDefault(); onDragOver(col.id); }}
      onDragLeave={onDragLeave}
      style={{
        flex: "1 1 260px", minWidth: 260, maxWidth: 340,
        background: isDragOver ? col.bg : col.bg,
        border: isDragOver ? `4px dashed #071521` : `4px solid #071521`,
        borderRadius: 24, padding: "18px 16px 16px",
        boxShadow: isDragOver ? `8px 8px 0 ${col.shadow}` : `6px 6px 0 ${col.shadow}`,
        transition: "border 0.15s, box-shadow 0.15s",
        display: "flex", flexDirection: "column",
        minHeight: 300,
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: col.dot, border: "2px solid #071521" }} />
          <h3 style={{ fontSize: 17, fontWeight: 900, color: "#071521", fontFamily: "'Sora', sans-serif" }}>
            {col.title}
          </h3>
          <span style={{
            fontSize: 11, fontWeight: 900, padding: "1px 8px",
            background: "#ffffff", border: "2px solid #071521",
            borderRadius: 99, color: "#071521",
            boxShadow: "1px 1px 0 #071521",
          }}>
            {cards.length}
          </span>
        </div>
        <button
          onClick={() => onAddCard(col.id)}
          title="Add card"
          style={{
            width: 30, height: 30, borderRadius: 8, border: "3px solid #071521",
            background: "#ffffff", cursor: "pointer", fontSize: 16, fontWeight: 900,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "2px 2px 0 #071521", color: "#071521",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#071521"; e.currentTarget.style.color = col.bg; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.color = "#071521"; }}
        >+</button>
      </div>

      {/* Drop zone hint */}
      {isDragOver && (
        <div style={{
          border: "3px dashed #071521", borderRadius: 12,
          padding: "12px 0", textAlign: "center",
          fontSize: 12, fontWeight: 800, color: "#3F6E8F",
          marginBottom: 10, background: "rgba(255,255,255,0.5)",
        }}>
          Drop here
        </div>
      )}

      {/* Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        <AnimatePresence>
          {cards.map((card, i) => (
            <TaskCard
              key={card.id}
              card={card}
              colId={col.id}
              colColor={col.color}
              colBg={col.bg}
              columns={columns}
              index={i}
              onDragStart={onDragStart}
              onEdit={onEdit}
              onDelete={onDelete}
              onMove={onMove}
            />
          ))}
        </AnimatePresence>

        {cards.length === 0 && !isDragOver && (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            opacity: 0.5, padding: "20px 0",
          }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>📭</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#3F6E8F", textAlign: "center" }}>
              No tasks here.<br />Drag one over or click +
            </div>
          </div>
        )}
      </div>

      {/* Add card button at bottom */}
      <button
        onClick={() => onAddCard(col.id)}
        style={{
          marginTop: 12, width: "100%", padding: "9px 0",
          fontSize: 12, fontWeight: 900, color: "#071521",
          background: "rgba(255,255,255,0.7)", border: "2px dashed #071521",
          borderRadius: 10, cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif",
          transition: "all 0.15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.borderStyle = "solid"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.7)"; e.currentTarget.style.borderStyle = "dashed"; }}
      >
        + Add card
      </button>
    </div>
  );
}

// ─── Main Board ───────────────────────────────────────────
export default function KanbanBoard() {
  const [cards, setCards] = useState(() => {
    const saved = loadState();
    return saved || DEFAULT_CARDS;
  });

  const [dragCard, setDragCard] = useState(null);   // { id, fromCol }
  const [dragOver, setDragOver] = useState(null);   // col id

  // Modal state
  const [modal, setModal] = useState(null); // { mode: "add"|"edit", colId, card? }

  // Persist
  useEffect(() => { saveState(cards); }, [cards]);

  // ── Drag handlers ──────────────────────────────────────
  const handleDragStart = (e, cardId, fromCol) => {
    setDragCard({ id: cardId, fromCol });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e, toCol) => {
    e.preventDefault();
    if (!dragCard) return;
    const { id, fromCol } = dragCard;
    if (fromCol === toCol) { setDragCard(null); setDragOver(null); return; }

    setCards(prev => {
      const card = prev[fromCol].find(c => c.id === id);
      if (!card) return prev;
      return {
        ...prev,
        [fromCol]: prev[fromCol].filter(c => c.id !== id),
        [toCol]: [...prev[toCol], card],
      };
    });
    setDragCard(null);
    setDragOver(null);
  };

  const handleDragOver = (colId) => { setDragOver(colId); };
  const handleDragLeave = () => { setDragOver(null); };

  // ── Move card via button ──────────────────────────────
  const moveCard = (cardId, fromCol, toCol) => {
    setCards(prev => {
      const card = prev[fromCol].find(c => c.id === cardId);
      if (!card) return prev;
      return {
        ...prev,
        [fromCol]: prev[fromCol].filter(c => c.id !== cardId),
        [toCol]: [...prev[toCol], card],
      };
    });
  };

  // ── Delete card ───────────────────────────────────────
  const deleteCard = (cardId, colId) => {
    setCards(prev => ({
      ...prev,
      [colId]: prev[colId].filter(c => c.id !== cardId),
    }));
  };

  // ── Open modal ────────────────────────────────────────
  const openAdd = (colId) => setModal({ mode: "add", colId });
  const openEdit = (card) => {
    const colId = Object.keys(cards).find(cid => cards[cid].some(c => c.id === card.id));
    setModal({ mode: "edit", colId, card });
  };

  // ── Save from modal ───────────────────────────────────
  const handleSave = ({ title, desc, priority }) => {
    if (modal.mode === "add") {
      const newCard = { id: genId(), title, desc, priority };
      setCards(prev => ({
        ...prev,
        [modal.colId]: [...prev[modal.colId], newCard],
      }));
    } else {
      setCards(prev => ({
        ...prev,
        [modal.colId]: prev[modal.colId].map(c =>
          c.id === modal.card.id ? { ...c, title, desc, priority } : c
        ),
      }));
    }
    setModal(null);
  };

  // ── Reset board ───────────────────────────────────────
  const resetBoard = () => {
    if (window.confirm("Reset board to default? This will remove all your cards.")) {
      setCards(DEFAULT_CARDS);
    }
  };

  const totalCards = Object.values(cards).reduce((s, col) => s + col.length, 0);
  const doneCards  = (cards.done || []).length;

  return (
    <div style={{ padding: "36px 36px 60px", minHeight: "100%", fontFamily: "'DM Sans', sans-serif", color: "#071521" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800;9..40,900&family=Sora:wght@600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        button { font-family: 'DM Sans', sans-serif; }
        input, textarea { font-family: 'DM Sans', sans-serif; }
        input:focus, textarea:focus { box-shadow: 4px 4px 0 #8bb7d8 !important; border-color: #071521 !important; }
      `}</style>

      {/* Page header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "20px 24px",
        background: "linear-gradient(135deg, #ffe792, #B7DBFF)",
        border: "4px solid #071521",
        borderRadius: 14,
        boxShadow: "6px 6px 0 #d8a0c4",
        marginBottom: 28,
        flexWrap: "wrap", gap: 14,
      }}>
        <div>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: 22, color: "#071521", margin: "0 0 5px" }}>
            📋 Kanban Board
          </h1>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#1C3F57" }}>
            {doneCards > 0
              ? <><span style={{ color: "#15803d", fontWeight: 900 }}>{doneCards} done</span> · {totalCards - doneCards} remaining</>
              : <span>Drag cards between columns · Click <strong>+</strong> to add tasks</span>
            }
          </div>
        </div>

        {/* Stats badges */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{
            padding: "6px 14px", borderRadius: 99, background: "#ffffff",
            border: "3px solid #071521", fontSize: 12, fontWeight: 900, color: "#071521",
            boxShadow: "3px 3px 0 #8bb7d8",
          }}>
            {totalCards} total cards
          </div>
          {totalCards > 0 && (
            <div style={{
              padding: "6px 14px", borderRadius: 99,
              background: "#d1fae5", border: "3px solid #34d399",
              fontSize: 12, fontWeight: 900, color: "#065f46",
              boxShadow: "3px 3px 0 #6ee7b7",
            }}>
              {Math.round((doneCards / totalCards) * 100)}% complete
            </div>
          )}
          <button
            onClick={resetBoard}
            style={{
              padding: "6px 14px", borderRadius: 99, background: "#fee2e2",
              border: "3px solid #f87171", fontSize: 12, fontWeight: 900, color: "#991b1b",
              cursor: "pointer", boxShadow: "3px 3px 0 #fca5a5",
            }}
          >
            Reset Board
          </button>
        </div>
      </div>

      {/* Board columns */}
      <div style={{ display: "flex", gap: 18, overflowX: "auto", paddingBottom: 16, alignItems: "flex-start" }}>
        {DEFAULT_COLUMNS.map(col => (
          <Column
            key={col.id}
            col={col}
            cards={cards[col.id] || []}
            columns={DEFAULT_COLUMNS}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            isDragOver={dragOver === col.id}
            onAddCard={openAdd}
            onEdit={openEdit}
            onDelete={deleteCard}
            onMove={moveCard}
          />
        ))}
      </div>

      {/* Instructions */}
      <div style={{
        marginTop: 20, padding: "14px 20px",
        background: "#ffffff", border: "3px solid #d8e8f4",
        borderRadius: 12, fontSize: 12, fontWeight: 700, color: "#3F6E8F",
        display: "flex", gap: 20, flexWrap: "wrap",
      }}>
        <span>🖱️ <strong>Drag</strong> cards between columns</span>
        <span>➕ Click <strong>+</strong> to add a new card</span>
        <span>✏️ Click <strong>edit</strong> to rename a card</span>
        <span>🗑️ Click <strong>delete</strong> to remove a card</span>
        <span>→ Click <strong>column name</strong> to instantly move a card</span>
        <span>💾 Board is <strong>saved automatically</strong></span>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <CardModal
            key="modal"
            initial={modal.card}
            onSave={handleSave}
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
