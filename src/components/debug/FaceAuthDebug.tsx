import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle, XCircle, Trash, RefreshCw, Database, Lock, Clock, Video } from 'lucide-react';
import { toast } from 'sonner';
import { 
  clearFaceData,
  isFaceIdEnrolled,
  getFaceMetrics,
  hasExceededFailedAttempts,
  getLockoutRemainingTime,
  checkCameraAvailability
} from '@/utils/faceAuthUtils';
import { 
  resetFaceIdForTesting,
  simulateFailedAttempts,
  verifyAuthSystem,
  diagnoseCamera
} from '@/utils/faceAuthTest';

const FaceAuthDebug: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<ReturnType<typeof verifyAuthSystem>>();
  const [cameraAvailable, setCameraAvailable] = useState<boolean | null>(null);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutMinutes, setLockoutMinutes] = useState(0);
  const [cameraDiagnostics, setCameraDiagnostics] = useState<any>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  
  useEffect(() => {
    refreshStatus();
  }, []);
  
  const refreshStatus = async () => {
    // Check system status
    const status = verifyAuthSystem();
    setAuthStatus(status);
    
    // Check camera
    const hasCamera = await checkCameraAvailability();
    setCameraAvailable(hasCamera);
    
    // Check lockout
    const locked = hasExceededFailedAttempts();
    setIsLockedOut(locked);
    
    if (locked) {
      const remainingTime = getLockoutRemainingTime();
      setLockoutMinutes(remainingTime);
    } else {
      setLockoutMinutes(0);
    }
  };
  
  const handleResetAll = () => {
    resetFaceIdForTesting();
    toast.success('Face ID data has been reset');
    refreshStatus();
  };
  
  const handleSimulateFailedAttempts = (count: number) => {
    simulateFailedAttempts(count);
    toast.info(`Simulated ${count} failed authentication attempts`);
    refreshStatus();
  };
  
  const handleCameraDiagnostic = async () => {
    setIsDiagnosing(true);
    toast.info("Running camera diagnostic. This may take a few seconds...");
    
    try {
      const result = await diagnoseCamera();
      setCameraDiagnostics(result);
      
      if (result.success) {
        toast.success(`Camera initialized in ${result.timeToInitMs}ms`);
      } else {
        toast.error(`Camera diagnostic failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Error running camera diagnostic:", error);
      toast.error("Failed to run camera diagnostic");
    } finally {
      setIsDiagnosing(false);
    }
  };
  
  return (
    <Card className="w-full max-w-2xl mx-auto my-8 border-gray-300">
      <CardHeader className="bg-gray-50 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-bold">Face Authentication Debug</CardTitle>
            <CardDescription>Troubleshoot and test facial authentication</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={refreshStatus}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      
      <Tabs defaultValue="status">
        <TabsList className="bg-gray-100 p-1 mx-4 mt-2">
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="debug">Debug Tools</TabsTrigger>
          <TabsTrigger value="data">Stored Data</TabsTrigger>
        </TabsList>
        
        <TabsContent value="status" className="p-0">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-2 border rounded-md p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Enrollment Status</span>
                  {authStatus?.details.isEnrolled ? (
                    <Badge className="bg-green-500">Enrolled</Badge>
                  ) : (
                    <Badge className="bg-orange-500">Not Enrolled</Badge>
                  )}
                </div>
                {authStatus?.details.enrollmentDate && (
                  <div className="text-xs text-gray-500">
                    Enrolled: {new Date(authStatus.details.enrollmentDate).toLocaleString()}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col space-y-2 border rounded-md p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Camera Status</span>
                  {cameraAvailable === null ? (
                    <Badge className="bg-gray-500">Unknown</Badge>
                  ) : cameraAvailable ? (
                    <Badge className="bg-green-500">Available</Badge>
                  ) : (
                    <Badge className="bg-red-500">Unavailable</Badge>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {cameraAvailable === null ? 'Camera has not been checked' : 
                   cameraAvailable ? 'Camera is available for authentication' : 
                   'No camera detected for facial scanning'}
                </div>
              </div>
              
              <div className="flex flex-col space-y-2 border rounded-md p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Security Status</span>
                  {isLockedOut ? (
                    <Badge className="bg-red-500">Locked</Badge>
                  ) : (
                    <Badge className="bg-green-500">Unlocked</Badge>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {isLockedOut 
                    ? `Locked out for ${lockoutMinutes} more minutes`
                    : `Failed attempts: ${authStatus?.details.failedAttempts || 0}/5`
                  }
                </div>
              </div>
              
              <div className="flex flex-col space-y-2 border rounded-md p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Metrics Status</span>
                  {authStatus?.details.hasMetrics ? (
                    <Badge className="bg-green-500">Stored</Badge>
                  ) : (
                    <Badge className="bg-orange-500">None</Badge>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {authStatus?.details.hasMetrics 
                    ? 'Facial metrics are stored and available'
                    : 'No facial metrics have been stored'
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="debug" className="p-0">
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <div className="flex items-center text-amber-800 mb-2">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <span className="font-medium">Debug Controls</span>
                </div>
                <p className="text-sm text-amber-700">
                  These tools are for development and testing only. 
                  They simulate various authentication scenarios.
                </p>
              </div>
              
              <div className="border rounded-md p-4 space-y-3">
                <h3 className="font-medium text-sm">Camera Diagnostics</h3>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleCameraDiagnostic}
                    disabled={isDiagnosing}
                  >
                    <Video className="h-4 w-4 mr-1" />
                    {isDiagnosing ? 'Testing Camera...' : 'Run Camera Diagnostic'}
                  </Button>
                </div>
                
                {cameraDiagnostics && (
                  <div className="mt-2 bg-gray-50 p-3 rounded-md text-xs">
                    <div className="font-medium mb-1 flex items-center">
                      {cameraDiagnostics.success ? (
                        <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-500 mr-1" />
                      )}
                      Camera Test Results
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span> {cameraDiagnostics.success ? 'Success' : 'Failed'}
                    </div>
                    <div>
                      <span className="text-gray-500">Time to initialize:</span> {cameraDiagnostics.timeToInitMs}ms
                    </div>
                    {cameraDiagnostics.error && (
                      <div className="text-red-500">
                        Error: {cameraDiagnostics.error}
                      </div>
                    )}
                    {cameraDiagnostics.videoTracks && (
                      <div className="mt-1">
                        <div className="text-gray-500">Camera info:</div>
                        <div className="bg-gray-100 p-1 rounded mt-1 max-h-20 overflow-auto">
                          <pre>{JSON.stringify(cameraDiagnostics.videoTracks[0]?.label || 'No label available', null, 2)}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="border rounded-md p-4 space-y-3">
                <h3 className="font-medium text-sm">Reset Controls</h3>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleResetAll}
                  >
                    <Trash className="h-4 w-4 mr-1" />
                    Reset All Face ID Data
                  </Button>
                </div>
              </div>
              
              <div className="border rounded-md p-4 space-y-3">
                <h3 className="font-medium text-sm">Security Testing</h3>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleSimulateFailedAttempts(1)}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Simulate 1 Failed Attempt
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleSimulateFailedAttempts(3)}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Simulate 3 Failed Attempts
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleSimulateFailedAttempts(5)}
                  >
                    <Lock className="h-4 w-4 mr-1" />
                    Simulate Lockout (5 Failures)
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="data" className="p-0">
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-4">
              <div className="bg-gray-50 border rounded-md p-4 overflow-auto">
                <h3 className="font-medium text-sm mb-2 flex items-center">
                  <Database className="h-4 w-4 mr-1" />
                  Authentication Data
                </h3>
                <pre className="text-xs overflow-auto p-2 bg-gray-100 rounded max-h-40">
                  {JSON.stringify(authStatus?.details || {}, null, 2)}
                </pre>
              </div>
              
              {authStatus?.details.hasMetrics && (
                <div className="bg-gray-50 border rounded-md p-4 overflow-auto">
                  <h3 className="font-medium text-sm mb-2 flex items-center">
                    <Database className="h-4 w-4 mr-1" />
                    Stored Facial Metrics (Truncated)
                  </h3>
                  <pre className="text-xs overflow-auto p-2 bg-gray-100 rounded max-h-40">
                    {getFaceMetrics()?.substring(0, 100) + '...'}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>
      
      <CardFooter className="bg-gray-50 border-t border-gray-200 flex justify-between">
        <div className="text-xs text-gray-500">
          Use this panel for development and testing purposes only
        </div>
        {isLockedOut && (
          <div className="flex items-center text-xs text-red-600">
            <Clock className="h-3 w-3 mr-1" />
            Lockout active: {lockoutMinutes} min remaining
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default FaceAuthDebug; 