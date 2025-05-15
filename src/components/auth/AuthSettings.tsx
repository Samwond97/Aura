import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Fingerprint, 
  Scan, 
  KeyRound, 
  ShieldCheck, 
  AlertTriangle, 
  LockKeyhole,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff
} from "lucide-react";
import { toast } from "sonner";

interface AuthSettingsProps {
  onSave?: () => void;
}

const AuthSettings: React.FC<AuthSettingsProps> = ({ onSave }) => {
  const [preferredMethod, setPreferredMethod] = useState<string>('fingerprint');
  const [enableBiometrics, setEnableBiometrics] = useState(true);
  const [enablePin, setEnablePin] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [securityLevel, setSecurityLevel] = useState<'standard' | 'high' | 'maximum'>('standard');
  
  // PIN setup state
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [pinError, setPinError] = useState('');
  
  // Recovery question state
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  
  useEffect(() => {
    // Load saved preferences from localStorage
    const savedMethod = localStorage.getItem('preferredAuthMethod');
    if (savedMethod) {
      setPreferredMethod(savedMethod);
    }
    
    const bioEnabled = localStorage.getItem('journalBiometricEnabled') !== 'false';
    setEnableBiometrics(bioEnabled);
    
    const pinEnabled = localStorage.getItem('journalPinEnabled') === 'true';
    setEnablePin(pinEnabled);
    
    const savedEmail = localStorage.getItem('recoveryEmail');
    if (savedEmail) {
      setRecoveryEmail(savedEmail);
    }
    
    const savedSecurityLevel = localStorage.getItem('securityLevel');
    if (savedSecurityLevel && ['standard', 'high', 'maximum'].includes(savedSecurityLevel)) {
      setSecurityLevel(savedSecurityLevel as 'standard' | 'high' | 'maximum');
    }
    
    const savedQuestion = localStorage.getItem('securityQuestion');
    if (savedQuestion) {
      setSecurityQuestion(savedQuestion);
    }
  }, []);
  
  const handleSaveSettings = () => {
    // Save all settings to localStorage
    localStorage.setItem('preferredAuthMethod', preferredMethod);
    localStorage.setItem('journalBiometricEnabled', enableBiometrics.toString());
    localStorage.setItem('journalPinEnabled', enablePin.toString());
    localStorage.setItem('securityLevel', securityLevel);
    
    if (recoveryEmail) {
      localStorage.setItem('recoveryEmail', recoveryEmail);
    }
    
    if (securityQuestion && securityAnswer) {
      localStorage.setItem('securityQuestion', securityQuestion);
      localStorage.setItem('securityAnswer', securityAnswer);
    }
    
    toast.success("Authentication settings saved");
    
    if (onSave) {
      onSave();
    }
  };
  
  const handlePinToggle = (enabled: boolean) => {
    if (enabled) {
      setShowPinDialog(true);
    } else {
      setEnablePin(false);
      localStorage.removeItem('journalPin');
      localStorage.setItem('journalPinEnabled', 'false');
      toast.success("PIN authentication disabled");
    }
  };
  
  const handlePinSave = () => {
    setPinError('');
    
    // If PIN exists, validate current PIN
    const storedPin = localStorage.getItem('journalPin');
    if (storedPin && storedPin !== currentPin) {
      setPinError('Current PIN is incorrect');
      return;
    }
    
    // Validate new PIN
    if (newPin.length < 4) {
      setPinError('PIN must be at least 4 digits');
      return;
    }
    
    if (newPin !== confirmPin) {
      setPinError('PINs do not match');
      return;
    }
    
    // Save PIN
    localStorage.setItem('journalPin', newPin);
    localStorage.setItem('journalPinEnabled', 'true');
    setEnablePin(true);
    setShowPinDialog(false);
    toast.success("PIN saved successfully");
    
    // Reset form
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
  };
  
  const handleRecoverySave = () => {
    if (!recoveryEmail) {
      toast.error("Please enter a recovery email address");
      return;
    }
    
    if (!securityQuestion || !securityAnswer) {
      toast.error("Please complete the security question");
      return;
    }
    
    localStorage.setItem('recoveryEmail', recoveryEmail);
    localStorage.setItem('securityQuestion', securityQuestion);
    localStorage.setItem('securityAnswer', securityAnswer);
    
    setShowRecoveryDialog(false);
    toast.success("Recovery options saved");
  };
  
  const getSecurityLevelDescription = (level: string) => {
    switch (level) {
      case 'standard':
        return "Standard encryption with convenient access";
      case 'high':
        return "Enhanced protection with multi-factor authentication";
      case 'maximum':
        return "Military-grade encryption with strict verification";
      default:
        return "";
    }
  };
  
  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-500" />
            Authentication Methods
          </CardTitle>
          <CardDescription>
            Choose how you'll access your private journal entries
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Scan className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium">Face ID</h3>
                  <p className="text-sm text-muted-foreground">
                    Authenticate using facial recognition
                  </p>
                </div>
              </div>
              <Switch 
                checked={enableBiometrics && preferredMethod === 'face'} 
                onCheckedChange={(checked) => {
                  if (checked) {
                    setPreferredMethod('face');
                    setEnableBiometrics(true);
                  }
                }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Fingerprint className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-medium">Fingerprint</h3>
                  <p className="text-sm text-muted-foreground">
                    Quick and secure fingerprint scan
                  </p>
                </div>
              </div>
              <Switch 
                checked={enableBiometrics && preferredMethod === 'fingerprint'} 
                onCheckedChange={(checked) => {
                  if (checked) {
                    setPreferredMethod('fingerprint');
                    setEnableBiometrics(true);
                  }
                }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <KeyRound className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-medium">PIN Code</h3>
                  <p className="text-sm text-muted-foreground">
                    Secure access with a numeric PIN
                  </p>
                </div>
              </div>
              <Switch 
                checked={enablePin} 
                onCheckedChange={handlePinToggle}
              />
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <h3 className="font-medium mb-2">Preferred Authentication Method</h3>
            <RadioGroup 
              value={preferredMethod}
              onValueChange={setPreferredMethod}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="face" id="face" disabled={!enableBiometrics} />
                <Label htmlFor="face" className={!enableBiometrics ? "text-muted-foreground" : ""}>
                  Face ID (Primary)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fingerprint" id="fingerprint" disabled={!enableBiometrics} />
                <Label htmlFor="fingerprint" className={!enableBiometrics ? "text-muted-foreground" : ""}>
                  Fingerprint (Primary)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pin" id="pin" disabled={!enablePin} />
                <Label htmlFor="pin" className={!enablePin ? "text-muted-foreground" : ""}>
                  PIN Code (Primary)
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <LockKeyhole className="h-5 w-5 text-amber-500" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Configure the security level of your journal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="mb-2 block">Security Level</Label>
            <div className="space-y-4">
              <div 
                className={`p-4 rounded-lg border-2 cursor-pointer ${
                  securityLevel === 'standard' ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-transparent'
                }`}
                onClick={() => setSecurityLevel('standard')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                    <h3 className="font-medium">Standard</h3>
                  </div>
                  {securityLevel === 'standard' && (
                    <div className="text-xs bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 px-2 py-1 rounded-full">
                      Current
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1 ml-10">
                  {getSecurityLevelDescription('standard')}
                </p>
              </div>
              
              <div 
                className={`p-4 rounded-lg border-2 cursor-pointer ${
                  securityLevel === 'high' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : 'border-transparent'
                }`}
                onClick={() => setSecurityLevel('high')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <ShieldCheck className="h-4 w-4 text-blue-600" />
                    </div>
                    <h3 className="font-medium">High Security</h3>
                  </div>
                  {securityLevel === 'high' && (
                    <div className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full">
                      Current
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1 ml-10">
                  {getSecurityLevelDescription('high')}
                </p>
              </div>
              
              <div 
                className={`p-4 rounded-lg border-2 cursor-pointer ${
                  securityLevel === 'maximum' ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20' : 'border-transparent'
                }`}
                onClick={() => setSecurityLevel('maximum')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <LockKeyhole className="h-4 w-4 text-purple-600" />
                    </div>
                    <h3 className="font-medium">Maximum Security</h3>
                  </div>
                  {securityLevel === 'maximum' && (
                    <div className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 px-2 py-1 rounded-full">
                      Current
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1 ml-10">
                  {getSecurityLevelDescription('maximum')}
                </p>
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium">Auto-Lock Journal</h3>
                <p className="text-sm text-muted-foreground">
                  Automatically lock your journal after a period of inactivity
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Recovery Options</h3>
                <p className="text-sm text-muted-foreground">
                  Set up recovery methods in case you lose access
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowRecoveryDialog(true)}
              >
                {recoveryEmail ? 'Update' : 'Set Up'}
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t pt-4">
          <Button
            onClick={handleSaveSettings}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Save Security Settings
          </Button>
        </CardFooter>
      </Card>
      
      {/* PIN Setup Dialog */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Up PIN</DialogTitle>
            <DialogDescription>
              Create a secure PIN for accessing your journal
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {localStorage.getItem('journalPin') && (
              <div className="space-y-2">
                <Label htmlFor="current-pin" className="text-sm">
                  Current PIN
                </Label>
                <div className="relative">
                  <Input
                    id="current-pin"
                    type={showCurrentPin ? "text" : "password"}
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value)}
                    placeholder="Enter current PIN"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPin(!showCurrentPin)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showCurrentPin ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="new-pin" className="text-sm">
                New PIN
              </Label>
              <div className="relative">
                <Input
                  id="new-pin"
                  type={showNewPin ? "text" : "password"}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Enter new PIN (min 4 digits)"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPin(!showNewPin)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showNewPin ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-pin" className="text-sm">
                Confirm PIN
              </Label>
              <Input
                id="confirm-pin"
                type="password"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Confirm new PIN"
              />
            </div>
            
            {pinError && (
              <div className="text-sm text-red-500 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                <span>{pinError}</span>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPinDialog(false);
                setPinError('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePinSave}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save PIN
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Recovery Options Dialog */}
      <Dialog open={showRecoveryDialog} onOpenChange={setShowRecoveryDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recovery Options</DialogTitle>
            <DialogDescription>
              Set up methods to recover access to your journal
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="recovery-email" className="text-sm">
                Recovery Email
              </Label>
              <Input
                id="recovery-email"
                type="email"
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                placeholder="Enter your email address"
              />
              <p className="text-xs text-muted-foreground">
                We'll send recovery instructions to this email if you lose access
              </p>
            </div>
            
            <div className="pt-2 border-t">
              <h3 className="text-sm font-medium mb-2">Security Question</h3>
              
              <div className="space-y-2">
                <Label htmlFor="security-question" className="text-xs text-muted-foreground">
                  Question
                </Label>
                <Input
                  id="security-question"
                  value={securityQuestion}
                  onChange={(e) => setSecurityQuestion(e.target.value)}
                  placeholder="e.g., What was your first pet's name?"
                />
              </div>
              
              <div className="space-y-2 mt-3">
                <Label htmlFor="security-answer" className="text-xs text-muted-foreground">
                  Answer
                </Label>
                <Input
                  id="security-answer"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  placeholder="Your answer"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md text-sm">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
              <p className="text-muted-foreground">
                Keep your recovery information up to date. This is the only way to regain access 
                if you forget your PIN or change devices.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRecoveryDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRecoverySave}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save Recovery Options
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AuthSettings; 