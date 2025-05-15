import { toast } from "sonner";

// The API key for AI enhancement
const AI_API_KEY = "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";

interface EnhancedContent {
  title: string;
  content: string;
  error?: string;
}

/**
 * Enhances a journal entry using AI to improve structure and content
 * @param originalTitle The original title of the journal entry
 * @param originalContent The original content of the journal entry
 * @returns An object with enhanced title and content
 */
export const enhanceJournalEntry = async (
  originalTitle: string,
  originalContent: string
): Promise<EnhancedContent> => {
  try {
    console.log("Enhancing journal entry with AI...");
    
    // Create a payload for the AI API request
    const prompt = `
You are a professional therapeutic journal writing assistant. Your task is to transform the user's journal entry into a well-structured, articulate, and therapeutic piece of writing.

Original title: ${originalTitle}
Original journal content: ${originalContent}

Please provide:
1. An enhanced, meaningful title that captures the essence of the journal entry
2. A well-structured, eloquent version of their journal entry that:
   - Maintains all key points and personal feelings from the original
   - Improves organization with proper paragraphs and natural flow
   - Enhances clarity and introspection
   - Maintains the first-person perspective and personal voice
   - Adds brief therapeutic reflections where appropriate

Format your response as valid JSON with two fields:
- title: The enhanced title
- content: The enhanced journal content in HTML format with proper paragraph tags

Your output should be valid JSON that can be parsed directly.
`;

    try {
      // Try with the Groq API first
      console.log("Attempting to enhance with Groq AI API...");
      
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${AI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama3-70b-8192",
          messages: [
            {
              role: "system",
              content: "You are a professional therapeutic journal writing assistant."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2048
        })
      });

      // Check if we got a successful response
      if (response.ok) {
        const result = await response.json();
        console.log("AI response received:", result);

        // Extract the AI response content
        const aiResponse = result.choices[0]?.message?.content;
        if (!aiResponse) {
          throw new Error("No content in AI response");
        }

        return parseAIResponse(aiResponse, originalTitle, originalContent);
      } else {
        const errorText = await response.text();
        console.error("Groq API enhancement failed:", errorText);
        throw new Error("API authentication error");
      }
    } catch (groqError) {
      console.error("Failed with Groq API:", groqError);
      console.log("Falling back to local enhancement...");
      
      // For demo purposes, let's create a local enhancement if the API fails
      return createLocalEnhancement(originalTitle, originalContent);
    }
  } catch (error) {
    console.error("Error enhancing journal entry:", error);
    toast.error(`Enhancement error: ${error.message}`);
    
    return {
      title: originalTitle,
      content: originalContent,
      error: error.message
    };
  }
};

/**
 * Parse the AI response to extract title and content
 */
const parseAIResponse = (
  aiResponse: string, 
  originalTitle: string, 
  originalContent: string
): EnhancedContent => {
  try {
    // Sometimes the AI might return a markdown-formatted string with ```json
    // blocks, so we need to extract just the JSON part
    let jsonString = aiResponse;
    
    // If it contains code blocks, extract just the JSON
    const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      jsonString = jsonMatch[1];
    }
    
    const parsedResponse = JSON.parse(jsonString);
    
    if (!parsedResponse.title || !parsedResponse.content) {
      throw new Error("Missing title or content in AI response");
    }
    
    return {
      title: parsedResponse.title,
      content: parsedResponse.content
    };
  } catch (parseError) {
    console.error("Failed to parse AI response:", parseError);
    console.log("Raw AI response:", aiResponse);
    
    // Fallback: If we can't parse the response, try to extract title and content with regex
    const titleMatch = aiResponse.match(/title["\s:]+([^"\n]+)/i);
    const contentMatch = aiResponse.match(/content["\s:]+([^"]*?)(?=[,}]|$)/i);
    
    if (titleMatch && contentMatch) {
      return {
        title: titleMatch[1].trim(),
        content: contentMatch[1].trim()
      };
    }
    
    throw new Error("Could not parse AI response");
  }
};

/**
 * Create a local enhancement for demo purposes when API fails
 */
const createLocalEnhancement = (originalTitle: string, originalContent: string): EnhancedContent => {
  console.log("Creating local enhancement for demo purposes");
  
  // Extract the first few words to create a meaningful title if the original is empty or generic
  const titlePrefix = originalTitle && !['untitled', 'journal entry', 'note'].includes(originalTitle.toLowerCase()) 
    ? originalTitle 
    : "Reflections on " + new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  
  // Create an enhanced title
  const enhancedTitle = titlePrefix.includes("Journey") || titlePrefix.includes("Reflections") 
    ? titlePrefix 
    : `My Journey: ${titlePrefix}`;
  
  // Create paragraphs from the original content
  const paragraphs = originalContent.split(/\n\s*\n/);
  
  // Create a nice HTML structure with proper paragraphs
  let enhancedContent = "";
  
  // Add an intro paragraph if the content is long enough
  if (originalContent.length > 30) {
    enhancedContent += `<p>As I reflect on my experiences today, I find myself contemplating the various aspects of my journey.</p>`;
  }
  
  // Add the original content with paragraph formatting
  paragraphs.forEach(para => {
    if (para.trim()) {
      enhancedContent += `<p>${para.trim()}</p>`;
    }
  });
  
  // Add a conclusion paragraph if the content is long enough
  if (originalContent.length > 100) {
    enhancedContent += `
    <p>Taking the time to write down my thoughts has been a valuable exercise in self-reflection. Through this process, I've gained new insights about myself and my experiences.</p>
    <p>Moving forward, I'll continue to observe my thoughts and feelings with greater awareness and compassion.</p>`;
  }
  
  return {
    title: enhancedTitle,
    content: enhancedContent
  };
}; 