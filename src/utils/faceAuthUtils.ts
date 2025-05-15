/**
 * Face Authentication Utilities
 * 
 * This module provides helper functions for face authentication, including
 * checking enrollment status, managing face metrics, and simulating facial recognition.
 */

/**
 * Check if face ID enrollment is complete for the current user
 */
export const isFaceIdEnrolled = (): boolean => {
  return localStorage.getItem('faceIdEnrolled') === 'true';
};

/**
 * Store face metrics from an enrollment process
 */
export const storeFaceMetrics = (metrics: string): void => {
  localStorage.setItem('faceIdMetrics', metrics);
  localStorage.setItem('faceIdEnrolled', 'true');
  
  // Record the date of enrollment
  localStorage.setItem('faceIdEnrolledDate', new Date().toISOString());
};

/**
 * Retrieve stored face metrics
 */
export const getFaceMetrics = (): string | null => {
  return localStorage.getItem('faceIdMetrics');
};

/**
 * Clear all facial recognition data
 */
export const clearFaceData = (): void => {
  localStorage.removeItem('faceIdMetrics');
  localStorage.removeItem('faceIdEnrolled');
  localStorage.removeItem('faceIdEnrolledDate');
  localStorage.removeItem('faceIdAttempts');
};

/**
 * Set Face ID as the preferred authentication method
 */
export const setFaceIdAsPreferred = (): void => {
  localStorage.setItem('preferredAuthMethod', 'face');
};

/**
 * Check if metrics match with stored metrics
 * In a real application, this would perform actual facial comparison
 */
export const verifyFaceMatch = (currentMetrics: string): boolean => {
  const storedMetrics = getFaceMetrics();
  
  if (!storedMetrics || !currentMetrics) {
    return false;
  }
  
  // In a real app, we would compare the facial features mathematically
  // For this demo, we'll implement a simple comparison to simulate facial matching
  // by comparing the first three points which represent key facial landmarks
  
  const storedPoints = storedMetrics.split('|').slice(0, 3);
  const currentPoints = currentMetrics.split('|').slice(0, 3);
  
  // Make sure we have enough points to compare
  if (storedPoints.length < 3 || currentPoints.length < 3) {
    return false;
  }
  
  // Calculate similarity between points
  let matchScore = 0;
  for (let i = 0; i < 3; i++) {
    const [storedX, storedY] = storedPoints[i].split('-').map(parseFloat);
    const [currentX, currentY] = currentPoints[i].split('-').map(parseFloat);
    
    // Calculate distance between points
    const distance = Math.sqrt(
      Math.pow(storedX - currentX, 2) + Math.pow(storedY - currentY, 2)
    );
    
    // Points are considered matching if they're close enough
    if (distance < 15) { // Adjust threshold as needed
      matchScore++;
    }
  }
  
  // Match if at least 2 out of 3 points are similar
  return matchScore >= 2;
};

/**
 * Request camera permissions with timeout
 * This prevents the request from hanging indefinitely
 */
const requestCameraWithTimeout = async (constraints: MediaStreamConstraints, timeoutMs: number = 10000): Promise<MediaStream> => {
  return new Promise<MediaStream>(async (resolve, reject) => {
    // Set a timeout to prevent hanging if camera access takes too long
    const timeout = setTimeout(() => {
      reject(new Error("Timeout starting video source"));
    }, timeoutMs);
    
    try {
      // Request camera stream
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      clearTimeout(timeout);
      resolve(stream);
    } catch (error) {
      clearTimeout(timeout);
      reject(error);
    }
  });
};

/**
 * Request camera permissions for facial recognition
 */
export const requestCameraPermission = async (): Promise<MediaStream> => {
  try {
    // Check if camera is available before requesting access
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Camera not available on this device or browser");
    }
    
    // Request camera with optimal settings for face detection
    const constraints = {
      video: {
        facingMode: "user",
        width: { ideal: 640 },
        height: { ideal: 480 }
      },
      audio: false
    };
    
    // Use the timeout wrapper for camera access
    const stream = await requestCameraWithTimeout(constraints, 8000);
    
    // Verify that the stream contains video tracks
    if (!stream.getVideoTracks().length) {
      throw new Error("No video tracks available in the camera stream");
    }
    
    // Check if any video track is already ended or muted
    const videoTracks = stream.getVideoTracks();
    if (videoTracks.some(track => !track.enabled || track.muted || track.readyState !== 'live')) {
      throw new Error("Camera track is not in a usable state");
    }
    
    return stream;
  } catch (error: any) {
    console.error("Camera access error:", error);
    
    // Handle different types of camera errors
    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
      throw new Error("Camera permission denied by user");
    } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      throw new Error("No camera found on this device");
    } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
      throw new Error("Camera is already in use by another application");
    } else if (error.name === "OverconstrainedError" || error.name === "ConstraintNotSatisfiedError") {
      throw new Error("Camera doesn't meet the required constraints");
    } else if (error.message === "Timeout starting video source") {
      throw new Error("Camera failed to start within the expected time");
    } else {
      throw new Error(`Camera access failed: ${error.message || "Unknown error"}`);
    }
  }
};

/**
 * Record authentication attempt (for security logging)
 */
export const recordAuthAttempt = (success: boolean): void => {
  const attempts = JSON.parse(localStorage.getItem('faceIdAttempts') || '[]');
  attempts.push({
    timestamp: new Date().toISOString(),
    success,
    userAgent: navigator.userAgent
  });
  
  // Keep only the last 20 attempts
  if (attempts.length > 20) {
    attempts.shift();
  }
  
  localStorage.setItem('faceIdAttempts', JSON.stringify(attempts));
};

/**
 * Check if the user has exceeded failed authentication attempts
 */
export const hasExceededFailedAttempts = (): boolean => {
  const attempts = JSON.parse(localStorage.getItem('faceIdAttempts') || '[]');
  
  // Get attempts from the last 30 minutes
  const recentAttempts = attempts.filter((attempt: any) => {
    const timestamp = new Date(attempt.timestamp);
    const now = new Date();
    const diffMinutes = (now.getTime() - timestamp.getTime()) / (1000 * 60);
    return diffMinutes < 30;
  });
  
  // Count failed attempts
  const failedAttempts = recentAttempts.filter((attempt: any) => !attempt.success).length;
  
  // Limit to 5 failed attempts in 30 minutes
  return failedAttempts >= 5;
};

/**
 * Calculate remaining lockout time in minutes
 */
export const getLockoutRemainingTime = (): number => {
  const attempts = JSON.parse(localStorage.getItem('faceIdAttempts') || '[]');
  
  // Get failed attempts from the last 30 minutes
  const recentFailedAttempts = attempts
    .filter((attempt: any) => !attempt.success)
    .map((attempt: any) => new Date(attempt.timestamp).getTime())
    .sort((a: number, b: number) => b - a); // Sort descending
  
  if (recentFailedAttempts.length < 5) {
    return 0; // Not locked out
  }
  
  // Get the timestamp of the 5th most recent failed attempt
  const fifthFailedAttempt = recentFailedAttempts[4];
  
  // Calculate when the lockout will end (30 minutes after the 5th failed attempt)
  const lockoutEnd = fifthFailedAttempt + (30 * 60 * 1000);
  const now = Date.now();
  const remainingMs = lockoutEnd - now;
  
  return remainingMs > 0 ? Math.ceil(remainingMs / (60 * 1000)) : 0;
};

/**
 * Check camera availability before authentication
 */
export const checkCameraAvailability = async (): Promise<boolean> => {
  try {
    // Check if mediaDevices API is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      console.error("MediaDevices API not available");
      return false;
    }
    
    // Enumerate all available media devices
    const devices = await navigator.mediaDevices.enumerateDevices();
    
    // Check if any video input devices (cameras) are available
    return devices.some(device => device.kind === 'videoinput');
  } catch (error) {
    console.error("Error checking camera availability:", error);
    return false;
  }
}; 