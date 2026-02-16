import { useState } from "react";
import axios from "axios";
import { FaCloudUploadAlt, FaPaperPlane, FaSpinner, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

export default function TestImageSol() {
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !question) {
      alert("Please enter a question and upload an image");
      return;
    }

    const formData = new FormData();
    formData.append("question_text", question);
    formData.append("file", file);

    try {
      setLoading(true);
      const res = await axios.post("http://127.0.0.1:8000/evaluate", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong! Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-blue-950 to-violet-900 flex flex-col items-center justify-center font-sans text-white ">
      
      <div className="w-full max-w-2xl">
        
        {/* Header */}
        <div className="text-center ">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400 mb-1">
            Smart Answer Evaluator
          </h2>
          <p className="text-blue-200/80">Quick, accurate, and automated grading.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="group">
            <label className="block text-blue-300 font-medium mb-1 group-focus-within:text-blue-400 transition-colors">Question</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type the question here..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-white/10 focus:ring-1 focus:ring-blue-500 transition-all duration-300"
            />
          </div>

          <div>
            <label className="block text-blue-300 font-medium mb-1">Student Answer</label>
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-white/20 rounded-xl cursor-pointer bg-white/5 hover:bg-white/10 hover:border-blue-400 transition-all duration-300 group">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FaCloudUploadAlt className="w-6 h-6 text-gray-400 mb-1 group-hover:text-blue-400 transition-colors" />
                <p className="text-sm text-gray-400 group-hover:text-blue-200 transition-colors">
                  {file ? <span className="text-blue-400 font-semibold">{file.name}</span> : "Click to upload image"}
                </p>
              </div>
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`
              w-full py-3 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all duration-300
              ${loading 
                ? "bg-blue-900/50 cursor-wait text-blue-300" 
                : "bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 hover:shadow-blue-500/25 active:scale-[0.99]"
              }
            `}
          >
            {loading ? (
               <>
                 <FaSpinner className="animate-spin" /> Evaluating...
               </>
            ) : (
              <>
                Evaluate <FaPaperPlane className="text-sm" />
              </>
            )}
          </button>
        </form>

        {/* Limitless Result Display */}
        {result && (
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className={`p-1 rounded-2xl bg-gradient-to-r ${result.error ? 'from-red-500/50 to-orange-500/50' : 'from-green-500/50 to-blue-500/50'}`}>
              <div className="bg-black/80 backdrop-blur-md rounded-xl p-4">
                
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {result.error ? <FaExclamationCircle className="text-red-500"/> : <FaCheckCircle className="text-green-500"/>}
                    Result
                  </h3>
                  {!result.error && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                        (result.score / result.max_marks) >= 0.8 ? "bg-green-500/10 text-green-400 border-green-500/30" : 
                        (result.score / result.max_marks) >= 0.4 ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" : "bg-red-500/10 text-red-400 border-red-500/30"
                      }`}>
                      Score: {result.score}/{result.max_marks}
                    </span>
                  )}
                </div>

                {result.error ? (
                  <p className="text-red-400">{result.error}</p>
                ) : (
                  <div className="space-y-3 text-gray-300">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">OCR Extraction</p>
                      <p className="bg-white/5 p-2 rounded-lg text-sm font-mono border border-white/5">{result.student_answer}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Feedback</p>
                      <p className="leading-relaxed text-blue-100 text-sm">{result.feedback}</p>
                    </div>
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
