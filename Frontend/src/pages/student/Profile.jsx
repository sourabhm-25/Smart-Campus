import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function Profile() {
  const [student, setStudent] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("student"));
    const studentId = stored?.id;

    if (!studentId) {
      setLoading(false);
      return;
    }

    fetch(`/api/student/${studentId}`)
      .then(res => res.json())
      .then(data => {
        setStudent(data);
        setFormData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching profile:", err);
        setLoading(false);
      });
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    try {
      await fetch(`/api/student/${student._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      setStudent(formData);
      setEditing(false);
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

  if (loading) {
    return <div style={{ padding: "40px" }}>Loading profile...</div>;
  }

  if (!student) {
    return <div style={{ padding: "40px" }}>Profile not found.</div>;
  }

  return (
    <div style={{ padding: "40px 32px", maxWidth: 600 }}>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          fontFamily: "'Sora', sans-serif",
          fontWeight: 700,
          fontSize: 22,
          marginBottom: 28,
        }}
      >
        My Profile
      </motion.h1>

      <div style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 18,
        padding: "28px",
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}>

        {["name", "email", "grade", "board"].map((field) => (
          <div key={field} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: "#64748b" }}>
              {field.toUpperCase()}
            </label>

            {editing ? (
              <input
                name={field}
                value={formData[field] || ""}
                onChange={handleChange}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#e2e8f0",
                }}
              />
            ) : (
              <div style={{ fontSize: 14 }}>
                {student[field]}
              </div>
            )}
          </div>
        ))}

        <div style={{ marginTop: 20 }}>
          {editing ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              style={{
                background: "#6366f1",
                border: "none",
                padding: "10px 18px",
                borderRadius: 10,
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Save Changes
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setEditing(true)}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                padding: "10px 18px",
                borderRadius: 10,
                color: "#e2e8f0",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Edit Profile
            </motion.button>
          )}
        </div>

      </div>
    </div>
  );
}