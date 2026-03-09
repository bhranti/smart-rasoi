import { GoogleGenAI, Type } from "@google/genai";
import { MealPlan, MealType, Recipe } from "../types";

export async function generateWeeklyMealPlan(
  preferences: string = "", 
  exclusions: string[] = [], 
  language: string = "English",
  availableIngredients: string = "",
  householdType: string = "Single",
  weeklyBudget: string = "",
  mealTimings: Record<string, string> = {}
): Promise<MealPlan[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API Key is missing. Please ensure it is configured in the settings.");
  }
  
  const ai = new GoogleGenAI({ apiKey });

  const exclusionText = exclusions.length > 0 ? `STRICTLY EXCLUDE these ingredients: ${exclusions.join(", ")}.` : "";
  const availableText = availableIngredients.length > 0 ? `PRIORITIZE using these available ingredients: ${availableIngredients}.` : "";
  const budgetText = weeklyBudget ? `The total budget for the whole week is ${weeklyBudget}. Ensure recipes are cost-effective.` : "";
  const timingText = Object.entries(mealTimings).length > 0 
    ? `Meal timings are: ${Object.entries(mealTimings).map(([k, v]) => `${k} at ${v}`).join(", ")}. Adjust recipe complexity and portion sizes accordingly.` 
    : "";
  
  const prompt = `Generate a 7-day healthy Indian meal plan for a ${householdType} household. 
  Preferences: ${preferences}.
  ${exclusionText}
  ${availableText}
  ${budgetText}
  ${timingText}
  Language: All recipe names, descriptions, ingredients, and instructions MUST be in ${language}.
  Include Breakfast, Lunch, Dinner, and Brunch for each day.
  Focus on:
  - High protein, balanced macros.
  - Quick preparation (under 30 mins).
  - Authentic Indian flavors but healthy (less oil, whole grains).
  - Variety across the week.
  
  Return the data as a JSON array of 7 objects, each with 'day' (Monday, Tuesday, etc.) and 'meals' (an object with keys 'Breakfast', 'Lunch', 'Dinner', 'Brunch').
  For EACH meal type (e.g., Breakfast), provide an ARRAY of 2 distinct recipe options.
  
  - name, description, ingredients (array), instructions (array), prepTime (mins), cookTime (mins), and nutrition (calories, protein, carbs, fats).
  - estimatedCost: The estimated cost to prepare this recipe (numeric value only). Ensure the total cost for all meals across 7 days stays within the provided weekly budget of ${weeklyBudget || "a reasonable amount"}.
  - youtubeUrl: A YouTube search URL for the recipe.
  - shoppingList: A concise list of items to buy specifically for this recipe (in ${language}).
  - advancePrep: Any advance preparation required (e.g., "Soak dal for 2 hours", "Marinate for 30 mins"). If none, leave as empty string.`;

  const recipeSchema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      description: { type: Type.STRING },
      ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
      instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
      prepTime: { type: Type.NUMBER },
      cookTime: { type: Type.NUMBER },
      nutrition: {
        type: Type.OBJECT,
        properties: {
          calories: { type: Type.NUMBER },
          protein: { type: Type.NUMBER },
          carbs: { type: Type.NUMBER },
          fats: { type: Type.NUMBER },
        },
        required: ["calories", "protein", "carbs", "fats"],
      },
      youtubeUrl: { type: Type.STRING },
      shoppingList: { type: Type.ARRAY, items: { type: Type.STRING } },
      advancePrep: { type: Type.STRING },
      estimatedCost: { type: Type.NUMBER },
    },
    required: ["name", "description", "ingredients", "instructions", "prepTime", "cookTime", "nutrition", "youtubeUrl", "shoppingList", "advancePrep", "estimatedCost"],
  };

  const mealOptionsSchema = {
    type: Type.ARRAY,
    items: recipeSchema,
    minItems: 2,
    maxItems: 2
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.STRING },
              meals: {
                type: Type.OBJECT,
                properties: {
                  Breakfast: mealOptionsSchema,
                  Lunch: mealOptionsSchema,
                  Dinner: mealOptionsSchema,
                  Brunch: mealOptionsSchema,
                },
                required: ["Breakfast", "Lunch", "Dinner", "Brunch"],
              },
            },
            required: ["day", "meals"],
          },
        },
      },
    });

    console.log("AI Response received:", response);

    const text = response.text;
    if (!text) {
      throw new Error("The AI returned an empty response. Please try again.");
    }
    
    return JSON.parse(text);
  } catch (e: any) {
    console.error("AI Generation Error:", e);
    throw new Error(e.message || "Failed to generate meal plan. Please check your connection and try again.");
  }
}

export async function translateRecipe(recipe: Recipe, targetLanguage: string): Promise<Recipe> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not defined. Please set it in your environment.");
    return recipe;
  }
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Translate the following recipe into ${targetLanguage}. 
  Maintain the same JSON structure.
  Recipe: ${JSON.stringify(recipe)}`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  try {
    const translated = JSON.parse(response.text || "{}");
    return { ...recipe, ...translated };
  } catch (e) {
    console.error("Failed to translate recipe", e);
    return recipe;
  }
}
