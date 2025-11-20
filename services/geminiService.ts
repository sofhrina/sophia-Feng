import { GoogleGenAI, Type } from "@google/genai";
import { ProblemStep } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_FAST = "gemini-2.5-flash"; 

export const expandDefinition = async (term: string, userContent: string, subject: string, chapter: string): Promise<any> => {
  try {
    const prompt = `
      You are a strict Tutor at UCL (University College London) Mathematics Department.
      
      Context: Subject "${subject}", Chapter "${chapter}".
      Term: "${term}"
      User's Definition (Markdown): "${userContent}"

      Task: Analyze, correct, and expand.
      IMPORTANT: 
      1. Use '$' for inline math (e.g. $x^2$).
      2. Use '$$' for block math (e.g. $$\\int f(x) dx$$). 
      3. Do NOT wrap math in markdown code blocks (no triple backticks). Output raw text with delimiters.
      
      Return a JSON object:
      1. 'ai_content_en': Rigorous mathematical definition in English (Use $ and $$).
      2. 'ai_content_zh': Rigorous mathematical definition in Chinese (Use $ and $$).
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

    return JSON.parse(response.text || "{}");
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
      IMPORTANT: 
      1. Use '$' for inline math.
      2. Use '$$' for block math.
      3. Do NOT use markdown code blocks (tripple backticks) for math.
      
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

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error summarizing proof:", error);
    throw error;
  }
};

export const generateAiProblem = async (subject: string, chapter: string, specificTopic?: string): Promise<{ content: string, steps: ProblemStep[], knowledgePoints: string[], difficulty: string, summary: string }> => {
  try {
    const topicInstruction = specificTopic ? `Focus specifically on: ${specificTopic}.` : "";
    const prompt = `
      Generate a UCL-style university math exam question for Subject: "${subject}", Chapter: "${chapter}".
      ${topicInstruction}
      It should be challenging and require multiple steps.
      
      IMPORTANT: 
      1. Use '$' for inline math and '$$' for block math.
      2. Do NOT use markdown code blocks for math.
      
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

    const json = JSON.parse(response.text || "{}");
    
    const steps: ProblemStep[] = (json.steps || []).map((s: any) => ({
      stepNumber: s.step_number,
      description: "", 
      math: s.math,
      explanation: s.explanation
    }));

    return {
      content: json.problem_text,
      summary: json.problem_summary || "Math Problem",
      steps: steps,
      knowledgePoints: json.knowledge_tags || [],
      difficulty: json.difficulty || "Standard"
    };

  } catch (error) {
    console.error("Error generating problem:", error);
    throw error;
  }
};

export const solveUserProblem = async (problemText: string): Promise<{ steps: ProblemStep[], knowledgePoints: string[], summary: string }> => {
  try {
    const prompt = `
      Solve this university math problem step-by-step.
      Problem: "${problemText}"
      
      IMPORTANT: 
      1. Use '$' for inline math and '$$' for block math.
      2. Do NOT use markdown code blocks for math.
      
      Identify the specific theorems/definitions used in 'knowledge_tags'.
      Provide a short 'problem_summary'.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            problem_summary: { type: Type.STRING },
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

    const json = JSON.parse(response.text || "{}");
     const steps: ProblemStep[] = (json.steps || []).map((s: any) => ({
      stepNumber: s.step_number,
      description: "", 
      math: s.math,
      explanation: s.explanation
    }));

    return {
      steps: steps,
      knowledgePoints: json.knowledge_tags || [],
      summary: json.problem_summary || "Solved Problem"
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
          - Use '$' for math notation. DO NOT use markdown code blocks for math.
          - Use UCL academic tone but easy to read.
        `;

        const response = await ai.models.generateContent({
            model: MODEL_FAST,
            contents: prompt,
        });
        
        return response.text || "Could not generate summary.";

    } catch (error) {
        console.error(error);
        return "Error generating summary.";
    }
}