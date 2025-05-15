import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScanFace, Shield, Check, XCircle, Camera, AlertTriangle, RefreshCw, Clock } from "lucide-react";
import { toast } from "sonner";
import {
  getFaceMetrics,
  storeFaceMetrics,
  requestCameraPermission,
  verifyFaceMatch,
  recordAuthAttempt,
  hasExceededFailedAttempts,
  getLockoutRemainingTime,
  checkCameraAvailability
} from "@/utils/faceAuthUtils";

interface FaceIdAuthProps {
  onAuthenticate: () => void;
  onCancel: () => void;
  enrollmentMode?: boolean;
}

const RealFaceIdAuth: React.FC<FaceIdAuthProps> = ({ 
  onAuthenticate, 
  onCancel,
  enrollmentMode = false 
}) => {
  // Authentication states
  const [scanningState, setScanningState] = useState<"idle" | "requesting" | "scanning" | "analyzing" | "success" | "error" | "denied" | "locked" | "unavailable">("idle");
  const [scanProgress, setScanProgress] = useState(0);
  const [enrollmentStep, setEnrollmentStep] = useState<number>(1);
  const [enrollmentComplete, setEnrollmentComplete] = useState(false);
  const [lockoutMinutes, setLockoutMinutes] = useState(0);
  
  // Face detection state
  const [faceDetected, setFaceDetected] = useState(false);
  const [facePosition, setFacePosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [faceMetrics, setFaceMetrics] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimeout = useRef<NodeJS.Timeout | null>(null);
  const scanInterval = useRef<NodeJS.Timeout | null>(null);
  const detectionInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Initial check for lockout
  useEffect(() => {
    const checkLockout = async () => {
      const cameraAvailable = await checkCameraAvailability();
      
      if (!cameraAvailable) {
        setScanningState("unavailable");
        setErrorMessage("No camera detected on this device");
        return;
      }
      
      if (hasExceededFailedAttempts()) {
        const remainingTime = getLockoutRemainingTime();
        setScanningState("locked");
        setLockoutMinutes(remainingTime);
        
        toast.error(`Too many failed attempts. Try again in ${remainingTime} minutes.`, {
          position: "top-center",
        });
      }
    };
    
    checkLockout();
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (scanTimeout.current) clearTimeout(scanTimeout.current);
      if (scanInterval.current) clearInterval(scanInterval.current);
      if (detectionInterval.current) clearInterval(detectionInterval.current);
    };
  }, []);
  
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };
  
  const startCameraCapture = async () => {
    setScanningState("requesting");
    setErrorMessage("");
    
    try {
      // Check camera availability
      const cameraAvailable = await checkCameraAvailability();
      if (!cameraAvailable) {
        setScanningState("unavailable");
        setErrorMessage("No camera detected on this device");
        return;
      }
      
      const stream = await requestCameraPermission();
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Set a timeout to detect if video fails to play
        const videoStartTimeout = setTimeout(() => {
          console.error("Video element failed to start playing");
          setScanningState("error");
          setErrorMessage("Timeout starting video. Please try again or use another browser.");
          
          // Clean up the stream if video fails to start
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
          }
        }, 5000);
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          // Clear the timeout since video started successfully
          clearTimeout(videoStartTimeout);
          
          videoRef.current?.play().then(() => {
            setScanningState("scanning");
            startFaceDetection();
          }).catch(err => {
            // Clear the timeout since we caught the error
            clearTimeout(videoStartTimeout);
            console.error("Error playing video:", err);
            setScanningState("error");
            setErrorMessage("Failed to start camera stream. Please ensure camera permissions are granted.");
          });
        };
        
        // Handle video errors
        videoRef.current.onerror = (e) => {
          console.error("Video error:", e);
          setScanningState("error");
          setErrorMessage("Error with camera stream. Please try again.");
        };
      }
    } catch (error: any) {
      console.error("Camera access error:", error);
      
      if (error.message.includes("denied")) {
        setScanningState("denied");
        setErrorMessage("Camera access denied. Please allow camera permission in your browser settings.");
      } else if (error.message.includes("in use")) {
        setScanningState("error");
        setErrorMessage("Camera is already in use by another application. Please close other applications using the camera.");
      } else if (error.message.includes("No camera found")) {
        setScanningState("unavailable");
        setErrorMessage("No camera found on this device");
      } else if (error.message.includes("Timeout") || error.message.includes("failed to start")) {
        setScanningState("error");
        setErrorMessage("Camera failed to start within the expected time. Try refreshing the page or restarting your browser.");
      } else {
        setScanningState("error");
        setErrorMessage(error.message || "Failed to access camera");
      }
      
      toast.error(error.message || "Failed to access camera", {
        position: "top-center",
      });
    }
  };
  
  const startFaceDetection = () => {
    // Check if stored facial metrics exist (for authentication mode)
    const storedMetrics = !enrollmentMode ? getFaceMetrics() : null;
    
    if (!enrollmentMode && !storedMetrics) {
      toast.error("No face data found. Please enroll first.", {
        position: "top-center",
      });
      setScanningState("error");
      setErrorMessage("No enrolled face data found");
      return;
    }
    
    // Reset face detection status
    setFaceDetected(false);
    setFaceMetrics(null);
    
    // Start the scan progress animation
    setScanProgress(0);
    scanInterval.current = setInterval(() => {
      setScanProgress(prev => {
        const newProgress = prev + 1;
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 30);
    
    // Start face detection
    detectionInterval.current = setInterval(() => {
      detectFace();
    }, 100);
  };
  
  const detectFace = () => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // In a real app, we would use a face-api library here
    // For this demo, we'll simulate face detection with a basic check
    // that the video is playing and has dimensions
    if (video.videoWidth > 0 && video.videoHeight > 0 && video.readyState >= 2) {
      // Simulate face detection with random position near center
      // (In a real app, this would be the actual detection result)
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const faceWidth = canvas.width * 0.4;
      const faceHeight = canvas.height * 0.6;
      
      const detectedPosition = {
        x: centerX - faceWidth / 2 + (Math.random() * 20 - 10),
        y: centerY - faceHeight / 2 + (Math.random() * 20 - 10),
        width: faceWidth + (Math.random() * 10 - 5),
        height: faceHeight + (Math.random() * 10 - 5)
      };
      
      setFacePosition(detectedPosition);
      
      // Draw face detection box
      context.strokeStyle = '#3b82f6';
      context.lineWidth = 3;
      context.strokeRect(
        detectedPosition.x, 
        detectedPosition.y, 
        detectedPosition.width, 
        detectedPosition.height
      );
      
      // Add face metrics indicators
      context.fillStyle = '#3b82f6';
      
      // Draw face points (simulated facial landmarks)
      const points = [
        { x: detectedPosition.x + detectedPosition.width * 0.3, y: detectedPosition.y + detectedPosition.height * 0.3 },  // left eye
        { x: detectedPosition.x + detectedPosition.width * 0.7, y: detectedPosition.y + detectedPosition.height * 0.3 },  // right eye
        { x: detectedPosition.x + detectedPosition.width * 0.5, y: detectedPosition.y + detectedPosition.height * 0.5 },  // nose
        { x: detectedPosition.x + detectedPosition.width * 0.3, y: detectedPosition.y + detectedPosition.height * 0.7 },  // left mouth
        { x: detectedPosition.x + detectedPosition.width * 0.7, y: detectedPosition.y + detectedPosition.height * 0.7 }   // right mouth
      ];
      
      points.forEach(point => {
        context.beginPath();
        context.arc(point.x, point.y, 3, 0, Math.PI * 2);
        context.fill();
      });
      
      // Draw connections between points
      context.beginPath();
      context.moveTo(points[0].x, points[0].y);
      points.slice(1).forEach(point => {
        context.lineTo(point.x, point.y);
      });
      context.lineTo(points[0].x, points[0].y);
      context.strokeStyle = 'rgba(59, 130, 246, 0.5)';
      context.lineWidth = 1;
      context.stroke();
      
      if (!faceDetected) {
        setFaceDetected(true);
        
        // Generate metrics based on points (in real app, this would be actual face embeddings)
        const metrics = points.map(p => `${p.x.toFixed(2)}-${p.y.toFixed(2)}`).join('|');
        setFaceMetrics(metrics);
      }
    } else {
      setFaceDetected(false);
    }
  };
  
  const handleStartScan = () => {
    startCameraCapture();
  };
  
  const processFaceAuthentication = () => {
    if (!faceMetrics) return;
    
    // Clear detection interval
    if (detectionInterval.current) {
      clearInterval(detectionInterval.current);
      detectionInterval.current = null;
    }
    
    // Clear scan interval
    if (scanInterval.current) {
      clearInterval(scanInterval.current);
      scanInterval.current = null;
    }
    
    setScanningState("analyzing");
    
    // For enrollment mode
    if (enrollmentMode) {
      if (enrollmentStep < 3) {
        // For multiple enrollment steps (capturing different angles)
        setTimeout(() => {
          setEnrollmentStep(prev => prev + 1);
          setScanningState("scanning");
          startFaceDetection();
        }, 1000);
      } else {
        // Complete enrollment
        storeFaceMetrics(faceMetrics);
        
        setTimeout(() => {
          setScanningState("success");
          setEnrollmentComplete(true);
          
          // Simulate haptic feedback if available
          if (navigator.vibrate) {
            navigator.vibrate(200);
          }
          
          toast.success("Face ID enrollment successful", {
            position: "top-center",
          });
          
          // Wait a moment before redirecting
          setTimeout(() => {
            stopCamera();
            onAuthenticate();
          }, 1500);
        }, 1000);
      }
      return;
    }
    
    // For authentication mode
    const storedMetrics = getFaceMetrics();
    
    if (!storedMetrics) {
      setScanningState("error");
      setErrorMessage("No enrolled face data found");
      toast.error("No enrolled face data found", {
        position: "top-center",
      });
      return;
    }
    
    // Verify the face match
    const isMatch = verifyFaceMatch(faceMetrics);
    
    // Record this authentication attempt
    recordAuthAttempt(isMatch);
    
    setTimeout(() => {
      if (isMatch) {
        setScanningState("success");
        
        // Simulate haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(200);
        }
        
        toast.success("Face ID authentication successful", {
          position: "top-center",
        });
        
        // Wait a moment before redirecting
        setTimeout(() => {
          stopCamera();
          onAuthenticate();
        }, 1000);
      } else {
        setScanningState("error");
        setErrorMessage("Face ID authentication failed. Please try again.");
        
        // Check if this failure caused a lockout
        if (hasExceededFailedAttempts()) {
          const remainingTime = getLockoutRemainingTime();
          setScanningState("locked");
          setLockoutMinutes(remainingTime);
          
          toast.error(`Too many failed attempts. Try again in ${remainingTime} minutes.`, {
            position: "top-center",
          });
        } else {
          toast.error("Face ID authentication failed", {
            position: "top-center",
          });
        }
      }
    }, 1000);
  };
  
  // When scan progress reaches 100%, process authentication
  useEffect(() => {
    if (scanProgress >= 100 && faceDetected && faceMetrics && scanningState === "scanning") {
      processFaceAuthentication();
    }
  }, [scanProgress, faceDetected, faceMetrics, scanningState]);
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="max-w-md w-full mx-4 bg-black/80 border-gray-800 text-white shadow-[0_0_15px_rgba(0,123,255,0.5)]">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl">
            {enrollmentMode ? "Face ID Setup" : "Face ID"}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {scanningState === "idle" && (enrollmentMode 
              ? "Let's set up Face ID to protect your journal" 
              : "Look directly at the camera to authenticate"
            )}
            {scanningState === "requesting" && "Requesting camera access..."}
            {scanningState === "scanning" && (enrollmentMode 
              ? `Step ${enrollmentStep}/3: ${
                  enrollmentStep === 1 ? "Look straight ahead" : 
                  enrollmentStep === 2 ? "Slightly turn your head" : 
                  "One more scan..."
                }` 
              : "Securely scanning..."
            )}
            {scanningState === "analyzing" && "Analyzing facial data..."}
            {scanningState === "success" && (enrollmentMode 
              ? "Face ID enrollment complete" 
              : "Authentication complete"
            )}
            {scanningState === "error" && "Authentication failed"}
            {scanningState === "denied" && "Camera access denied"}
            {scanningState === "locked" && `Account temporarily locked (${lockoutMinutes} min)`}
            {scanningState === "unavailable" && "Camera unavailable"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex flex-col items-center py-8 px-4">
          <AnimatePresence mode="wait">
            {scanningState === "idle" && (
              <motion.div 
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mb-6"
              >
                <div className="w-40 h-40 rounded-full border-2 border-blue-500 flex items-center justify-center relative">
                  <ScanFace className="h-24 w-24 text-blue-400" />
                  
                  {/* Subtle hint dots */}
                  <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-blue-400 rounded-full opacity-50"></div>
                    <div className="absolute top-1/4 right-1/4 w-1 h-1 bg-blue-400 rounded-full opacity-50"></div>
                    <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-blue-400 rounded-full opacity-50"></div>
                    <div className="absolute bottom-1/3 right-1/3 w-1 h-1 bg-blue-400 rounded-full opacity-50"></div>
                  </div>
                </div>
              </motion.div>
            )}
            
            {(scanningState === "scanning" || scanningState === "analyzing") && (
              <motion.div 
                key="scanning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mb-6 relative"
              >
                <div className="w-64 h-64 overflow-hidden relative border-2 border-blue-500 rounded-lg flex items-center justify-center bg-black">
                  {/* Video element */}
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="absolute inset-0 object-cover w-full h-full"
                  />
                  
                  {/* Hidden canvas for face detection */}
                  <canvas ref={canvasRef} className="absolute inset-0 z-10" />
                  
                  {/* Face detection overlay */}
                  <div className="absolute inset-0 z-10">
                    {/* Scanning guide overlay */}
                    <div className="absolute inset-0">
                      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path 
                          d="M 10,10 L 20,10 M 10,10 L 10,20 M 90,10 L 80,10 M 90,10 L 90,20 M 10,90 L 20,90 M 10,90 L 10,80 M 90,90 L 80,90 M 90,90 L 90,80" 
                          stroke="rgba(59, 130, 246, 0.8)" 
                          strokeWidth="1" 
                          fill="none"
                        />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Scanning line animation */}
                  <motion.div 
                    className="absolute top-0 left-0 right-0 h-1 bg-blue-400 z-20"
                    animate={{ 
                      top: ["0%", "100%", "0%"],
                      opacity: [0.8, 1, 0.8]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 2,
                      ease: "linear"
                    }}
                  />
                  
                  {/* Holographic overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-400/10 to-blue-600/10 z-0"></div>
                </div>
                
                {/* Progress circle */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="82"
                    stroke="rgba(59, 130, 246, 0.2)"
                    strokeWidth="4"
                    fill="none"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="82"
                    stroke="rgba(59, 130, 246, 0.8)"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={516}
                    strokeDashoffset={516 - (516 * scanProgress) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                
                {enrollmentMode && (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                    {[1, 2, 3].map(step => (
                      <div 
                        key={step} 
                        className={`w-2 h-2 rounded-full ${
                          enrollmentStep >= step 
                            ? 'bg-blue-500' 
                            : 'bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}
            
            {scanningState === "success" && (
              <motion.div 
                key="success"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="mb-6"
              >
                <div className="w-40 h-40 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
                  <Check className="h-24 w-24 text-green-400" />
                  
                  {/* Success light rays */}
                  <motion.div 
                    className="absolute inset-0 rounded-full bg-green-400/30"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.2, 0.5, 0.2]
                    }}
                    transition={{ 
                      repeat: Infinity,
                      duration: 2,
                      ease: "easeInOut"
                    }}
                  />
                </div>
              </motion.div>
            )}
            
            {(scanningState === "error" || scanningState === "denied" || scanningState === "unavailable") && (
              <motion.div 
                key="error"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="mb-6"
              >
                <div className="w-40 h-40 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center">
                  <XCircle className="h-24 w-24 text-red-400" />
                </div>
                {errorMessage && (
                  <p className="text-center text-sm text-red-400 mt-4">
                    {errorMessage}
                  </p>
                )}
                {scanningState === "error" && errorMessage.includes("Timeout") && (
                  <div className="mt-2 text-center text-xs text-gray-400">
                    <p>Common solutions:</p>
                    <ul className="list-disc list-inside mt-1">
                      <li>Refresh the page</li>
                      <li>Restart your browser</li>
                      <li>Close other apps using your camera</li>
                      <li>Try a different browser</li>
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
            
            {scanningState === "locked" && (
              <motion.div 
                key="locked"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="mb-6"
              >
                <div className="w-40 h-40 rounded-full bg-orange-500/20 border-2 border-orange-500 flex items-center justify-center">
                  <Clock className="h-24 w-24 text-orange-400" />
                </div>
                <p className="text-center text-sm text-orange-400 mt-4">
                  Too many failed attempts.<br />
                  Try again in {lockoutMinutes} minutes.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="space-y-4 w-full mt-4">
            {scanningState === "idle" && (
              <Button 
                onClick={handleStartScan}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                {enrollmentMode ? (
                  <>
                    <Camera className="mr-2 h-4 w-4" />
                    Set Up Face ID
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Authenticate with Face ID
                  </>
                )}
              </Button>
            )}
            
            {scanningState === "scanning" && (
              <motion.p 
                className="text-center text-blue-400 text-sm"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                {Math.round(scanProgress)}% complete
              </motion.p>
            )}
            
            {(scanningState === "error" || scanningState === "denied" || scanningState === "unavailable") && (
              <Button 
                onClick={handleStartScan}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}
            
            {scanningState !== "success" && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onCancel}
                className="w-full text-gray-400 hover:text-white hover:bg-transparent"
              >
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealFaceIdAuth; 