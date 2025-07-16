'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Eye, Users, Database, CheckCircle, XCircle } from 'lucide-react';

interface UserConsentProps {
  onConsentGiven: () => void;
}

export default function UserConsent({ onConsentGiven }: UserConsentProps) {
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [consents, setConsents] = useState({
    privacy: false,
    cookies: false,
    dataProcessing: false,
    marketing: false
  });

  useEffect(() => {
    // Check if user has already given consent
    const consentGiven = localStorage.getItem('user_consent_given');
    if (!consentGiven) {
      setShowModal(true);
    }
  }, []);

  const consentSteps = [
    {
      title: "🔒 Privacy & Data Protection",
      icon: <Shield className="w-8 h-8" />,
      description: "We collect and process your personal data to provide government services. Your data is encrypted and stored securely.",
      key: 'privacy' as keyof typeof consents,
      required: true
    },
    {
      title: "🍪 Cookies & Analytics", 
      icon: <Eye className="w-8 h-8" />,
      description: "We use cookies to improve your experience and analyze website usage. Essential cookies are required for functionality.",
      key: 'cookies' as keyof typeof consents,
      required: true
    },
    {
      title: "💾 Data Processing",
      icon: <Database className="w-8 h-8" />,
      description: "Your data will be processed for service delivery, verification, and compliance with government regulations.",
      key: 'dataProcessing' as keyof typeof consents,
      required: true
    },
    {
      title: "📢 Marketing Communications",
      icon: <Users className="w-8 h-8" />,
      description: "Receive updates about new services, schemes, and important announcements via WhatsApp and email.",
      key: 'marketing' as keyof typeof consents,
      required: false
    }
  ];

  const handleConsentChange = (key: keyof typeof consents, value: boolean) => {
    setConsents(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (currentStep < consentSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    const requiredConsents = consentSteps.filter(step => step.required);
    const allRequiredGiven = requiredConsents.every(step => consents[step.key]);

    if (!allRequiredGiven) {
      alert('Please accept all required consents to continue.');
      return;
    }

    try {
      // Generate session ID
      const sessionId = crypto.randomUUID();
      
      // Store consent in database
      const response = await fetch('/api/user-consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          consents,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }),
      });

      if (response.ok) {
        // Store in localStorage
        localStorage.setItem('user_consent_given', 'true');
        localStorage.setItem('user_consent_session', sessionId);
        localStorage.setItem('user_consent_data', JSON.stringify(consents));
        
        setShowModal(false);
        onConsentGiven();
      } else {
        throw new Error('Failed to store consent');
      }
    } catch (error) {
      console.error('Error storing consent:', error);
      alert('Error storing consent. Please try again.');
    }
  };

  const currentStepData = consentSteps[currentStep];

  if (!showModal) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-t-2xl">
            <div className="flex items-center space-x-3">
              <Lock className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">User Consent Required</h2>
                <p className="text-red-100">Step {currentStep + 1} of {consentSteps.length}</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-4 bg-gray-50">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / consentSteps.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <motion.div
              key={currentStep}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Step Icon & Title */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                  <div className="text-red-600">
                    {currentStepData.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {currentStepData.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {currentStepData.description}
                </p>
              </div>

              {/* Consent Options */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleConsentChange(currentStepData.key, true)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                          consents[currentStepData.key] 
                            ? 'bg-green-500 text-white' 
                            : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-green-400'
                        }`}
                      >
                        <CheckCircle className="w-5 h-5" />
                        <span>I Accept</span>
                      </button>
                      
                      {!currentStepData.required && (
                        <button
                          onClick={() => handleConsentChange(currentStepData.key, false)}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                            !consents[currentStepData.key] 
                              ? 'bg-gray-500 text-white' 
                              : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          <XCircle className="w-5 h-5" />
                          <span>Decline</span>
                        </button>
                      )}
                    </div>
                    
                    {currentStepData.required && (
                      <span className="text-red-600 font-medium text-sm">Required</span>
                    )}
                  </div>
                  
                  {currentStepData.required && !consents[currentStepData.key] && (
                    <p className="text-red-600 text-sm">
                      This consent is required to use our services.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex space-x-2">
              {consentSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentStep ? 'bg-red-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {currentStep < consentSteps.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Complete Setup
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
