import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LanguageSelectProps {
  onChange: (value: string) => void;
  defaultValue?: string;
}

// Language display names in English
const languageNames: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  zh: "Chinese",
  ja: "Japanese",
  ru: "Russian",
  ar: "Arabic",
  hi: "Hindi",
  pt: "Portuguese"
};

const LanguageSelect = ({ onChange, defaultValue = "en" }: LanguageSelectProps) => {
  // Handle language changes 
  const handleLanguageChange = (value: string) => {
    // Only store the language setting without applying it to the entire site
    localStorage.setItem("selectedLanguage", value);
    onChange(value);
  };

  return (
    <Select defaultValue={defaultValue} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select language" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(languageNames).map(([code, name]) => (
          <SelectItem key={code} value={code}>{name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default LanguageSelect;
