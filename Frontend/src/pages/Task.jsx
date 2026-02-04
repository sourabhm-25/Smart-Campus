import React, { useState } from "react";
import axios from "axios";
import Lottie from "lottie-react";
import bookLoader from "../assets/Book_Loader.json";


export default function Task() {
  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");
  const [questions, setQuestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);

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
    setSaveResult(null);

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

  const handleSaveQuestions = async () => {
    if (!questions) return;

    setSaving(true);
    setSaveResult(null);

    try {
      const topic = `${grade} - ${subject} - ${chapter}`;
      const response = await axios.post("http://127.0.0.1:8000/save-questions", {
        topic,
        questions_json: questions,
      });
      setSaveResult({ success: true, message: response.data.message });
    } catch (err) {
      console.error(err);
      setSaveResult({ success: false, message: "Failed to save questions to database." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 text-center mb-6">
          Teacher Homework Generator
        </h1>
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
            <div className="mt-6 text-center flex flex-col items-center">
              <div className="w-48">
                <Lottie animationData={bookLoader} loop={true} />
              </div>
              <p className="mt-2 text-gray-600 font-medium">Generating questions...</p>
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

            {/* Confirmation Button Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
              <div className="flex flex-col items-center space-y-4">
                <p className="text-gray-600 text-center">
                  Review the questions above. If everything looks correct, click the button below to save them to the database.
                </p>

                <button
                  onClick={handleSaveQuestions}
                  disabled={saving || saveResult?.success}
                  className={`flex items-center gap-2 px-8 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg active:scale-95 disabled:cursor-not-allowed ${saveResult?.success
                      ? "bg-green-500 text-white"
                      : "bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400"
                    }`}
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : saveResult?.success ? (
                    <>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Saved to Database
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Confirm & Save to Database
                    </>
                  )}
                </button>

                {saveResult && (
                  <div className={`p-4 rounded-lg w-full ${saveResult.success
                      ? "bg-green-50 border-l-4 border-green-500"
                      : "bg-red-50 border-l-4 border-red-500"
                    }`}>
                    <p className={`font-medium ${saveResult.success ? "text-green-700" : "text-red-700"}`}>
                      {saveResult.message}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
