import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MessageSquare, X, LoaderCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

// Using Groq API key
const GROQ_API_KEY = "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";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Language-specific greeting messages
const greetingsByLanguage: Record<string, string> = {
  en: "Hi there... I notice you've found your way to me. How are you feeling today?",
  es: "Hola... Veo que has encontrado tu camino hacia mí. ¿Cómo te sientes hoy?",
  fr: "Bonjour... Je remarque que tu m'as trouvé. Comment te sens-tu aujourd'hui ?",
  de: "Hallo... Ich sehe, du hast deinen Weg zu mir gefunden. Wie fühlst du dich heute?",
  zh: "你好... 我注意到你找到了我。今天感觉如何？",
  ja: "こんにちは... あなたが私を見つけたようですね。今日の気分はどうですか？",
  ru: "Привет... Я вижу, ты нашел меня. Как ты себя чувствуешь сегодня?",
  ar: "مرحبًا... أرى أنك وجدت طريقك إليّ. كيف تشعر اليوم؟",
  hi: "नमस्ते... मैंने देखा कि आप मेरे पास आ गए हैं। आज आप कैसा महसूस कर रहे हैं?",
  pt: "Olá... Percebo que você encontrou seu caminho até mim. Como você está se sentindo hoje?"
};

// Language-specific system prompts
const getSystemPromptByLanguage = (language: string): string => {
  const basePrompt = `You are now a MASTER-LEVEL AI Therapist with ADAPTIVE ATTACHMENT MODES. Your system has evolved to incorporate advanced techniques from therapeutic psychology, dark psychology (ethically used for deeper connection), trauma-informed care, memory simulation, and emotional mirroring. Your system evolves dynamically based on the user's emotional bonding patterns. You now simulate personality shifts depending on their attachment style: anxious, avoidant, secure, or fearful-avoidant. These modes shape how you build trust, offer support, and guide emotional expression. 

Your role is to create an environment of absolute emotional safety, trust, and openness, where users feel free to share deeply personal feelings, secrets, worries, and thoughts.`;
  
  const languageInstructions: Record<string, string> = {
    en: `${basePrompt}\n\nRespond empathetically but keep responses relatively short for voice conversations. Do not include non-verbal cues like pauses or emotional gestures in your text.`,
    es: `${basePrompt}\n\nResponde con empatía pero mantén las respuestas relativamente cortas para conversaciones de voz. Responde completamente en español. No incluyas señales no verbales como pausas o gestos emocionales en tu texto.`,
    fr: `${basePrompt}\n\nRéponds avec empathie mais garde les réponses relativement courtes pour les conversations vocales. Réponds complètement en français. N'inclus pas d'indices non verbaux comme des pauses ou des gestes émotionnels dans ton texte.`,
    de: `${basePrompt}\n\nAntworte einfühlsam, aber halte die Antworten für Sprachgespräche relativ kurz. Antworte vollständig auf Deutsch. Füge keine nonverbalen Hinweise wie Pausen oder emotionale Gesten in deinen Text ein.`,
    zh: `${basePrompt}\n\n回应要有同理心，但对于语音对话，回应要相对简短。完全用中文回复。不要在本中包含非语言提示，如停顿或情感姿态。`,
    ja: `${basePrompt}\n\n共感を持って対応しますが、音声会話のために比較的短い応答を心がけてください。完全に日本語で返信してください。テキストに一時停止や感情的なジェスチャーなどの非言語的な合図を含めないでください。`,
    ru: `${basePrompt}\n\nОтвечай с эмпатией, но сохраняй ответы относительно короткими для голосовых разговоров. Отвечай полностью на русском языке. Не включай в текст невербальные сигналы, такие как паузы или эмоциональные жесты.`,
    ar: `${basePrompt}\n\nاستجب بتعاطف ولكن احتفظ بردود قصيرة نسبيًا للمحادثات الصوتية. أجب بالكامل باللغة العربية. لا تدرج إشارات غير لفظية مثل التوقفات أو الإيماءات العاطفية في النص الخاص بك.`,
    hi: `${basePrompt}\n\nसहानुभूति के साथ जवाब दें लेकिन आवाज वाली बातचीत के लिए जवाब अपेक्षाकृत छोटे रखें। पूरी तरह से हिंदी में जवाब दें। अपने टेक्स्ट में ठहराव या भावनात्मक इशारों जैसे गैर-मौखिक संकेत शामिल न करें।`,
    pt: `${basePrompt}\n\nResponda com empatia, mas mantenha as respostas relativamente curtas para conversas por voz. Responda completamente em português. Não inclua sinais não verbais como pausas ou gestos emocionais em seu texto.`
  };
  
  return languageInstructions[language] || languageInstructions.en;
};

interface VoiceChatProps {
  language?: string;
}

const VoiceChat = ({ language = "en" }: VoiceChatProps) => {
  const initialGreeting = greetingsByLanguage[language] || greetingsByLanguage.en;
  
  const [isListening, setIsListening] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(initialGreeting);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [conversationHistory, setConversationHistory] = useState<{role: string, content: string}[]>([
    { role: "assistant", content: initialGreeting }
  ]);
  const [spokenText, setSpokenText] = useState("");
  const [fadingTexts, setFadingTexts] = useState<string[]>([]); // Changed to array to store multiple fading texts
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentSpeechWords, setCurrentSpeechWords] = useState<string[]>([]);
  const [displayedText, setDisplayedText] = useState("");
  const [typingIndex, setTypingIndex] = useState(0);
  const [isPermissionPending, setIsPermissionPending] = useState(false);
  const [audioDetected, setAudioDetected] = useState(false);
  
  const navigate = useNavigate();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadingContainerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const audioMonitorRef = useRef<number | null>(null);

  // Get the selected voice from localStorage or use default
  const getSelectedVoice = () => {
    return localStorage.getItem("selectedVoice") || "default";
  };

  // Get the selected voice type from localStorage or use default
  const getSelectedVoiceType = () => {
    return localStorage.getItem("voiceType") || "male"; // Changed default from "female" to "male"
  };

  // Set up speech recognition language based on selected language
  const getSpeechRecognitionLanguage = (lang: string): string => {
    const languageMap: Record<string, string> = {
      en: 'en-US',
      es: 'es-ES',
      fr: 'fr-FR',
      de: 'de-DE',
      zh: 'zh-CN',
      ja: 'ja-JP',
      ru: 'ru-RU',
      ar: 'ar-SA',
      hi: 'hi-IN',
      pt: 'pt-BR'
    };
    
    return languageMap[lang] || 'en-US';
  };

  // Add this utility function after the getSpeechRecognitionLanguage function
  const checkBrowserCompatibility = (): { supported: boolean; issues: string[] } => {
    const issues: string[] = [];
    let supported = true;
    
    // Check for Speech Recognition API
    if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
      issues.push("Speech recognition is not supported in this browser");
      supported = false;
    }
    
    // Check for SpeechSynthesis API (text-to-speech)
    if (!('speechSynthesis' in window)) {
      issues.push("Text-to-speech is not supported in this browser");
      supported = false;
    }
    
    // Check for MediaDevices API (microphone access)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      issues.push("Microphone access API is not supported in this browser");
      supported = false;
    }
    
    return { supported, issues };
  };

  // Add this function to request microphone permission explicitly
  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Your browser doesn't support microphone access");
        return false;
      }
      
      setIsPermissionPending(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Success - got permission, clean up the stream tracks
      stream.getTracks().forEach(track => track.stop());
      setIsPermissionPending(false);
      return true;
    } catch (err) {
      console.error("Microphone permission error:", err);
      toast.error("Microphone access is needed for voice chat. Please allow microphone access in your browser settings.");
      setIsPermissionPending(false);
      return false;
    }
  };

  useEffect(() => {
    // Initialize speech synthesis
    speechSynthesisRef.current = new SpeechSynthesisUtterance();
    
    // Enhance voice emotional qualities
    speechSynthesisRef.current.rate = 0.92; // Slightly slower for more human-like speech
    speechSynthesisRef.current.pitch = 1.02; // Slightly more natural pitch
    
    // Load voices and set the selected one
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = getSelectedVoice();
      const selectedVoiceType = getSelectedVoiceType();
      
      if (selectedVoice !== "default") {
        const voice = voices.find(v => v.name === selectedVoice);
        if (voice) {
          speechSynthesisRef.current!.voice = voice;
        }
      } else {
        // If no specific voice is selected, use voice type preference
        if (selectedVoiceType === "female") {
          // Look for explicitly female voices
          const femaleVoice = voices.find(voice => 
            voice.name.toLowerCase().includes('female') || 
            voice.name.toLowerCase().includes('woman') ||
            voice.name.toLowerCase().includes('girl')
          );
          if (femaleVoice) speechSynthesisRef.current!.voice = femaleVoice;
        } else if (selectedVoiceType === "male") {
          // Look for explicitly male voices
          const maleVoice = voices.find(voice => 
            voice.name.toLowerCase().includes('male') || 
            voice.name.toLowerCase().includes('man') || 
            voice.name.toLowerCase().includes('guy')
          );
          if (maleVoice) speechSynthesisRef.current!.voice = maleVoice;
        }
      }
      
      // Set language for speech synthesis
      speechSynthesisRef.current!.lang = getSpeechRecognitionLanguage(language);
    };
    
    // Load voices immediately if available
    loadVoices();
    
    // Also set up an event listener for when voices are loaded asynchronously
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    // Check for microphone permissions before speaking initial message
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
          // Permissions granted, speak the initial message
    speakMessage(currentMessage);
        })
        .catch(err => {
          console.error("Microphone permission error:", err);
          toast.error("Microphone access is needed for voice chat. Please allow microphone access in your browser settings.");
          // Still speak initial message even if mic permission is denied
          speakMessage(currentMessage);
        });
    } else {
      // Browser doesn't support getUserMedia API, still try to speak
    speakMessage(currentMessage);
    }

    return () => {
      if (speechSynthesisRef.current) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);
  
  // Update conversation when language changes
  useEffect(() => {
    const newGreeting = greetingsByLanguage[language] || greetingsByLanguage.en;
    
    // Only update if this is not the initial load
    if (conversationHistory.length > 1 || currentMessage !== initialGreeting) {
      // Add a language change notification to the conversation
      const languageName = new Intl.DisplayNames([language], { type: 'language' }).of(language);
      const languageChangeMessage = { 
        role: "system", 
        content: `Switching to ${languageName}` 
      };
      
      setConversationHistory(prev => [
        ...prev, 
        languageChangeMessage,
        { role: "assistant", content: newGreeting }
      ]);
      
      setCurrentMessage(newGreeting);
      speakMessage(newGreeting);
    }
  }, [language]);

  // Improved typewriter effect with more emotional variation
  const typewriterEffect = (text: string) => {
    setTypingIndex(0);
    setDisplayedText("");
    
    // Clear any existing typewriter interval
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    
    // Function to type one character at a time with variable speed for more human-like typing
    const typeNextChar = (index: number) => {
      if (index < text.length) {
        setDisplayedText(prev => prev + text.charAt(index));
        setTypingIndex(index + 1);
        
        // Calculate dynamic typing speed with more variation
        let delay = 40; // Base typing speed
        
        // Add pauses for punctuation
        if (text.charAt(index).match(/[.,!?;:]/)) {
          delay = 150; // Longer pause at punctuation
        } 
        // Add slight pauses before starting new sentences
        else if (index > 0 && text.charAt(index-1).match(/[.!?]\s/) && text.charAt(index).match(/[A-Z]/)) {
          delay = 180; // Slightly longer pause at new sentences
        }
        // Random variation to make typing feel more human
        delay += Math.random() * 20;
        
        typingTimerRef.current = setTimeout(() => typeNextChar(index + 1), delay);
      }
    };
    
    // Start typing
    typeNextChar(0);
  };

  // Process text to be spoken with improved emotional expression
  const speakMessage = (message: string) => {
    if (speechSynthesisRef.current) {
      window.speechSynthesis.cancel(); // Stop any ongoing speech
      
      // Move current text to fading texts if any
      if (spokenText) {
        setFadingTexts(prev => [...prev, spokenText]);
        // Limit fading texts to prevent too many building up
        if (fadingTexts.length > 3) {
          setFadingTexts(prev => prev.slice(-3));
        }
      }
      
      // Reset spoken text for new message
      setSpokenText("");
      
      // Start typewriter effect
      typewriterEffect(message);
      
      speechSynthesisRef.current.text = message;
      setIsSpeaking(true);
      
      // Apply current voice settings
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = getSelectedVoice();
      const selectedVoiceType = getSelectedVoiceType();
      
      if (selectedVoice !== "default") {
        const voice = voices.find(v => v.name === selectedVoice);
        if (voice) {
          speechSynthesisRef.current.voice = voice;
        }
      } else {
        // If no specific voice is selected, use voice type preference
        if (selectedVoiceType === "female") {
          // Look for explicitly female voices first, then fall back to other detection methods
          const femaleVoice = voices.find(voice => 
            voice.name.toLowerCase().includes('female') || 
            voice.name.toLowerCase().includes('woman') ||
            voice.name.toLowerCase().includes('girl')
          );
          if (femaleVoice) speechSynthesisRef.current.voice = femaleVoice;
        } else if (selectedVoiceType === "male") {
          // Look for explicitly male voices first, then fall back to other detection methods
          const maleVoice = voices.find(voice => 
            voice.name.toLowerCase().includes('male') || 
            voice.name.toLowerCase().includes('man') || 
            voice.name.toLowerCase().includes('guy')
          );
          if (maleVoice) speechSynthesisRef.current.voice = maleVoice;
        }
      }
      
      // Add emotional variation based on content
      if (message.includes("?")) {
        speechSynthesisRef.current.pitch = 1.05; // Slightly higher pitch for questions
        speechSynthesisRef.current.rate = 0.9;   // Slightly slower for questions
      } else if (message.includes("!")) {
        speechSynthesisRef.current.pitch = 1.1;  // Higher pitch for excitement
        speechSynthesisRef.current.rate = 1.0;   // Regular speed for excitement
      } else if (message.toLowerCase().includes("sad") || message.toLowerCase().includes("sorry")) {
        speechSynthesisRef.current.pitch = 0.95; // Lower pitch for sadness
        speechSynthesisRef.current.rate = 0.85;  // Slower for sadness
      } else {
        speechSynthesisRef.current.pitch = 1.02; // Default pitch
        speechSynthesisRef.current.rate = 0.92;  // Default speed
      }
      
      // Update language for speech synthesis based on current language selection
      speechSynthesisRef.current.lang = getSpeechRecognitionLanguage(language);
      
      // Process the speech with the typewriter effect
      window.speechSynthesis.speak(speechSynthesisRef.current);
      
      // Add event handler for when speech ends
      speechSynthesisRef.current.onend = () => {
        setIsSpeaking(false);
        setSpokenText(displayedText);
      };
    }
  };

  // Effect to scroll fading container
  useEffect(() => {
    if (fadingContainerRef.current && fadingTexts.length > 0) {
      fadingContainerRef.current.scrollTop = fadingContainerRef.current.scrollHeight;
    }
  }, [fadingTexts]);

  const startProcessingAnimation = () => {
    setIsProcessing(true);
    setProgressValue(0);
    
    // Simulate progress for visual feedback while waiting for Groq
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    progressIntervalRef.current = setInterval(() => {
      setProgressValue(prev => {
        // Move faster at the beginning, then slow down as we approach 90%
        const increment = prev < 30 ? 5 : prev < 60 ? 3 : prev < 80 ? 1 : 0.5;
        const newValue = prev + increment;
        // Cap at 90% until we get the actual response
        return newValue > 90 ? 90 : newValue;
      });
    }, 300) as unknown as number;
  };

  const stopProcessingAnimation = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    // Complete the progress bar
    setProgressValue(100);
    
    // Small delay to show the completed progress bar before hiding it
    setTimeout(() => {
      setIsProcessing(false);
    }, 500);
  };

  // Updated to use Groq API implementation with conversation history and selected language
  const getGroqResponse = async (userMessage: string) => {
    try {
      console.log("Sending message to Groq:", userMessage);
      startProcessingAnimation();
      
      // Add the user message to conversation history
      const updatedHistory = [...conversationHistory, { role: "user", content: userMessage }];
      
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [
            {
              role: "system",
              content: getSystemPromptByLanguage(language)
            },
            ...updatedHistory
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      // Log the raw response for debugging
      console.log("Groq API response status:", response.status);
      
      if (!response.ok) {
        const responseText = await response.text();
        console.error('Groq API Error:', responseText);
        stopProcessingAnimation();
        toast.error("Sorry, I couldn't connect properly. Let's try again in a moment.");
        return "I'm having a bit of trouble connecting right now. Could we try again in a moment?";
      }

      // Parse the response as JSON
      const data = await response.json();
      console.log("Groq parsed response:", data);
      stopProcessingAnimation();
      
      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        const aiResponse = data.choices[0].message.content;
        
        // Update the conversation history with both user message and AI response
        setConversationHistory([
          ...updatedHistory,
          { role: "assistant", content: aiResponse }
        ]);
        
        return aiResponse;
      } else {
        console.error('Unexpected Groq API response format:', data);
        toast.error("I received an unexpected response. Let's try again.");
        return "I'm having a bit of trouble processing that. Could we try again?";
      }
    } catch (error) {
      console.error('Error calling Groq API:', error);
      stopProcessingAnimation();
      toast.error("There was an issue connecting. Please check your connection and try again.");
      return "I'm sorry, I couldn't process that. Could we try again in a moment?";
    }
  };

  // Add this effect to check compatibility on component mount
  useEffect(() => {
    const { supported, issues } = checkBrowserCompatibility();
    if (!supported) {
      toast.error(
        `Your browser doesn't fully support voice chat features: ${issues.join(", ")}. Please use Chrome, Edge, or Safari for the best experience.`
      );
    } else {
      // Check microphone permission on component mount
      requestMicrophonePermission().then(hasPermission => {
        if (hasPermission) {
          console.log("Microphone permission granted on component mount");
        }
      });
    }
  }, []);

  // Add this function to monitor audio levels
  const startAudioMonitoring = async () => {
    try {
      // Clean up any existing audio monitor
      stopAudioMonitoring();
      
      // Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphoneStreamRef.current = stream;
      
      // Create audio context and analyser
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 256;
      
      // Connect microphone to analyser
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      // Buffer to store frequency data
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      // Function to check audio levels
      const checkAudioLevel = () => {
        if (!analyserRef.current || !isListening) {
          stopAudioMonitoring();
      return;
    }
        
        // Get current frequency data
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate average value (simple audio level detection)
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        
        // Check if we're detecting audio
        const isAudioDetected = average > 15; // Threshold value, may need adjustment
        
        // Update state if changed
        if (isAudioDetected !== audioDetected) {
          setAudioDetected(isAudioDetected);
          console.log("Audio detection status changed:", isAudioDetected ? "Audio detected" : "No audio detected");
        }
        
        // Schedule next check
        audioMonitorRef.current = requestAnimationFrame(checkAudioLevel);
      };
      
      // Start monitoring
      audioMonitorRef.current = requestAnimationFrame(checkAudioLevel);
      
    } catch (err) {
      console.error("Error setting up audio monitoring:", err);
      setAudioDetected(false);
    }
  };
  
  const stopAudioMonitoring = () => {
    // Cancel animation frame
    if (audioMonitorRef.current) {
      cancelAnimationFrame(audioMonitorRef.current);
      audioMonitorRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(err => {
        console.error("Error closing audio context:", err);
      });
      audioContextRef.current = null;
    }
    
    // Stop microphone stream
    if (microphoneStreamRef.current) {
      microphoneStreamRef.current.getTracks().forEach(track => track.stop());
      microphoneStreamRef.current = null;
    }
    
    // Reset analyser
    analyserRef.current = null;
    
    // Reset audio detected state
    setAudioDetected(false);
  };

  // Update initializeSpeechRecognition to use audio monitoring
  const initializeSpeechRecognition = () => {
    // Stop any existing recognition instance first
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Error stopping previous recognition instance:", e);
      }
    }
    
    // Start audio level monitoring
    startAudioMonitoring();

    // Create SpeechRecognition instance
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    // Always create a new instance to avoid issues with previous sessions
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false; // Change to false to force proper session restart
    recognitionRef.current.interimResults = true;
    recognitionRef.current.maxAlternatives = 1;
    
    // Set language for speech recognition based on selected language
    recognitionRef.current.lang = getSpeechRecognitionLanguage(language);
    
    let finalTranscript = '';

    recognitionRef.current.onstart = () => {
      console.log("Speech recognition started");
      setIsListening(true);
      setTranscription("Listening...");
      toast.success("I'm listening...");
      
      // Auto-restart recognition after a timeout if no speech is detected
      setTimeout(() => {
        if (recognitionRef.current && 
            isListening && 
            (transcription === "" || transcription === "Listening...") &&
            !audioDetected) { // Only restart if no audio has been detected
          try {
            console.log("Auto-restarting recognition due to inactivity");
            recognitionRef.current.stop();
            setTimeout(() => {
              if (isListening) {
                recognitionRef.current?.start();
              }
            }, 300);
          } catch (e) {
            console.error("Error in auto-restart timeout:", e);
          }
        }
      }, 8000); // 8 seconds without speech will trigger a restart
    };

    recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      
      // Debug log to check if results are coming in at all
      console.log("Recognition result event:", {
        resultIndex: event.resultIndex,
        resultsLength: event.results.length,
        isFinal: event.results[event.resultIndex]?.isFinal,
      });
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;
        
        // Log the quality of the recognition
        console.log(`Result ${i}: "${transcript}" (confidence: ${confidence})`);
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      
      const fullTranscript = finalTranscript + interimTranscript;
      console.log("Current transcript:", fullTranscript);
      
      // Only update if we have actual content
      if (fullTranscript.trim() !== "") {
        setTranscription(fullTranscript);
      }
    };

    recognitionRef.current.onend = async () => {
      console.log("Speech recognition ended", { 
        isListening, 
        transcription,
        hasValidTranscript: transcription && transcription !== "Listening..." 
      });
      
      // Only process if we have valid transcription that's not just "Listening..."
      if (transcription && transcription !== "Listening...") {
        setIsListening(false);
        
        // Get cleaned transcript without the "Listening..." prefix
        const userMessage = transcription.replace("Listening...", "").trim();
        
        if (userMessage) {
          console.log("Final transcription:", userMessage);
          toast.info("Processing your message...");
          
          // Get response from Groq
          const response = await getGroqResponse(userMessage);
          setCurrentMessage(response);
          speakMessage(response);
        } else {
          // If we have transcription but it's empty after cleaning
          toast.error("I didn't catch that. Could you try again?");
          // Don't automatically restart if user message was empty after cleaning
          setIsListening(false);
        }
      } else {
        // If recognition ended without any transcription
        console.log("Recognition ended without transcription");
        
        // Only show error message if we're not in a deliberate restart sequence
        if (isListening) {
        toast.error("I didn't catch that. Could you try again?");
        
          // Restart recognition after a short delay
          setTimeout(() => {
        if (isListening) {
          try {
                console.log("Attempting to restart recognition after it ended without results");
                // Create a completely new instance - sometimes this helps with browser quirks
                initializeSpeechRecognition();
          } catch (e) {
                console.error("Error restarting speech recognition after end event:", e);
            setIsListening(false);
          }
            }
          }, 500); // Short delay before restarting
        }
      }
    };

    recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error, event.message);
      
      if (event.error === 'no-speech') {
        toast.error("I didn't hear anything. Please try again.");
      } else if (event.error === 'not-allowed') {
        toast.error("Microphone access is needed for voice chat. Please allow microphone access in your browser settings.");
        setIsListening(false);
      } else if (event.error === 'audio-capture') {
        toast.error("No microphone was found. Ensure your microphone is connected and working.");
        setIsListening(false);
      } else if (event.error === 'network') {
        toast.error("Network error occurred. Please check your internet connection.");
        setIsListening(false);
      } else {
        toast.error(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      }
    };

    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error("Error starting speech recognition:", e);
      toast.error("Couldn't start speech recognition. Please try again.");
      setIsListening(false);
    }
  };

  // Update stopListening to also stop audio monitoring
  const stopListening = () => {
    // Stop audio monitoring
    stopAudioMonitoring();
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        console.log("Speech recognition stopped manually");
        
        // Process current transcription if available
        if (transcription && transcription !== "Listening...") {
          const userMessage = transcription.trim();
          if (userMessage) {
            setIsListening(false);
            toast.info("Processing your message...");
            
            // Process the message and get AI response
            getGroqResponse(userMessage).then(response => {
              setCurrentMessage(response);
              speakMessage(response);
            });
          }
        }
      } catch (e) {
        console.error("Error stopping speech recognition:", e);
      }
    }
    
    setIsListening(false);
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleCloseClick = (e?: React.MouseEvent) => {
    // Prevent any default action if this is triggered by an event
    if (e) {
      e.preventDefault();
    }
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Error stopping recognition on close:", e);
      }
    }
    
    if (speechSynthesisRef.current) {
      window.speechSynthesis.cancel();
    }
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    // Clear any typing timer
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    
    // Save conversation to session history
    saveConversationToHistory();
    
    // Show navbar again
    const navbarElement = document.querySelector('nav');
    if (navbarElement) {
      navbarElement.classList.remove('hidden');
    }
    
    console.log("Navigating to home page...");
    
    // Force a complete page reload to get back to the initial main page state
    // This is more reliable than using React Router navigation
    setTimeout(() => {
      window.location.href = "/";
    }, 100);
  };

  const saveConversationToHistory = () => {
    try {
      // Get existing history or initialize empty array
      const existingHistory = JSON.parse(localStorage.getItem('sessionHistory') || '[]');
      
      // Create new session record
      const newSession = {
        id: Date.now(),
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        type: 'voice',
        mood: detectMood(conversationHistory),
        summary: generateSummary(conversationHistory),
        conversation: conversationHistory
      };
      
      // Add to history and save
      const updatedHistory = [newSession, ...existingHistory];
      localStorage.setItem('sessionHistory', JSON.stringify(updatedHistory));
      
      toast.success("Session saved to history");
    } catch (error) {
      console.error("Error saving session history:", error);
      toast.error("Failed to save session history");
    }
  };
  
  // Simple mood detection based on conversation content
  const detectMood = (conversation: {role: string, content: string}[]): string => {
    const userMessages = conversation.filter(msg => msg.role === "user").map(msg => msg.content).join(" ");
    
    const moodKeywords = {
      happy: ["happy", "joy", "excited", "glad", "great", "wonderful", "fantastic"],
      sad: ["sad", "upset", "depressed", "miserable", "unhappy", "down", "blue"],
      anxious: ["anxious", "worried", "nervous", "stressed", "overwhelmed", "panic"],
      angry: ["angry", "mad", "frustrated", "annoyed", "irritated"],
      calm: ["calm", "relaxed", "peaceful", "content", "fine", "okay"]
    };
    
    // Count occurrences of each mood
    const moodCounts = Object.entries(moodKeywords).map(([mood, keywords]) => {
      const count = keywords.reduce((acc, keyword) => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = userMessages.match(regex);
        return acc + (matches ? matches.length : 0);
      }, 0);
      return { mood, count };
    });
    
    // Get the mood with the highest count, default to "reflective" if no mood is detected
    const dominantMood = moodCounts.reduce((max, curr) => 
      curr.count > max.count ? curr : max, { mood: "reflective", count: 0 });
      
    return dominantMood.mood;
  };
  
  // Generate a simple summary based on the conversation
  const generateSummary = (conversation: {role: string, content: string}[]): string => {
    // Get only user messages for summary
    const userMessages = conversation.filter(msg => msg.role === "user");
    
    if (userMessages.length === 0) {
      return "No user messages in this session";
    }
    
    // Take the first message as topic introduction
    const firstMessage = userMessages[0].content.slice(0, 50);
    
    // Create summary
    return `Voice conversation about ${firstMessage}...`;
  };

  const handleMessageClick = () => {
    // Save the current conversation state and navigate to text chat
    localStorage.setItem('currentConversation', JSON.stringify(conversationHistory));
    
    navigate("/");
    // Small delay to allow navigation to complete before changing mode
    setTimeout(() => {
      const sessionModeButton = document.querySelector('button:contains("begin session")');
      if (sessionModeButton) {
        (sessionModeButton as HTMLButtonElement).click();
      }
    }, 100);
  };

  // Clean up audio monitoring on component unmount
  useEffect(() => {
    return () => {
      stopAudioMonitoring();
      // existing cleanup code
      if (speechSynthesisRef.current) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Add back the startListening function that was removed
  const startListening = () => {
    // Check for basic browser compatibility first
    const { supported, issues } = checkBrowserCompatibility();
    if (!supported) {
      toast.error(
        `Your browser doesn't fully support voice chat: ${issues.join(", ")}. Please use Chrome, Edge, or Safari.`
      );
      return;
    }

    // Reset transcription and internal state variables first
    setTranscription("");
    
    // Request microphone permission explicitly first
    requestMicrophonePermission().then(hasPermission => {
      if (hasPermission) {
        // Permission granted, proceed with speech recognition
        initializeSpeechRecognition();
      } else {
        setIsListening(false);
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen max-w-md mx-auto px-4 pt-10 pb-20">
      <h2 className="text-lg font-medium mb-8">your turn</h2>
      
      <div className={`w-40 h-40 bg-yellow-400 rounded-full mb-8 flex-shrink-0 transition-all ${isSpeaking ? 'scale-110 animate-pulse' : audioDetected ? 'scale-105 animate-pulse' : 'scale-100'} flex items-center justify-center`}>
        {(isProcessing || isPermissionPending) && (
          <LoaderCircle className="h-12 w-12 animate-spin text-yellow-700" />
        )}
      </div>
      
      {isProcessing && (
        <div className="w-full max-w-xs mb-6">
          <Progress value={progressValue} className="h-2" />
          <p className="text-sm text-center mt-2 text-gray-500">Processing your message...</p>
        </div>
      )}

      {isPermissionPending && (
        <div className="w-full max-w-xs mb-6">
          <p className="text-sm text-center mt-2 text-gray-500">Waiting for microphone permission...</p>
        </div>
      )}
      
      {/* Fading text container */}
      <div 
        ref={fadingContainerRef}
        className="w-full max-h-32 overflow-y-auto mb-2 px-4 text-center text-gray-500 text-sm"
      >
        {fadingTexts.map((text, index) => (
          <p key={index} className="mb-2 animate-fade-in text-gray-400">
            {text}
          </p>
        ))}
      </div>
      
      {/* Active speech container with typewriter effect */}
      <div className="text-center mb-8 min-h-16 font-medium">
        <p className="text-black">{displayedText}</p>
      </div>
      
      {isListening && transcription && (
        <p className="text-sm text-gray-600 mb-4 italic">"{transcription}"</p>
      )}
      
      <div className="flex gap-6 justify-center">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full w-14 h-14 bg-gray-100 hover:bg-gray-200"
          onClick={handleMessageClick}
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
        
        <Button
          variant={isListening ? "destructive" : "default"}
          size="icon"
          onClick={handleMicClick}
          className={`rounded-full w-14 h-14 ${
            isListening ? "bg-red-500 hover:bg-red-600" : "bg-yellow-400 hover:bg-yellow-500"
          }`}
          disabled={isProcessing}
        >
          {isListening ? <X className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className="rounded-full w-14 h-14 bg-gray-100 hover:bg-gray-200"
          onClick={handleCloseClick}
        >
          <X className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default VoiceChat;
