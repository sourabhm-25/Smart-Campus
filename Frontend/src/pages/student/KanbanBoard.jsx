import { motion } from "framer-motion";

const KanbanBoard = () => {
  return (
    <div style={{ padding: "40px", color: "#071521" }}>
      <h2 style={{ color: "#071521", fontFamily: "'Sora', sans-serif", marginBottom: 10, fontSize: 32, fontWeight: 900 }}>Kanban Board</h2>
      <p style={{ color: "#1C3F57", opacity: 0.8, marginBottom: 30, fontSize: 16, fontWeight: 600 }}>Drag and manage your tasks here.</p>
      
      <div style={{ display: "flex", gap: 24, overflowX: "auto", paddingBottom: 20 }}>
        
        {/* TO DO COLUMN */}
        <div style={{ flex: 1, minWidth: 300, background: "#FFECA8", border: "4px solid #071521", borderRadius: 32, padding: "20px", boxShadow: "6px 6px 0px #071521" }}>
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#EFA83F", border: "2px solid #071521" }} />
            <h3 style={{ fontSize: 20, fontWeight: 900, color: "#071521" }}>To Do</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <motion.div
              whileHover={{ y: -4, boxShadow: "4px 4px 0px #071521", scale: 1.02 }}
              style={{
                background: "#FFFFFF",
                border: "3px solid #071521",
                boxShadow: "2px 2px 0px #071521",
                borderRadius: 20, padding: "16px",
                cursor: "grab", transition: "all 0.2s"
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 800, color: "#071521", marginBottom: 8 }}>Read Chapter 4</div>
              <div style={{ fontSize: 14, color: "#1C3F57", fontWeight: 600, marginBottom: 12 }}>Science homework</div>
              <span style={{ fontSize: 12, fontWeight: 900, padding: "4px 10px", borderRadius: 99, background: "#EFA83F", border: "2px solid #071521", color: "#071521" }}>To Do</span>
            </motion.div>
          </div>
        </div>

        {/* IN PROGRESS COLUMN */}
        <div style={{ flex: 1, minWidth: 300, background: "#FFF5D6", border: "4px solid #071521", borderRadius: 32, padding: "20px", boxShadow: "6px 6px 0px #071521" }}>
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#F4C542", border: "2px solid #071521" }} />
            <h3 style={{ fontSize: 20, fontWeight: 900, color: "#071521" }}>In Progress</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <motion.div
              whileHover={{ y: -4, boxShadow: "4px 4px 0px #071521", scale: 1.02 }}
              style={{
                background: "#FFFFFF",
                border: "3px solid #071521",
                boxShadow: "2px 2px 0px #071521",
                borderRadius: 20, padding: "16px",
                cursor: "grab", transition: "all 0.2s"
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 800, color: "#071521", marginBottom: 8 }}>Algebra Worksheet</div>
              <div style={{ fontSize: 14, color: "#1C3F57", fontWeight: 600, marginBottom: 12 }}>Math assignment 3</div>
              <span style={{ fontSize: 12, fontWeight: 900, padding: "4px 10px", borderRadius: 99, background: "#F4C542", border: "2px solid #071521", color: "#071521" }}>In Progress</span>
            </motion.div>
          </div>
        </div>

        {/* DONE COLUMN */}
        <div style={{ flex: 1, minWidth: 300, background: "#B7DBFF", border: "4px solid #071521", borderRadius: 32, padding: "20px", boxShadow: "6px 6px 0px #071521" }}>
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#6FA8DC", border: "2px solid #071521" }} />
            <h3 style={{ fontSize: 20, fontWeight: 900, color: "#071521" }}>Done</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <motion.div
              whileHover={{ y: -4, boxShadow: "4px 4px 0px #071521", scale: 1.02 }}
              style={{
                background: "#FFFFFF",
                border: "3px solid #071521",
                boxShadow: "2px 2px 0px #071521",
                borderRadius: 20, padding: "16px",
                cursor: "grab", transition: "all 0.2s"
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 800, color: "#071521", marginBottom: 8 }}>History Essay</div>
              <div style={{ fontSize: 14, color: "#1C3F57", fontWeight: 600, marginBottom: 12 }}>Submitted on time</div>
              <span style={{ fontSize: 12, fontWeight: 900, padding: "4px 10px", borderRadius: 99, background: "#6FA8DC", border: "2px solid #071521", color: "#071521" }}>Done</span>
            </motion.div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default KanbanBoard;
