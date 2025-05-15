import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/use-language";

interface TimeGreetingProps {
  className?: string;
  language?: string;
}

const TimeGreeting = ({ className, language }: TimeGreetingProps) => {
  const [greeting, setGreeting] = useState<string>("");
  const { uiLanguage } = useLanguage();

  // Set greeting based on current time
  useEffect(() => {
    const updateGreeting = () => {
      const currentHour = new Date().getHours();
      const selectedLang = language || uiLanguage || 'en';
      
      if (currentHour >= 5 && currentHour < 12) {
        getLocalizedGreeting("morning", selectedLang);
      } else if (currentHour >= 12 && currentHour < 18) {
        getLocalizedGreeting("afternoon", selectedLang);
      } else {
        getLocalizedGreeting("evening", selectedLang);
      }
    };
    
    // Initialize greeting
    updateGreeting();
    
    // Update greeting every minute
    const intervalId = setInterval(updateGreeting, 60000);
    
    return () => clearInterval(intervalId);
  }, [language, uiLanguage]);
  
  // Get localized greeting
  const getLocalizedGreeting = (timeOfDay: string, lang: string) => {
    const greetings: Record<string, Record<string, string>> = {
      morning: {
        en: "good morning",
        es: "buenos días",
        fr: "bonjour",
        de: "guten morgen",
        zh: "早上好",
        ja: "おはようございます",
        ru: "доброе утро",
        ar: "صباح الخير",
        hi: "सुप्रभात",
        pt: "bom dia"
      },
      afternoon: {
        en: "good afternoon",
        es: "buenas tardes",
        fr: "bon après-midi",
        de: "guten tag",
        zh: "下午好",
        ja: "こんにちは",
        ru: "добрый день",
        ar: "مساء الخير",
        hi: "शुभ दोपहर",
        pt: "boa tarde"
      },
      evening: {
        en: "good evening",
        es: "buenas noches",
        fr: "bonsoir",
        de: "guten abend",
        zh: "晚上好",
        ja: "こんばんは",
        ru: "добрый вечер",
        ar: "مساء الخير",
        hi: "शुभ संध्या",
        pt: "boa noite"
      }
    };
    
    // Use English as fallback if language not found
    setGreeting(greetings[timeOfDay][lang] || greetings[timeOfDay]['en']);
  };

  return (
    <h1 className={`text-3xl font-medium ${className || ''}`}>
      {greeting}
    </h1>
  );
};

export default TimeGreeting;
