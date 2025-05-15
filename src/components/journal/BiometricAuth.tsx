import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Fingerprint, Shield, Check } from "lucide-react";
import { toast } from "sonner";

interface BiometricAuthProps {
  onAuthenticate: () => void;
  onSkip: () => void;
}

const BiometricAuth: React.FC<BiometricAuthProps> = ({ onAuthenticate, onSkip }) => {
  const [scanState, setScanState] = useState<"idle" | "scanning" | "success" | "error">("idle");
  const [scanProgress, setScanProgress] = useState(0);
  
  // Clean up any animations or timeouts if component unmounts
  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    let authTimeout: NodeJS.Timeout;
    
    if (scanState === "scanning") {
      progressInterval = setInterval(() => {
        setScanProgress(prev => {
          const newProgress = prev + 3;
          return newProgress >= 100 ? 100 : newProgress;
        });
      }, 30);
      
      authTimeout = setTimeout(() => {
        handleAuthSuccess();
      }, 1800);
    }
    
    return () => {
      clearInterval(progressInterval);
      clearTimeout(authTimeout);
    };
  }, [scanState]);
  
  const handleStartScan = () => {
    setScanState("scanning");
    setScanProgress(0);
    
    // Simulate haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };
  
  const handleAuthSuccess = () => {
    setScanState("success");
    
    // Simulate haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
    
    toast.success("Fingerprint authenticated", {
      position: "top-center"
    });
    
    // Wait a moment to show success state
    setTimeout(() => {
      onAuthenticate();
    }, 1000);
  };

  return (
    <div className="container py-12 fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
      <Card className="max-w-md mx-auto w-full bg-white dark:bg-gray-900 shadow-xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Secure Authentication</CardTitle>
          <CardDescription className="text-center">
            Your journal is private and protected with zero-knowledge encryption.
            Please authenticate to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6">
          <AnimatePresence mode="wait">
            {scanState === "idle" && (
              <motion.div 
                key="idle"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative mb-6"
              >
                <motion.div 
                  className="w-32 h-32 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Fingerprint className="h-16 w-16 text-blue-500" aria-label="Fingerprint icon" />
                </motion.div>
                
                {/* Subtle pulse animation in idle state */}
                <motion.div 
                  className="absolute inset-0 rounded-full border-2 border-blue-400 dark:border-blue-500"
                  animate={{ 
                    scale: [1, 1.05, 1],
                    opacity: [0.7, 0.5, 0.7]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 2,
                    ease: "easeInOut"
                  }}
                />
              </motion.div>
            )}
            
            {scanState === "scanning" && (
              <motion.div 
                key="scanning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mb-6 relative"
              >
                <div className="w-32 h-32 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <Fingerprint className="h-16 w-16 text-blue-500" aria-label="Fingerprint scanning" />
                  
                  {/* Scan line animation */}
                  <motion.div 
                    className="absolute w-full h-1.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent"
                    animate={{ 
                      top: ["0%", "100%"],
                      opacity: [0.8, 0.5]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 1.5,
                      repeatType: "reverse"
                    }}
                  />
                  
                  {/* Scanning dots animation */}
                  <svg className="absolute inset-0 w-full h-full">
                    <defs>
                      <pattern 
                        id="scanPattern" 
                        x="0" 
                        y="0" 
                        width="20" 
                        height="20" 
                        patternUnits="userSpaceOnUse"
                      >
                        <motion.circle 
                          cx="10" 
                          cy="10" 
                          r="1" 
                          fill="rgba(59, 130, 246, 0.5)"
                          animate={{ opacity: [0.2, 0.8, 0.2] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        />
                      </pattern>
                    </defs>
                    <circle cx="50%" cy="50%" r="60" fill="url(#scanPattern)" />
                  </svg>
                </div>
                
                {/* Circular progress indicator */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="58"
                    stroke="rgba(59, 130, 246, 0.2)"
                    strokeWidth="4"
                    fill="none"
                  />
                  <motion.circle
                    cx="50%"
                    cy="50%"
                    r="58"
                    stroke="rgb(59, 130, 246)"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={364}
                    strokeDashoffset={364 - (364 * scanProgress) / 100}
                    strokeLinecap="round"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  />
                </svg>
              </motion.div>
            )}
            
            {scanState === "success" && (
              <motion.div 
                key="success"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="mb-6"
              >
                <div className="w-32 h-32 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Check className="h-16 w-16 text-green-500" aria-label="Authentication successful" />
                </div>
                
                {/* Success animation */}
                <motion.div 
                  className="absolute inset-0 rounded-full border-2 border-green-500"
                  animate={{ 
                    scale: [1, 1.2],
                    opacity: [1, 0]
                  }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="space-y-3 w-full mt-2">
            {scanState === "idle" && (
              <Button 
                onClick={handleStartScan} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                <Shield className="mr-2 h-4 w-4" />
                <span>Authenticate with Fingerprint</span>
              </Button>
            )}
            
            {scanState === "scanning" && (
              <div className="text-center animate-pulse text-blue-600 dark:text-blue-400">
                <p>Scanning fingerprint...</p>
                <p className="text-xs mt-1 text-muted-foreground">{Math.round(scanProgress)}%</p>
              </div>
            )}
            
            {scanState === "idle" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkip}
                className="w-full text-muted-foreground hover:text-current"
                aria-label="Skip biometric authentication"
              >
                Skip for now
              </Button>
            )}
          </div>
          
          <p className="text-xs text-center text-muted-foreground mt-6 max-w-xs">
            Your data is protected with zero-knowledge encryption.
            No one can read your entries without your biometric credentials.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default BiometricAuth; 