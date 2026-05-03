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
    <div style={{ padding: "40px 32px", maxWidth: 600, color: "#071521" }}>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          fontFamily: "'Sora', sans-serif",
          fontWeight: 900,
          fontSize: 32,
          marginBottom: 28,
          color: "#071521"
        }}
      >
        My Profile
      </motion.h1>

      <div style={{
        background: "#FFFFFF",
        border: "4px solid #071521",
        borderRadius: 32,
        padding: "32px",
        display: "flex",
        flexDirection: "column",
        gap: 18,
        boxShadow: "6px 6px 0px #071521",
      }}>

        {["name", "email", "grade", "board"].map((field) => (
          <div key={field} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 14, color: "#1C3F57", fontWeight: 800 }}>
              {field.toUpperCase()}
            </label>

            {editing ? (
              <input
                name={field}
                value={formData[field] || ""}
                onChange={handleChange}
                style={{
                  padding: "10px 16px",
                  borderRadius: 16,
                  border: "3px solid #071521",
                  background: "#FFF5D6",
                  color: "#071521",
                  fontWeight: 800,
                  fontSize: 16,
                  boxShadow: "inset 2px 2px 0px rgba(7,21,33,0.1)",
                  outline: "none",
                }}
              />
            ) : (
              <div style={{ fontSize: 16, fontWeight: 900, color: "#071521" }}>
                {student[field]}
              </div>
            )}
          </div>
        ))}

        <div style={{ marginTop: 20 }}>
          {editing ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              style={{
                background: "#EFA83F",
                border: "3px solid #071521",
                padding: "12px 24px",
                borderRadius: 16,
                color: "#071521",
                fontWeight: 900,
                cursor: "pointer",
                boxShadow: "2px 2px 0px #071521",
                fontSize: 16
              }}
            >
              Save Changes
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setEditing(true)}
              style={{
                background: "#6FA8DC",
                border: "3px solid #071521",
                padding: "12px 24px",
                borderRadius: 16,
                color: "#071521",
                fontWeight: 900,
                cursor: "pointer",
                boxShadow: "2px 2px 0px #071521",
                fontSize: 16
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