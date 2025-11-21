
import { GoogleGenAI, Type } from "@google/genai";
import { ProblemStep } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_FAST = "gemini-2.5-flash"; 

// --- Helper Functions for Cleaning AI Output ---

/**
 * Strips markdown code blocks (e.g. ```json ... ```) from the raw response text
 * to prevent JSON.parse errors.
 */
const cleanJsonText = (text: string): string => {
  if (!text) return "{}";
  // Remove ```json ... ``` or just ``` ... ``` wrappers
  let clean = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  return clean.trim();
};

/**
 * Clean specific strings (like problem text or steps) to remove
 * accidental markdown code blocks around math formulas.
 */
const cleanMathString = (text: string): string => {
  if (!text) return "";
  // Remove ```latex ... ``` or ```math ... ``` wrappers inside the string
  return text.replace(/```(?:latex|markdown|math)?\n?([\s\S]*?)\n?```/gi, '$1');
};

// -----------------------------------------------

export const expandDefinition = async (term: string, userContent: string, subject: string, chapter: string): Promise<any> => {
  try {
    const prompt = `
      You are a strict Tutor at UCL (University College London) Mathematics Department.
      
      Context: Subject "${subject}", Chapter "${chapter}".
      Term: "${term}"
      User's Definition (Markdown): "${userContent}"

      Task: Analyze, correct, and expand.
      
      CRITICAL FORMATTING RULES:
      1. ALWAYS use '$' for inline math (e.g. $x^2$).
      2. ALWAYS use '$$' for block math (e.g. $$\\int f(x) dx$$). 
      3. DO NOT wrap the output in markdown code blocks.
      4. DO NOT use \\( \\) or \\[ \\], strictly use $ and $$.
      
      Return a JSON object:
      1. 'ai_content_en': Rigorous mathematical definition in English.
      2. 'ai_content_zh': Rigorous mathematical definition in Chinese.
      3. 'fun_analogy': A creative, memorable, non-math analogy (Bilingual EN/CN).
      4. 'chapter_connection': A specific example connecting this term to other concepts likely in "${chapter}".
      5. 'ucl_importance': "High", "Medium", or "Low" based on UCL exam frequency.
      6. 'extensions': Advanced related knowledge points or common pitfalls (Bilingual).
      7. 'flashcard_summary': A very concise (1-2 sentence) summary of what this concept IS, suitable for a flashcard back.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ai_content_en: { type: Type.STRING },
            ai_content_zh: { type: Type.STRING },
            fun_analogy: { type: Type.STRING },
            chapter_connection: { type: Type.STRING },
            ucl_importance: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
            extensions: { type: Type.STRING },
            flashcard_summary: { type: Type.STRING },
          }
        }
      }
    });

    const json = JSON.parse(cleanJsonText(response.text || "{}"));
    
    // Clean nested strings
    if (json.ai_content_en) json.ai_content_en = cleanMathString(json.ai_content_en);
    if (json.ai_content_zh) json.ai_content_zh = cleanMathString(json.ai_content_zh);
    if (json.extensions) json.extensions = cleanMathString(json.extensions);

    return json;
  } catch (error) {
    console.error("Error expanding definition:", error);
    throw error;
  }
};

// Quick generate a definition from just a tag name (for Exercises view)
export const generateMissingConcept = async (term: string): Promise<any> => {
    return expandDefinition(term, "Auto-generated from exercise tag", "General Math", "Auto-Generated");
};

export const analyzeProof = async (theoremName: string, theoremContent: string, imageBase64: string): Promise<any> => {
  try {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `
      I have uploaded a photo of a proof for "${theoremName}".
      Statement: "${theoremContent}".
      
      Task: Analyze the proof for a university student.
      CRITICAL FORMATTING RULES:
      1. ALWAYS use '$' for inline math (e.g. $x^2$).
      2. ALWAYS use '$$' for block math (e.g. $$\\int f(x) dx$$). 
      3. DO NOT wrap the output in markdown code blocks.
      
      Return JSON with:
      1. 'proof_steps': A clean, step-by-step reproduction of the proof in Markdown + LaTeX. **Ensure each logical step is on a new line/paragraph.**
      2. 'logic_mapping': For each step, explicitly list the PREVIOUS DEFINITIONS, THEOREMS, or AXIOMS used. Format as a bullet list matching the steps.
      3. 'corrected_name': If the user's theorem name is non-standard or imprecise, provide the standard mathematical name. Otherwise return null.
      4. 'concrete_example': A concrete numerical or conceptual example applying this theorem.
      5. 'flashcard_summary': A 1 sentence summary of the theorem's core implication.
      6. 'ucl_importance': "High", "Medium", or "Low" based on difficulty/exam frequency.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            proof_steps: { type: Type.STRING },
            logic_mapping: { type: Type.STRING },
            corrected_name: { type: Type.STRING, nullable: true },
            concrete_example: { type: Type.STRING },
            flashcard_summary: { type: Type.STRING },
            ucl_importance: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
          }
        }
      }
    });

    const json = JSON.parse(cleanJsonText(response.text || "{}"));

    // Clean nested strings
    if (json.proof_steps) json.proof_steps = cleanMathString(json.proof_steps);
    if (json.concrete_example) json.concrete_example = cleanMathString(json.concrete_example);
    if (json.logic_mapping) json.logic_mapping = cleanMathString(json.logic_mapping);

    return json;
  } catch (error) {
    console.error("Error summarizing proof:", error);
    throw error;
  }
};

export const generateAiProblem = async (subject: string, chapter: string, difficultyLevel: string, specificTopic?: string): Promise<{ content: string, steps: ProblemStep[], knowledgePoints: string[], difficulty: string, summary: string }> => {
  try {
    const topicInstruction = specificTopic ? `Focus specifically on: ${specificTopic}.` : "";
    const prompt = `
      Generate a UCL-style university math exam question for Subject: "${subject}", Chapter: "${chapter}".
      Requested Difficulty: ${difficultyLevel} (Adjust complexity accordingly).
      ${topicInstruction}
      It should be challenging and require multiple steps.
      
      CRITICAL FORMATTING RULES:
      1. ALWAYS use '$' for inline math (e.g. $x^2$).
      2. ALWAYS use '$$' for block math (e.g. $$\\int f(x) dx$$). 
      3. DO NOT wrap the math in \`\`\`latex blocks. Output raw text with $ delimiters.
      
      Return JSON:
      - 'problem_text': LaTeX formatted problem (Readable with $ delimiters).
      - 'problem_summary': A short 5-10 word title/summary of what this problem tests (e.g. "Integration by parts with log").
      - 'difficulty': 'UCL First Class' (Hard), 'UCL 2:1' (Medium), or 'UCL Pass' (Easy).
      - 'steps': Array of solution steps.
      - 'knowledge_tags': Specific definitions/theorems used (used for tracking).
    `;

    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            problem_text: { type: Type.STRING },
            problem_summary: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  step_number: { type: Type.INTEGER },
                  math: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                }
              }
            },
            knowledge_tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const json = JSON.parse(cleanJsonText(response.text || "{}"));
    
    const steps: ProblemStep[] = (json.steps || []).map((s: any) => ({
      stepNumber: s.step_number,
      description: "", 
      math: cleanMathString(s.math), // Clean individual step math
      explanation: cleanMathString(s.explanation) // Clean explanation
    }));

    return {
      content: cleanMathString(json.problem_text), // Clean problem text
      summary: json.problem_summary || "Math Problem",
      steps: steps,
      knowledgePoints: json.knowledge_tags || [],
      difficulty: json.difficulty || difficultyLevel
    };

  } catch (error) {
    console.error("Error generating problem:", error);
    throw error;
  }
};

export const solveUserProblem = async (problemText: string, images?: string[]): Promise<{ steps: ProblemStep[], knowledgePoints: string[], summary: string, problem_transcription?: string }> => {
  try {
    const parts = [];
    
    // Add images if present
    if (images && images.length > 0) {
        images.forEach(img => {
            const base64Data = img.replace(/^data:image\/\w+;base64,/, "");
            parts.push({ inlineData: { mimeType: "image/jpeg", data: base64Data } });
        });
    }

    const prompt = `
      Solve this university math problem step-by-step.
      ${images && images.length > 0 ? "I have uploaded photos of the problem." : `Problem text: "${problemText}"`}
      
      First, if images are provided, Transcribe the problem text exactly into LaTeX format.
      Then, provide the solution.

      CRITICAL FORMATTING RULES:
      1. ALWAYS use '$' for inline math (e.g. $x^2$).
      2. ALWAYS use '$$' for block math (e.g. $$\\int f(x) dx$$). 
      3. DO NOT wrap the math in \`\`\`latex blocks.
      
      Return JSON:
      - 'problem_summary': Short title.
      - 'problem_transcription': The transcribed text of the problem (if images used).
      - 'steps': Solution steps.
      - 'knowledge_tags': Theorems/Definitions used.
    `;

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: { parts: parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            problem_summary: { type: Type.STRING },
            problem_transcription: { type: Type.STRING }, // Returned if image was used
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  step_number: { type: Type.INTEGER },
                  math: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                }
              }
            },
            knowledge_tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const json = JSON.parse(cleanJsonText(response.text || "{}"));
     const steps: ProblemStep[] = (json.steps || []).map((s: any) => ({
      stepNumber: s.step_number,
      description: "", 
      math: cleanMathString(s.math),
      explanation: cleanMathString(s.explanation)
    }));

    return {
      steps: steps,
      knowledgePoints: json.knowledge_tags || [],
      summary: json.problem_summary || "Solved Problem",
      problem_transcription: cleanMathString(json.problem_transcription)
    };
  } catch (error) {
    console.error("Error solving problem:", error);
    throw error;
  }
};

export const generateChapterSummary = async (subject: string, chapter: string, items: any[]): Promise<string> => {
    try {
        const itemsContext = items.map(i => `${i.term || i.name}: ${i.flashcardSummary}`).join("\n");
        const prompt = `
          Subject: ${subject}
          Chapter: ${chapter}
          
          Here are the user's notes/concepts so far:
          ${itemsContext}
          
          Task: Write a cohesive, high-level revision summary for this entire chapter. 
          - Connect the concepts logically (e.g. how definition A leads to Theorem B).
          - Use '$' for math notation. 
          - DO NOT use markdown code blocks.
          - Use UCL academic tone but easy to read.
        `;

        const response = await ai.models.generateContent({
            model: MODEL_FAST,
            contents: prompt,
        });
        
        return cleanMathString(response.text || "Could not generate summary.");

    } catch (error) {
        console.error(error);
        return "Error generating summary.";
    }
}
