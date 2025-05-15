import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LockKeyhole, Unlock, X } from "lucide-react";
import { toast } from "sonner";

interface PinAuthProps {
  onAuthenticate: () => void;
  onCancel: () => void;
  pinLength?: number;
}

const PinAuth: React.FC<PinAuthProps> = ({ 
  onAuthenticate, 
  onCancel,
  pinLength = 4 
}) => {
  const [pin, setPin] = useState<string[]>(Array(pinLength).fill(''));
  const [activeInput, setActiveInput] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // For actual implementation, this would be fetched from secure storage
  const storedPin = useRef(localStorage.getItem('journalPin') || '1234');

  useEffect(() => {
    // Focus the first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);
  
  const handlePinChange = (value: string, index: number) => {
    // Only allow digits
    if (!/^\d?$/.test(value)) return;
    
    // Update pin digits
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    
    // Move to next input if value was entered
    if (value && index < pinLength - 1) {
      setActiveInput(index + 1);
      inputRefs.current[index + 1]?.focus();
    }
    
    // Check if pin is complete
    if (value && index === pinLength - 1) {
      verifyPin(newPin.join(''));
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    // Move to previous input on backspace if current is empty
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      setActiveInput(index - 1);
      setPin(prev => {
        const newPin = [...prev];
        newPin[index - 1] = '';
        return newPin;
      });
      inputRefs.current[index - 1]?.focus();
    }
    
    // Handle enter key for verification
    if (e.key === 'Enter') {
      verifyPin(pin.join(''));
    }
  };
  
  const verifyPin = (enteredPin: string) => {
    setIsVerifying(true);
    
    // Simulate verification process
    setTimeout(() => {
      if (enteredPin === storedPin.current) {
        setIsSuccess(true);
        setIsError(false);
        
        // Simulate haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(100);
        }
        
        toast.success("PIN verified successfully", {
          position: "top-center"
        });
        
        // Wait a moment for animation
        setTimeout(() => {
          onAuthenticate();
        }, 800);
      } else {
        setIsError(true);
        setIsSuccess(false);
        
        // Simulate haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate([20, 30, 20]);
        }
        
        toast.error("Incorrect PIN", {
          position: "top-center"
        });
        
        // Clear pin and focus first input after error
        setTimeout(() => {
          setPin(Array(pinLength).fill(''));
          setActiveInput(0);
          setIsError(false);
          setIsVerifying(false);
          inputRefs.current[0]?.focus();
        }, 1200);
      }
    }, 500);
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="max-w-md w-full mx-4 bg-white dark:bg-gray-900">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <LockKeyhole className="h-5 w-5 text-purple-500" />
            <span>PIN Authentication</span>
          </CardTitle>
          <CardDescription>
            Enter your secure PIN to access your journal
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex flex-col items-center py-6">
          <AnimatePresence mode="wait">
            {!isSuccess && !isVerifying && (
              <motion.div
                key="pin-entry"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-8"
              >
                <div className="flex gap-2 items-center justify-center">
                  {Array.from({ length: pinLength }).map((_, index) => (
                    <motion.div
                      key={index}
                      animate={isError ? { 
                        x: [0, -5, 5, -5, 5, 0],
                        transition: { duration: 0.4 }
                      } : {}}
                      className="relative"
                    >
                      <Input
                        ref={el => inputRefs.current[index] = el}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={pin[index]}
                        onChange={e => handlePinChange(e.target.value, index)}
                        onKeyDown={e => handleKeyDown(e, index)}
                        className={`w-12 h-14 text-center text-xl font-medium ${
                          activeInput === index ? 'border-purple-500 ring-2 ring-purple-200' : ''
                        } ${
                          isError ? 'border-red-500 animate-shake' : ''
                        }`}
                        autoComplete="off"
                      />
                      {pin[index] && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        >
                          <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
            
            {isVerifying && !isSuccess && (
              <motion.div
                key="verifying"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mb-8 py-4"
              >
                <motion.div 
                  className="w-16 h-16 border-4 border-t-purple-600 border-purple-200 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 1, 
                    ease: "linear" 
                  }}
                />
                <p className="text-center mt-4 text-sm">Verifying PIN...</p>
              </motion.div>
            )}
            
            {isSuccess && (
              <motion.div
                key="success"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="mb-8 text-center"
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Unlock className="h-8 w-8 text-green-600" />
                </div>
                <p className="mt-4 font-medium text-green-600 dark:text-green-400">Authentication Successful</p>
              </motion.div>
            )}
          </AnimatePresence>
          
          {!isSuccess && !isVerifying && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onCancel}
              className="text-sm text-gray-500"
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PinAuth; 