/**
 * Face Authentication Testing Utilities
 * 
 * This file contains helper functions for testing the facial authentication flow.
 * It's intended to help developers verify that the authentication system works correctly.
 */

import { clearFaceData, setFaceIdAsPreferred } from './faceAuthUtils';

/**
 * Reset face ID enrollment for testing
 * Call this function to clear all stored face data and start fresh
 */
export const resetFaceIdForTesting = (): void => {
  console.log('Resetting Face ID data for testing');
  clearFaceData();
};

/**
 * Simulate a fresh installation without any facial data
 */
export const simulateFirstTimeUser = (): void => {
  console.log('Simulating first-time user');
  localStorage.clear();
};

/**
 * Simulate camera availability status
 * @param isAvailable Whether the camera should appear available
 */
export const simulateCameraAvailability = (isAvailable: boolean): void => {
  localStorage.setItem('test_cameraAvailable', isAvailable ? 'true' : 'false');
};

/**
 * Simulate a specific number of failed authentication attempts
 * @param count Number of failed attempts to simulate
 */
export const simulateFailedAttempts = (count: number): void => {
  const now = new Date();
  const attempts = [];
  
  // Create the specified number of failed attempts in the last 10 minutes
  for (let i = 0; i < count; i++) {
    const timestamp = new Date(now.getTime() - (i * 60000)); // Each attempt 1 minute apart
    attempts.push({
      timestamp: timestamp.toISOString(),
      success: false,
      userAgent: navigator.userAgent
    });
  }
  
  localStorage.setItem('faceIdAttempts', JSON.stringify(attempts));
  console.log(`Simulated ${count} failed authentication attempts`);
};

/**
 * Verify that the facial authentication system is correctly checking auth requirements
 */
export const verifyAuthSystem = (): { status: string, details: Record<string, any> } => {
  const isEnrolled = localStorage.getItem('faceIdEnrolled') === 'true';
  const metrics = localStorage.getItem('faceIdMetrics');
  const attempts = JSON.parse(localStorage.getItem('faceIdAttempts') || '[]');
  const preferredAuthMethod = localStorage.getItem('preferredAuthMethod');
  
  // Count recent failed attempts
  const recentFailedAttempts = attempts.filter((attempt: any) => {
    const timestamp = new Date(attempt.timestamp);
    const now = new Date();
    const diffMinutes = (now.getTime() - timestamp.getTime()) / (1000 * 60);
    return diffMinutes < 30 && !attempt.success;
  }).length;
  
  return {
    status: isEnrolled ? 'enrolled' : 'not-enrolled',
    details: {
      isEnrolled,
      hasMetrics: !!metrics,
      failedAttempts: recentFailedAttempts,
      preferredAuthMethod,
      enrollmentDate: localStorage.getItem('faceIdEnrolledDate'),
      totalAttempts: attempts.length
    }
  };
};

/**
 * Set up enrollment for quick testing
 */
export const setupQuickTest = (): void => {
  // Clear existing data
  clearFaceData();
  
  // Set Face ID as preferred
  setFaceIdAsPreferred();
  
  console.log('Ready for quick test. Run enrollment flow next.');
};

/**
 * Diagnostic test for camera initialization
 * This function tests camera access and measures how long it takes to initialize
 * Useful for diagnosing timeout issues
 */
export const diagnoseCamera = async (): Promise<{
  success: boolean;
  timeToInitMs: number | null;
  error?: string;
  videoTracks?: MediaStreamTrack[];
}> => {
  console.log('Starting camera diagnostic test...');
  
  const startTime = performance.now();
  let stream: MediaStream | null = null;
  
  try {
    // Check if mediaDevices API is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('MediaDevices API not available');
    }
    
    // Try to access the camera
    stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    });
    
    const endTime = performance.now();
    const initTime = endTime - startTime;
    
    // Get video track information
    const videoTracks = stream.getVideoTracks();
    const trackInfo = videoTracks.map(track => ({
      label: track.label,
      id: track.id,
      enabled: track.enabled,
      muted: track.muted,
      readyState: track.readyState,
      constraints: track.getConstraints(),
      settings: track.getSettings()
    }));
    
    console.log(`Camera initialized successfully in ${initTime.toFixed(0)}ms`);
    console.log('Video tracks:', trackInfo);
    
    // Stop the stream
    stream.getTracks().forEach(track => track.stop());
    
    return {
      success: true,
      timeToInitMs: Math.round(initTime),
      videoTracks: trackInfo
    };
  } catch (error: any) {
    const endTime = performance.now();
    console.error('Camera diagnostic failed:', error);
    
    return {
      success: false,
      timeToInitMs: Math.round(endTime - startTime),
      error: error.message || 'Unknown camera error'
    };
  } finally {
    // Ensure we clean up the stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  }
};

export default {
  resetFaceIdForTesting,
  simulateFirstTimeUser,
  simulateCameraAvailability,
  simulateFailedAttempts,
  verifyAuthSystem,
  setupQuickTest,
  diagnoseCamera
}; 