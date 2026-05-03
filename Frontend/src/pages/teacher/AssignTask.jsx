import React from 'react'
import PillNav from '../../components/PillNav';


import logo from "../public/logo.png";

const AssignTask = () => {
  return (
    <div className='h-screen overflow-y-auto custom-scrollbar-hide'>

      <div className="flex justify-center">
        <PillNav
          logo={logo}
          logoAlt="Company Logo"
          items={navItems}
          className="custom-nav"
        />
      </div>
      <p className="text-center text-black mb-10">
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
  )
}

export default AssignTask;
