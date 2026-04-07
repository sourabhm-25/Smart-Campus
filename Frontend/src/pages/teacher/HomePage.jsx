import React from 'react'
import HeroSection from '../../components/HeroSection';
import ProcessSection from '../../components/ProcessSection';
import EnrollmentRequests from '../../components/EnrollmentRequests';

const HomePage = () => {
  return (
    <div>
      <HeroSection />
      <EnrollmentRequests />
      <ProcessSection />
    </div>
  )
}

export default HomePage
