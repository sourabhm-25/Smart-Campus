import React, { useState } from "react";
import { FiPlus, FiTrash } from "react-icons/fi";
import { motion } from "framer-motion";
import { FaFire } from "react-icons/fa";

/* ===============================
   MAIN KANBAN COMPONENT
================================ */
const Kanban = () => {
  const [cards, setCards] = useState([]);

  return (
    <div className="flex flex-row md:flex-row h-full w-full gap-3 overflow-x-auto overflow-y-hidden p-4 md:p-12 bg-neutral-900 text-neutral-50">

      <div className="flex gap-4 md:gap-6">
        <Column
          title="Backlog"
          column="backlog"
          headingColor="text-neutral-500"
          cards={cards}
          setCards={setCards}
        />

        <Column
          title="TODO"
          column="todo"
          headingColor="text-yellow-200"
          cards={cards}
          setCards={setCards}
        />

        <Column
          title="In Progress"
          column="doing"
          headingColor="text-blue-200"
          cards={cards}
          setCards={setCards}
        />

        <Column
          title="Complete"
          column="done"
          headingColor="text-emerald-200"
          cards={cards}
          setCards={setCards}
        />
      </div>

      <BurnBarrel setCards={setCards} />

    </div>
  );
};

export default Kanban;

/* ===============================
   COLUMN
================================ */
const Column = ({ title, headingColor, cards, column, setCards }) => {
  const [active, setActive] = useState(false);

  const filteredCards = cards.filter((c) => c.column === column);

  const handleDragStart = (e, card) => {
    e.dataTransfer.setData("cardId", card.id);
  };

  const handleDrop = (e) => {
    const cardId = e.dataTransfer.getData("cardId");
    setActive(false);
    clearHighlights();

    const indicators = getIndicators();
    const { element } = getNearestIndicator(e, indicators);
    const before = element.dataset.before || "-1";

    if (before !== cardId) {
      let updated = [...cards];
      let cardToMove = updated.find((c) => c.id === cardId);
      if (!cardToMove) return;

      cardToMove = { ...cardToMove, column };
      updated = updated.filter((c) => c.id !== cardId);

      if (before === "-1") {
        updated.push(cardToMove);
      } else {
        const idx = updated.findIndex((el) => el.id === before);
        updated.splice(idx, 0, cardToMove);
      }

      setCards(updated);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    highlightIndicator(e);
    setActive(true);
  };

  const clearHighlights = (els) => {
    const nodes = els || getIndicators();
    nodes.forEach((i) => (i.style.opacity = "0"));
  };

  const highlightIndicator = (e) => {
    const indicators = getIndicators();
    clearHighlights(indicators);
    const { element } = getNearestIndicator(e, indicators);
    element.style.opacity = "1";
  };

  const getIndicators = () =>
    Array.from(document.querySelectorAll(`[data-column="${column}"]`));

  const getNearestIndicator = (e, indicators) => {
    const DISTANCE = 50;
    return indicators.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = e.clientY - (box.top + DISTANCE);
        if (offset < 0 && offset > closest.offset)
          return { offset, element: child };
        return closest;
      },
      {
        offset: Number.NEGATIVE_INFINITY,
        element: indicators[indicators.length - 1],
      }
    );
  };

  return (
    <div className="w-56 shrink-0 md:w-64">

      {/* HEADER */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className={`font-medium text-sm md:text-base ${headingColor}`}>
          {title}
        </h3>
        <span className="text-neutral-400 text-xs md:text-sm">{filteredCards.length}</span>
      </div>

      {/* CARD AREA */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => {
          clearHighlights();
          setActive(false);
        }}
        className={`h-full w-full p-2 rounded transition-colors ${
          active ? "bg-neutral-800/50" : "bg-neutral-800/0"
        }`}
      >
        {filteredCards.map((c) => (
          <Card key={c.id} {...c} handleDragStart={handleDragStart} />
        ))}

        <DropIndicator beforeId={null} column={column} />
        <AddCard column={column} setCards={setCards} />
      </div>
    </div>
  );
};

/* ===============================
   CARD
================================ */
const Card = ({ title, id, column, handleDragStart }) => (
  <>
    <DropIndicator beforeId={id} column={column} />

    <motion.div
      layout
      layoutId={id}
      draggable="true"
      onDragStart={(e) => handleDragStart(e, { id, title, column })}
      className="cursor-grab rounded border border-neutral-700 bg-neutral-800 p-3 mb-2 active:cursor-grabbing"
    >
      <p className="text-sm text-neutral-100 break-words">{title}</p>
    </motion.div>
  </>
);

/* ===============================
   DROP INDICATOR
================================ */
const DropIndicator = ({ beforeId, column }) => (
  <div
    data-before={beforeId || "-1"}
    data-column={column}
    className="my-0.5 h-0.5 w-full bg-violet-400 opacity-0"
  />
);

/* ===============================
   DELETE (TRASH)
================================ */
const BurnBarrel = ({ setCards }) => {
  const [active, setActive] = useState(false);

  const handleDrop = (e) => {
    const id = e.dataTransfer.getData("cardId");
    setCards((prev) => prev.filter((c) => c.id !== id));
    setActive(false);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setActive(true);
      }}
      onDragLeave={() => setActive(false)}
      onDrop={handleDrop}
      className={`mt-4 md:mt-10 grid h-32 w-32 md:h-56 md:w-56 shrink-0 place-content-center rounded border text-2xl md:text-3xl transition-all ${
        active
          ? "border-red-800 bg-red-800/20 text-red-500"
          : "border-neutral-500 bg-neutral-500/20 text-neutral-500"
      }`}
    >
      {active ? <FaFire className="animate-bounce" /> : <FiTrash />}
    </div>
  );
};

/* ===============================
   ADD NEW CARD
================================ */
const AddCard = ({ column, setCards }) => {
  const [text, setText] = useState("");
  const [adding, setAdding] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setCards((prev) => [
      ...prev,
      { id: Math.random().toString(), title: text.trim(), column },
    ]);

    setText("");
    setAdding(false);
  };

  return (
    <>
      {adding ? (
        <motion.form layout onSubmit={handleSubmit}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
            placeholder="Add new task..."
            className="w-full rounded border border-violet-400 bg-violet-400/20 p-2 md:p-3 text-sm text-neutral-50 placeholder-violet-300"
          />

          <div className="mt-1.5 flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="text-xs px-3 py-1.5 text-neutral-400 hover:text-neutral-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex items-center gap-1.5 bg-neutral-50 text-neutral-950 px-3 py-1.5 text-xs rounded hover:bg-neutral-300"
            >
              Add
              <FiPlus />
            </button>
          </div>
        </motion.form>
      ) : (
        <motion.button
          layout
          onClick={() => setAdding(true)}
          className="flex w-full items-center gap-1.5 px-2 md:px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-50"
        >
          Add card
          <FiPlus />
        </motion.button>
      )}
    </>
  );
};
