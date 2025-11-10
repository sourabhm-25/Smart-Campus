import React from 'react';
import '../App.css'; // Re-use the same CSS file

function ProcessSection() {
  return (
    <section className="process-section">
      <h2>Our Intelligent Process</h2>

      <div className="process-list">
        {/* Step 1 */}
        <div className="process-step">
          <div className="step-icon-wrapper">
            {/* You can replace this div with an <img /> tag or an icon component */}
            <div className="step-icon">{'{ }'}</div>
          </div>
          <div className="step-content">
            <span>01</span>
            <h3>Teacher Enters a Prompt</h3>
            <p>
              It all starts with a simple idea. A teacher enters a topic they just taught, 
              like 'The Solar System' or 'Fractional Division'.
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="process-step">
          <div className="step-icon-wrapper">
            <div className="step-icon">✨</div>
          </div>
          <div className="step-content">
            <span>02</span>
            <h3>AI Builds the Quest</h3>
            <p>
              Our RAG system cross-references the prompt with the approved textbook, 
              retrieves the exact context, and instructs our Vision AI to generate a 
              perfectly aligned, engaging quest with questions and flashcards.
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="process-step">
          <div className="step-icon-wrapper">
            <div className="step-icon">✅</div>
          </div>
          <div className="step-content">
            <span>03</span>
            <h3>Students Receive Their Mission</h3>
            <p>
              Students get an engaging 'Daily Quest' on their device. They complete the work, 
              submit a photo, and our AI assists the teacher with preliminary analysis, 
              closing the learning loop in minutes, not days.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProcessSection;