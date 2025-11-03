// import React, { useState } from "react";
// import axios from "axios";

// export default function App() {
//   const [topic, setTopic] = useState("");
//   const [questions, setQuestions] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError(null);
//     setQuestions(null);

//     try {
//       const response = await axios.post("http://127.0.0.1:8000/generate-task", {
//         topic,
//       });
//       setQuestions(response.data.questions_json);
//     } catch (err) {
//       console.error(err);
//       setError("Failed to generate questions. Check your server.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const copyToClipboard = (text) => {
//     navigator.clipboard.writeText(text);
//     alert("Copied to clipboard!");
//   };

//   const QuestionCard = ({ q, index, typeColor }) => (
//     <div className={`border-l-4 pl-4 py-3 rounded-r shadow hover:shadow-lg transition-all ${typeColor.bg}`}>
//       <p className="font-semibold text-gray-800 mb-2">
//         <span className={`font-bold ${typeColor.text}`}>Q{index + 1}:</span> {q.question}
//       </p>
//       {q.options ? (
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
//           {Object.entries(q.options).map(([key, val]) => (
//             <div key={key} className="bg-white px-3 py-2 rounded border border-gray-200 hover:bg-gray-50 cursor-pointer">
//               <span className="font-semibold">{key}:</span> {val}
//             </div>
//           ))}
//         </div>
//       ) : null}
//       <div className="flex justify-between items-center">
//         <p className="text-gray-700">
//           <span className="font-semibold text-green-600">Answer:</span>{" "}
//           <span className="bg-green-100 px-2 py-1 rounded font-semibold">{q.answer}</span>
//         </p>
//         <button
//           onClick={() => copyToClipboard(q.answer)}
//           className="ml-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
//         >
//           Copy
//         </button>
//       </div>
//     </div>
//   );

//   const renderSection = (title, list, typeColor) => (
//     <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
//       <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 ${typeColor.text}`}>
//         <span className={`${typeColor.bgLight} px-3 py-1 rounded-full text-sm`}>
//           {list.length}
//         </span>
//         {title}
//       </h3>
//       <div className="space-y-3">
//         {list.map((q, i) => (
//           <QuestionCard key={i} q={q} index={i} typeColor={typeColor} />
//         ))}
//       </div>
//     </div>
//   );

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12 px-4">
//       <div className="max-w-5xl mx-auto">
//         <div className="text-center mb-10">
//           <h1 className="text-5xl font-extrabold text-gray-800 mb-2">
//             Teacher Homework Generator
//           </h1>
//           <p className="text-gray-600 text-lg">Generate interactive homework questions in seconds</p>
//         </div>

//         <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
//           <form onSubmit={handleSubmit}>
//             <label className="block text-sm font-semibold text-gray-700 mb-3">Enter Topic:</label>
//             <div className="flex flex-col md:flex-row gap-3">
//               <input
//                 type="text"
//                 value={topic}
//                 onChange={(e) => setTopic(e.target.value)}
//                 className="flex-1 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-3 rounded-lg transition-all outline-none"
//                 placeholder="e.g., Journey of a River"
//                 required
//               />
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 active:scale-95 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
//               >
//                 {loading ? "Generating..." : "Generate"}
//               </button>
//             </div>
//           </form>

//           {loading && (
//             <div className="mt-6 text-center">
//               <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
//               <p className="mt-2 text-gray-600">Generating questions...</p>
//             </div>
//           )}

//           {error && (
//             <div className="mt-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
//               <p className="text-red-700 font-medium">{error}</p>
//             </div>
//           )}
//         </div>

//         {questions && (
//           <div className="space-y-6">
//             {renderSection("Short Answer Questions", questions.short_answer, {
//               bg: "bg-blue-50",
//               text: "text-blue-600",
//               bgLight: "bg-blue-100 text-blue-600",
//             })}

//             {renderSection("Multiple Choice Questions", questions.mcq, {
//               bg: "bg-orange-50",
//               text: "text-orange-600",
//               bgLight: "bg-orange-100 text-orange-600",
//             })}

//             {renderSection("Fill in the Blanks", questions.fill_in_the_blanks, {
//               bg: "bg-teal-50",
//               text: "text-teal-600",
//               bgLight: "bg-teal-100 text-teal-600",
//             })}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
import React, { useState } from "react";
import axios from "axios";
import TestImageSol from "./TestImageSol";

export default function App() {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 text-center mb-6">
          Teacher Homework Generator
        </h1>
        <TestImageSol/>
        <p className="text-center text-gray-600 mb-10">
          Select Grade, Subject, and Chapter to generate questions
        </p>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="flex-1 border-2 border-gray-200 p-3 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              >
                <option value="">Select Grade</option>
                {grades.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>

              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="flex-1 border-2 border-gray-200 p-3 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              >
                <option value="">Select Subject</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <select
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                className="flex-1 border-2 border-gray-200 p-3 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                disabled={!subject}
              >
                <option value="">Select Chapter</option>
                {subject && chapters[subject].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 active:scale-95 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {loading ? "Generating..." : "Generate Questions"}
            </button>
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
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Generated Questions</h2>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-blue-600 mb-4">Short Answer</h3>
              <div className="space-y-4">
                {questions.short_answer.map((q, i) => (
                  <div key={i} className="border-l-4 border-blue-300 pl-4 py-2 bg-blue-50 rounded-r">
                    <p className="font-semibold text-gray-800 mb-2">{q.question}</p>
                    <p className="text-gray-700 font-medium">Answer: {q.answer}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-orange-600 mb-4">Multiple Choice Questions</h3>
              <div className="space-y-4">
                {questions.mcq.map((q, i) => (
                  <div key={i} className="border-l-4 border-orange-300 pl-4 py-2 bg-orange-50 rounded-r">
                    <p className="font-semibold text-gray-800 mb-2">{q.question}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                      {Object.entries(q.options).map(([key, val]) => (
                        <div key={key} className="bg-white px-3 py-2 rounded border border-gray-200">{key}: {val}</div>
                      ))}
                    </div>
                    <p className="text-gray-700 font-medium">Answer: {q.answer}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-teal-600 mb-4">Fill in the Blanks</h3>
              <div className="space-y-4">
                {questions.fill_in_the_blanks.map((q, i) => (
                  <div key={i} className="border-l-4 border-teal-300 pl-4 py-2 bg-teal-50 rounded-r">
                    <p className="font-semibold text-gray-800 mb-2">{q.question}</p>
                    <p className="text-gray-700 font-medium">Answer: {q.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
