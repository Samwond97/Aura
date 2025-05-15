import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KeyRound, Scan, Fingerprint, ShieldAlert, Info } from "lucide-react";
import BiometricAuth from '@/components/journal/BiometricAuth';
import RealFaceIdAuth from '@/components/auth/RealFaceIdAuth';
import PinAuth from '@/components/auth/PinAuth';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AuthManagerProps {
  onAuthenticate: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
}

type AuthMethod = 'select' | 'face' | 'fingerprint' | 'pin';

const AuthManager: React.FC<AuthManagerProps> = ({ 
  onAuthenticate, 
  onSkip, 
  showSkip = true 
}) => {
  const [selectedMethod, setSelectedMethod] = useState<AuthMethod>('select');
  const [preferredMethod, setPreferredMethod] = useState<AuthMethod | null>(null);
  const [needsEnrollment, setNeedsEnrollment] = useState(false);
  
  // Check for stored preferred auth method and enrollment status
  useEffect(() => {
    const storedMethod = localStorage.getItem('preferredAuthMethod');
    if (storedMethod && ['face', 'fingerprint', 'pin'].includes(storedMethod)) {
      setPreferredMethod(storedMethod as AuthMethod);
      setSelectedMethod(storedMethod as AuthMethod);
      
      // Check if the selected method needs enrollment
      checkEnrollmentStatus(storedMethod as AuthMethod);
    }
  }, []);
  
  const checkEnrollmentStatus = (method: AuthMethod) => {
    switch(method) {
      case 'face':
        const faceEnrolled = localStorage.getItem('faceIdEnrolled') === 'true';
        setNeedsEnrollment(!faceEnrolled);
        break;
      case 'fingerprint':
        // In a real app, we'd check if fingerprint enrollment is completed
        // For this demo, we'll consider it always enrolled
        setNeedsEnrollment(false);
        break;
      case 'pin':
        const pinEnrolled = localStorage.getItem('journalPin') !== null;
        setNeedsEnrollment(!pinEnrolled);
        break;
      default:
        setNeedsEnrollment(false);
    }
  };
  
  const handleAuthenticate = () => {
    // If user authenticated successfully, store their preferred method
    if (selectedMethod !== 'select') {
      localStorage.setItem('preferredAuthMethod', selectedMethod);
    }
    onAuthenticate();
  };
  
  const handleSelectMethod = (method: AuthMethod) => {
    setSelectedMethod(method);
    // Check if enrollment is needed when selecting a method
    checkEnrollmentStatus(method);
  };
  
  const handleCancel = () => {
    // Return to method selection
    if (preferredMethod) {
      setSelectedMethod(preferredMethod);
      checkEnrollmentStatus(preferredMethod);
    } else {
      setSelectedMethod('select');
    }
  };
  
  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <AnimatePresence mode="wait">
        {selectedMethod === 'select' && (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md mx-4"
          >
            <Card className="border-none shadow-xl bg-white/95 dark:bg-gray-900/95 backdrop-blur">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl flex items-center justify-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-purple-500" />
                  <span>Secure Authentication</span>
                </CardTitle>
                <CardDescription>
                  Choose your preferred authentication method to access your private journal
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <Tabs defaultValue="biometric" className="w-full">
                  <TabsList className="w-full mb-8">
                    <TabsTrigger value="biometric" className="flex-1">Biometric</TabsTrigger>
                    <TabsTrigger value="pin" className="flex-1">PIN</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                <div className="grid gap-4">
                  <Button
                    onClick={() => handleSelectMethod('face')}
                    className="w-full bg-blue-600 hover:bg-blue-700 py-6 justify-start"
                    size="lg"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mr-4">
                      <Scan className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Face ID</p>
                      <p className="text-xs text-blue-200">Authenticate with facial recognition</p>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => handleSelectMethod('fingerprint')}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 py-6 justify-start"
                    size="lg"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center mr-4">
                      <Fingerprint className="h-5 w-5 text-indigo-300" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Fingerprint</p>
                      <p className="text-xs text-indigo-200">Quick and secure fingerprint scan</p>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => handleSelectMethod('pin')}
                    className="w-full bg-purple-600 hover:bg-purple-700 py-6 justify-start"
                    size="lg"
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-4">
                      <KeyRound className="h-5 w-5 text-purple-300" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">PIN Code</p>
                      <p className="text-xs text-purple-200">Authentication with a secure PIN</p>
                    </div>
                  </Button>
                  
                  {showSkip && (
                    <Button
                      variant="ghost"
                      onClick={handleSkip}
                      className="mt-4"
                    >
                      Skip for now
                    </Button>
                  )}
                </div>
                
                <Alert variant="destructive" className="mt-6">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Journal Privacy</AlertTitle>
                  <AlertDescription className="text-xs">
                    Your journal entries are secured with military-grade encryption.
                    No one, not even us, can access your private entries.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </motion.div>
        )}
        
        {selectedMethod === 'face' && (
          <RealFaceIdAuth 
            onAuthenticate={handleAuthenticate} 
            onCancel={handleCancel}
            enrollmentMode={needsEnrollment}
          />
        )}
        
        {selectedMethod === 'fingerprint' && (
          <BiometricAuth 
            onAuthenticate={handleAuthenticate} 
            onSkip={handleCancel} 
          />
        )}
        
        {selectedMethod === 'pin' && (
          <PinAuth 
            onAuthenticate={handleAuthenticate} 
            onCancel={handleCancel} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuthManager; 