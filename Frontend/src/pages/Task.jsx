import React from 'react'
import  { useState} from "react";
import axios from "axios";




const Task = () => {
   

      const [topic, setTopic] = useState(""); 
    const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");
  const [questions, setQuestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const grades = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5"];
  const subjects = ["Science", "Math", "English", "Social Science"];
  const chapters = {
    Science: ["Water Cycle", "Journey of a River", "Plant Life", "Electricity"],
    Math: ["Addition", "Subtraction", "Fractions", "Geometry"],
    English: ["Grammar", "Comprehension", "Vocabulary"],
    "Social Science": ["History", "Geography", "Civics"],
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!grade || !subject || !chapter) return;

    setLoading(true);
    setError(null);
    setQuestions(null);

    try {
      const topic = `${grade} - ${subject} - ${chapter}`;
      const response = await axios.post("http://127.0.0.1:8000/generate-task", {
        topic,
      });
      setQuestions(response.data.questions_json);
    } catch (err) {
      console.error(err);
      setError("Failed to generate questions. Check your server.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div>
    <div>
     
 <h1 className=" h-screen overflow-y-auto custom-scrollbar-hide text-5xl font-extrabold text-gray-800 mt-25 p-2">
            Teacher Homework Generator
           </h1>
           <p className="text-gray-600 text-lg">Generate interactive homework questions in seconds</p>
         </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <form onSubmit={handleSubmit}>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Enter Topic:</label>
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="flex-1 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-3 rounded-lg transition-all outline-none"
                placeholder="e.g., Journey of a River"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 active:scale-95 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {loading ? "Generating..." : "Generate"}
              </button>
            </div>
          </form>

          {loading && (
            <div className="mt-6 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-2 text-gray-600">Generating questions...</p>
            </div>
          )}

          {error && (
            <div className="mt-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}
        </div>

        {questions && (
          <div className="space-y-6">
            {renderSection("Short Answer Questions", questions.short_answer, {
              bg: "bg-blue-50",
              text: "text-blue-600",
              bgLight: "bg-blue-100 text-blue-600",
            })}

            {renderSection("Multiple Choice Questions", questions.mcq, {
              bg: "bg-orange-50",
              text: "text-orange-600",
              bgLight: "bg-orange-100 text-orange-600",
            })}

            {renderSection("Fill in the Blanks", questions.fill_in_the_blanks, {
              bg: "bg-teal-50",
              text: "text-teal-600",
              bgLight: "bg-teal-100 text-teal-600",
            })}
          </div>
        )}
</div>
   
  )
}

export default Task
