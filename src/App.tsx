import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  ChefHat, 
  Clock, 
  Flame, 
  Plus, 
  Sparkles, 
  ChevronRight, 
  Info, 
  Utensils,
  Coffee,
  Sun,
  Moon,
  Zap,
  X,
  Youtube,
  ShoppingCart,
  Download,
  Globe,
  Languages,
  Mic,
  MicOff,
  Volume2,
  VolumeX
} from 'lucide-react';
import { MealPlan, MealType, Recipe } from './types';
import { generateWeeklyMealPlan, translateRecipe } from './services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function App() {
  const [selectedDay, setSelectedDay] = useState<string>(DAYS[0]);
  const [weeklyPlan, setWeeklyPlan] = useState<MealPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [aiPreferences, setAiPreferences] = useState(() => {
    return localStorage.getItem('rasoi_preferences') || '';
  });
  const [exclusions, setExclusions] = useState<string[]>(() => {
    const saved = localStorage.getItem('rasoi_exclusions');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedMealOptions, setSelectedMealOptions] = useState<Record<string, Record<string, number>>>(() => {
    const saved = localStorage.getItem('rasoi_selected_options');
    return saved ? JSON.parse(saved) : {};
  });
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('rasoi_language') || 'English';
  });
  const [availableIngredients, setAvailableIngredients] = useState(() => {
    return localStorage.getItem('rasoi_available_ingredients') || '';
  });
  const [householdType, setHouseholdType] = useState<string>(() => {
    return localStorage.getItem('rasoi_household_type') || 'Single';
  });
  const [weeklyBudget, setWeeklyBudget] = useState<string>(() => {
    return localStorage.getItem('rasoi_weekly_budget') || '';
  });
  const [mealTimings, setMealTimings] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('rasoi_meal_timings');
    return saved ? JSON.parse(saved) : {
      Breakfast: '08:00 AM',
      Lunch: '01:00 PM',
      Dinner: '08:00 PM',
      Brunch: '11:00 AM'
    };
  });
  const [isTranslating, setIsTranslating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [listeningTarget, setListeningTarget] = useState<'preferences' | 'ingredients'>('preferences');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);

  const LANGUAGE_TAGS: Record<string, string> = {
    "English": "en-IN",
    "Hindi": "hi-IN",
    "Gujarati": "gu-IN",
    "Marathi": "mr-IN",
    "Bengali": "bn-IN",
    "Tamil": "ta-IN",
    "Telugu": "te-IN",
    "Kannada": "kn-IN"
  };

  useEffect(() => {
    localStorage.setItem('rasoi_preferences', aiPreferences);
  }, [aiPreferences]);

  useEffect(() => {
    localStorage.setItem('rasoi_available_ingredients', availableIngredients);
  }, [availableIngredients]);

  useEffect(() => {
    localStorage.setItem('rasoi_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('rasoi_household_type', householdType);
  }, [householdType]);

  useEffect(() => {
    localStorage.setItem('rasoi_weekly_budget', weeklyBudget);
  }, [weeklyBudget]);

  useEffect(() => {
    localStorage.setItem('rasoi_meal_timings', JSON.stringify(mealTimings));
  }, [mealTimings]);

  useEffect(() => {
    localStorage.setItem('rasoi_exclusions', JSON.stringify(exclusions));
  }, [exclusions]);

  useEffect(() => {
    localStorage.setItem('rasoi_selected_options', JSON.stringify(selectedMealOptions));
  }, [selectedMealOptions]);

  useEffect(() => {
    const savedPlan = localStorage.getItem('rasoi_meal_plan');
    if (savedPlan) {
      try {
        setWeeklyPlan(JSON.parse(savedPlan));
      } catch (e) {
        console.error("Failed to load saved plan", e);
      }
    }
  }, []);

  const handleGenerateAiPlan = async () => {
    setIsLoading(true);
    setError(null);
    setShowAiPrompt(false);
    console.log("Generating plan with preferences:", { aiPreferences, exclusions, language, availableIngredients, householdType, weeklyBudget, mealTimings });
    try {
      const plan = await generateWeeklyMealPlan(
        aiPreferences, 
        exclusions, 
        language, 
        availableIngredients,
        householdType,
        weeklyBudget,
        mealTimings
      );
      if (plan && plan.length > 0) {
        setWeeklyPlan(plan);
        localStorage.setItem('rasoi_meal_plan', JSON.stringify(plan));
        // Reset selected options for new plan
        setSelectedMealOptions({});
      } else {
        setError("The AI returned an empty plan. Please try again with different preferences.");
      }
    } catch (error: any) {
      console.error("Failed to generate plan", error);
      setError(error.message || "An unexpected error occurred while generating your plan.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslateRecipe = async (targetLang: string) => {
    if (!selectedRecipe) return;
    setIsTranslating(true);
    setError(null);
    try {
      const translated = await translateRecipe(selectedRecipe, targetLang);
      setSelectedRecipe(translated);
    } catch (error: any) {
      console.error("Translation failed", error);
      setError(error.message || "Failed to translate the recipe. Please try again.");
    } finally {
      setIsTranslating(false);
    }
  };

  const LANGUAGES = ["English", "Hindi", "Gujarati", "Marathi", "Bengali", "Tamil", "Telugu", "Kannada"];

  const COMMON_EXCLUSIONS = ["Tofu", "Paneer", "Mushrooms", "Onion", "Garlic", "Peanuts", "Egg", "Milk"];

  const toggleExclusion = (item: string) => {
    setExclusions(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleVoiceInput = (target: 'preferences' | 'ingredients') => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error("Error stopping recognition", e);
        }
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      
      recognition.lang = LANGUAGE_TAGS[language] || 'en-IN';
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');

        if (event.results[0].isFinal) {
          if (target === 'preferences') {
            setAiPreferences(prev => prev ? `${prev}, ${transcript}` : transcript);
          } else {
            setAvailableIngredients(prev => prev ? `${prev}, ${transcript}` : transcript);
          }
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          alert("Microphone access denied. Please enable it in your browser settings.");
        } else if (event.error !== 'aborted') {
          console.error("Speech recognition error:", event.error);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognition.start();
    } catch (e) {
      console.error("Failed to start recognition:", e);
      setIsListening(false);
    }
  };

  const toggleSpeech = (text: string) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANGUAGE_TAGS[language] || 'en-IN';
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const toggleMealOption = (day: string, type: MealType) => {
    setSelectedMealOptions(prev => {
      const dayOptions = prev[day] || {};
      const currentIdx = dayOptions[type] || 0;
      return {
        ...prev,
        [day]: {
          ...dayOptions,
          [type]: currentIdx === 0 ? 1 : 0
        }
      };
    });
  };

  const QUICK_PREFS = [
    "Vegetarian", 
    "High Protein", 
    "No Onion/Garlic", 
    "Low Carb", 
    "Quick (Under 15m)", 
    "Gluten Free",
    "Vegan"
  ];

  const togglePreference = (pref: string) => {
    setAiPreferences(prev => {
      const prefs = prev.split(',').map(p => p.trim()).filter(p => p);
      if (prefs.includes(pref)) {
        return prefs.filter(p => p !== pref).join(', ');
      } else {
        return [...prefs, pref].join(', ');
      }
    });
  };

  const currentDayPlan = weeklyPlan.find(p => p.day === selectedDay);

  const getMealIcon = (type: MealType) => {
    switch (type) {
      case 'Breakfast': return <Coffee className="w-5 h-5" />;
      case 'Brunch': return <Sun className="w-5 h-5" />;
      case 'Lunch': return <Utensils className="w-5 h-5" />;
      case 'Dinner': return <Moon className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-secondary pb-20">
      {/* Header */}
      <header className="bg-white border-b border-primary/10 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-primary">Rasoi Smart</h1>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-400">Indian Meal Planner</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowShoppingList(true)}
              className="flex items-center gap-2 bg-secondary text-primary px-4 py-2 rounded-full text-sm font-medium hover:bg-primary/10 transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Shopping List</span>
            </button>
            <button 
              onClick={() => setShowAiPrompt(true)}
              className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-accent/20"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">AI Planner</span>
            </button>
          </div>
        </div>
        {aiPreferences && (
          <div className="max-w-5xl mx-auto px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-slate-50">
            <div className="flex items-center gap-1 bg-accent/5 text-accent text-[10px] font-bold px-2 py-0.5 rounded-full border border-accent/10 mr-2">
              <Globe className="w-2.5 h-2.5" />
              {language}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">Active Prefs:</span>
            {aiPreferences.split(',').map(p => p.trim()).filter(p => p).map(p => (
              <button 
                key={p} 
                onClick={() => togglePreference(p)}
                className="group flex items-center gap-1 bg-primary/5 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap border border-primary/10 hover:bg-accent/10 hover:text-accent hover:border-accent/20 transition-all"
              >
                {p}
                <X className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
            <button 
              onClick={() => setShowAiPrompt(true)}
              className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-primary transition-colors px-2"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          </div>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-8">
        {/* Day Selector */}
        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4">
          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border",
                selectedDay === day 
                  ? "bg-primary text-white border-primary shadow-md" 
                  : "bg-white text-slate-500 border-slate-200 hover:border-primary/30"
              )}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="mt-8">
          {error && (
            <div className="mb-8 bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm flex items-center gap-3">
              <Info className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
              <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-100 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full"
              />
              <p className="text-slate-500 font-serif italic">Curating your healthy Indian menu...</p>
            </div>
          ) : weeklyPlan.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
              <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-10 h-10 text-primary/40" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">No Meal Plan Found</h2>
              <p className="text-slate-500 mb-8 max-w-md mx-auto">
                Generate a personalized weekly meal plan tailored for your busy lifestyle with our AI assistant.
              </p>
              <button 
                onClick={() => setShowAiPrompt(true)}
                className="bg-primary text-white px-8 py-3 rounded-full font-medium hover:opacity-90 transition-opacity"
              >
                Create My First Plan
              </button>
            </div>
          ) : (
            <>
              {/* Daily Nutrition Summary */}
              {currentDayPlan && (
                <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Calories', value: Object.entries(currentDayPlan.meals).reduce((acc, [type, recipes]) => {
                      const selectedIdx = selectedMealOptions[selectedDay]?.[type] || 0;
                      const recipe = Array.isArray(recipes) ? recipes[selectedIdx] || recipes[0] : recipes;
                      return acc + (recipe?.nutrition?.calories || 0);
                    }, 0), unit: 'kcal', color: 'text-primary' },
                    { label: 'Total Protein', value: Object.entries(currentDayPlan.meals).reduce((acc, [type, recipes]) => {
                      const selectedIdx = selectedMealOptions[selectedDay]?.[type] || 0;
                      const recipe = Array.isArray(recipes) ? recipes[selectedIdx] || recipes[0] : recipes;
                      return acc + (recipe?.nutrition?.protein || 0);
                    }, 0), unit: 'g', color: 'text-accent' },
                    { label: 'Total Carbs', value: Object.entries(currentDayPlan.meals).reduce((acc, [type, recipes]) => {
                      const selectedIdx = selectedMealOptions[selectedDay]?.[type] || 0;
                      const recipe = Array.isArray(recipes) ? recipes[selectedIdx] || recipes[0] : recipes;
                      return acc + (recipe?.nutrition?.carbs || 0);
                    }, 0), unit: 'g', color: 'text-blue-500' },
                    { label: 'Total Fats', value: Object.entries(currentDayPlan.meals).reduce((acc, [type, recipes]) => {
                      const selectedIdx = selectedMealOptions[selectedDay]?.[type] || 0;
                      const recipe = Array.isArray(recipes) ? recipes[selectedIdx] || recipes[0] : recipes;
                      return acc + (recipe?.nutrition?.fats || 0);
                    }, 0), unit: 'g', color: 'text-yellow-600' },
                    { label: 'Daily Cost', value: Object.entries(currentDayPlan.meals).reduce((acc, [type, recipes]) => {
                      const selectedIdx = selectedMealOptions[selectedDay]?.[type] || 0;
                      const recipe = Array.isArray(recipes) ? recipes[selectedIdx] || recipes[0] : recipes;
                      return acc + (recipe?.estimatedCost || 0);
                    }, 0), unit: '', color: 'text-emerald-600' },
                  ].map((stat, i) => (
                    <div key={i} className={cn(
                      "bg-white p-4 rounded-2xl border border-slate-100 shadow-sm",
                      stat.label === 'Daily Cost' ? "col-span-2 sm:col-span-4 bg-emerald-50/30 border-emerald-100" : ""
                    )}>
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">{stat.label}</p>
                      <p className={cn("text-xl font-bold", stat.color)}>
                        {stat.label === 'Daily Cost' && (weeklyBudget.includes('₹') || !weeklyBudget.includes('$')) ? '₹' : ''}
                        {stat.label === 'Daily Cost' && weeklyBudget.includes('$') ? '$' : ''}
                        {stat.value} <span className="text-xs font-normal text-slate-400">{stat.unit}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <motion.div 
                key={selectedDay}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
              {currentDayPlan && Object.entries(currentDayPlan.meals).map(([type, recipes]) => {
                const selectedIdx = selectedMealOptions[selectedDay]?.[type] || 0;
                const recipe = Array.isArray(recipes) ? recipes[selectedIdx] || recipes[0] : recipes;
                
                if (!recipe) return null;

                return (
                  <motion.div 
                    key={type}
                    whileHover={{ y: -4 }}
                    className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group relative"
                    onClick={() => setSelectedRecipe(recipe)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center text-primary">
                          {getMealIcon(type as MealType)}
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {Array.isArray(recipes) && recipes.length > 1 && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMealOption(selectedDay, type as MealType);
                            }}
                            className="px-2 py-1 bg-primary/5 text-primary text-[10px] font-bold rounded-lg border border-primary/10 hover:bg-primary/10 transition-colors"
                          >
                            Option {selectedIdx + 1} of {recipes.length}
                          </button>
                        )}
                        <div className="flex items-center gap-1 text-accent">
                          <Zap className="w-4 h-4 fill-current" />
                          <span className="text-xs font-bold">{recipe.nutrition?.calories || 0} kcal</span>
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">{recipe.name}</h3>
                    {recipe.advancePrep && (
                      <div className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100 w-fit">
                        <Clock className="w-3 h-3" />
                        {recipe.advancePrep}
                      </div>
                    )}
                    <p className="text-slate-500 text-sm line-clamp-2 mb-4 leading-relaxed">
                      {recipe.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-slate-400 text-xs font-medium">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{(recipe.prepTime || 0) + (recipe.cookTime || 0)} mins</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5" />
                        <span>{recipe.nutrition?.protein || 0}g Protein</span>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-600 font-bold">
                        <span>
                          {(weeklyBudget.includes('₹') || !weeklyBudget.includes('$')) ? '₹' : ''}
                          {weeklyBudget.includes('$') ? '$' : ''}
                          {recipe.estimatedCost || 0}
                        </span>
                      </div>
                      <div className="ml-auto">
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
            
            {/* Quick Tips Section */}
            <div className="mt-12 bg-primary/5 rounded-3xl p-8 border border-primary/10">
              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                Pro Tips for Busy Professionals
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-primary/60">Meal Prep</p>
                  <p className="text-sm text-slate-600 leading-relaxed">Chop veggies and prepare ginger-garlic paste on Sunday to save 15 mins daily.</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-primary/60">Nutrition</p>
                  <p className="text-sm text-slate-600 leading-relaxed">Add a bowl of curd or a glass of buttermilk to your lunch for better digestion.</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-primary/60">Time Saver</p>
                  <p className="text-sm text-slate-600 leading-relaxed">Use a pressure cooker or Instant Pot for dals and rice to cut cooking time by 50%.</p>
                </div>
              </div>
            </div>
            </>
          )}
        </div>
      </main>

      {/* AI Prompt Modal */}
      <AnimatePresence>
        {showAiPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAiPrompt(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 pb-4 border-b border-slate-100">
                <div className="absolute top-0 right-0 p-6">
                  <button onClick={() => setShowAiPrompt(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-semibold">AI Menu Planner</h2>
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Personalize your weekly Indian meal plan.
                  </p>
                  <button 
                    onClick={() => {
                      setAiPreferences('');
                      setAvailableIngredients('');
                      setWeeklyBudget('');
                      setHouseholdType('Single');
                    }}
                    className="text-[10px] font-bold uppercase tracking-widest text-accent hover:underline"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="p-8 overflow-y-auto no-scrollbar flex-1">
                <div className="mb-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3">Household Type</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {['Single', 'Family', 'Child', 'Elderly'].map(type => (
                      <button
                        key={type}
                        onClick={() => setHouseholdType(type)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-medium transition-all border text-left flex items-center justify-between",
                          householdType === type
                            ? "bg-primary/10 text-primary border-primary/20"
                            : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300"
                        )}
                      >
                        {type}
                        {householdType === type && <div className="w-2 h-2 bg-primary rounded-full" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3">Weekly Budget</h3>
                  <div className="relative">
                    <input
                      type="text"
                      value={weeklyBudget}
                      onChange={(e) => setWeeklyBudget(e.target.value)}
                      placeholder="E.g. ₹2000, $50, Low budget..."
                      className="w-full bg-secondary border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3">Meal Timings</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(mealTimings).map(([meal, time]) => (
                      <div key={meal} className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">{meal}</label>
                        <input
                          type="text"
                          value={time}
                          onChange={(e) => setMealTimings(prev => ({ ...prev, [meal]: e.target.value }))}
                          placeholder="e.g. 08:00 AM"
                          className="w-full bg-secondary border-none rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3">Preferences</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {QUICK_PREFS.map(pref => (
                      <button
                        key={pref}
                        onClick={() => togglePreference(pref)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                          aiPreferences.includes(pref)
                            ? "bg-primary/10 text-primary border-primary/20"
                            : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300"
                        )}
                      >
                        {pref}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <textarea
                      value={aiPreferences}
                      onChange={(e) => setAiPreferences(e.target.value)}
                      placeholder="E.g. High protein, quick 15-min recipes..."
                      className="w-full h-24 bg-secondary border-none rounded-2xl p-4 pr-12 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                    />
                    <button
                      onClick={() => handleVoiceInput('preferences')}
                      className={cn(
                        "absolute bottom-4 right-4 p-2 rounded-xl transition-all shadow-sm",
                        isListening && listeningTarget === 'preferences'
                          ? "bg-red-500 text-white animate-pulse" 
                          : "bg-white text-slate-400 hover:text-primary hover:shadow-md"
                      )}
                    >
                      {isListening && listeningTarget === 'preferences' ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3">Available Ingredients</h3>
                  <div className="relative">
                    <textarea
                      value={availableIngredients}
                      onChange={(e) => setAvailableIngredients(e.target.value)}
                      placeholder="E.g. Spinach, tomatoes, chickpeas..."
                      className="w-full h-24 bg-secondary border-none rounded-2xl p-4 pr-12 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                    />
                    <button
                      onClick={() => handleVoiceInput('ingredients')}
                      className={cn(
                        "absolute bottom-4 right-4 p-2 rounded-xl transition-all shadow-sm",
                        isListening && listeningTarget === 'ingredients'
                          ? "bg-red-500 text-white animate-pulse" 
                          : "bg-white text-slate-400 hover:text-primary hover:shadow-md"
                      )}
                    >
                      {isListening && listeningTarget === 'ingredients' ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3">Language</h3>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map(lang => (
                      <button
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                          language === lang
                            ? "bg-primary text-white border-primary"
                            : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300"
                        )}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3">Exclude</h3>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_EXCLUSIONS.map(item => (
                      <button
                        key={item}
                        onClick={() => toggleExclusion(item)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium transition-all border flex items-center gap-2",
                          exclusions.includes(item)
                            ? "bg-red-50 text-red-600 border-red-200"
                            : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300"
                        )}
                      >
                        {exclusions.includes(item) ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="p-8 pt-4 border-t border-slate-100 bg-slate-50/50">
                <button 
                  onClick={handleGenerateAiPlan}
                  disabled={isLoading}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-primary/20 mb-3"
                >
                  {isLoading ? "Generating..." : "Generate Weekly Plan"}
                </button>
                <button 
                  onClick={() => {
                    if (confirm("Are you sure you want to clear all your preferences and meal plans?")) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                  className="w-full bg-slate-200 text-slate-600 py-3 rounded-2xl font-medium text-sm hover:bg-slate-300 transition-colors"
                >
                  Reset All Data
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Recipe Detail Modal */}
      <AnimatePresence>
        {selectedRecipe && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRecipe(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-2xl h-[90vh] sm:h-auto sm:max-h-[85vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 sm:p-8 overflow-y-auto no-scrollbar">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-3xl font-semibold text-primary leading-tight">{selectedRecipe.name}</h2>
                      <button
                        onClick={() => toggleSpeech(`${selectedRecipe.name}. ${selectedRecipe.description}. Ingredients: ${selectedRecipe.ingredients.join(', ')}`)}
                        className={cn(
                          "p-2 rounded-full transition-all",
                          isSpeaking ? "bg-accent text-white" : "bg-secondary text-slate-400 hover:text-primary"
                        )}
                        title={isSpeaking ? "Stop Speaking" : "Listen to Recipe"}
                      >
                        {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-slate-500 italic font-serif">{selectedRecipe.description}</p>
                    <div className="mt-4 flex flex-wrap gap-3 items-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Read in:</span>
                      {LANGUAGES.filter(l => l !== "English").slice(0, 3).map(lang => (
                        <button
                          key={lang}
                          disabled={isTranslating}
                          onClick={() => handleTranslateRecipe(lang)}
                          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-accent hover:underline disabled:opacity-50"
                        >
                          <Globe className="w-3 h-3" />
                          {lang}
                        </button>
                      ))}
                      {isTranslating && (
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-3 h-3 border-2 border-accent/20 border-t-accent rounded-full"
                        />
                      )}
                    </div>
                  </div>
                  <button onClick={() => setSelectedRecipe(null)} className="p-2 bg-secondary rounded-full text-slate-400 hover:text-slate-600 ml-4">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                  <div className="bg-secondary/50 p-4 rounded-2xl text-center">
                    <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Total Time</span>
                    <span className="text-sm font-semibold">{(selectedRecipe.prepTime || 0) + (selectedRecipe.cookTime || 0)}m</span>
                  </div>
                  <div className="bg-secondary/50 p-4 rounded-2xl text-center">
                    <Flame className="w-5 h-5 text-accent mx-auto mb-1" />
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Protein</span>
                    <span className="text-sm font-semibold">{selectedRecipe.nutrition?.protein || 0}g</span>
                  </div>
                  <div className="bg-secondary/50 p-4 rounded-2xl text-center">
                    <Zap className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Calories</span>
                    <span className="text-sm font-semibold">{selectedRecipe.nutrition?.calories || 0}</span>
                  </div>
                  <div className="bg-secondary/50 p-4 rounded-2xl text-center">
                    <Info className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Carbs</span>
                    <span className="text-sm font-semibold">{selectedRecipe.nutrition?.carbs || 0}g</span>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-2xl text-center border border-emerald-100 col-span-2 sm:col-span-4">
                    <span className="block text-[10px] uppercase font-bold text-emerald-600 mb-1">Estimated Cost</span>
                    <span className="text-xl font-bold text-emerald-700">
                      {(weeklyBudget.includes('₹') || !weeklyBudget.includes('$')) ? '₹' : ''}
                      {weeklyBudget.includes('$') ? '$' : ''}
                      {selectedRecipe.estimatedCost || 0}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    {selectedRecipe.advancePrep && (
                      <div className="mb-8 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-amber-700 mb-2 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Advance Preparation
                        </h4>
                        <p className="text-sm text-amber-800 leading-relaxed">
                          {selectedRecipe.advancePrep}
                        </p>
                      </div>
                    )}
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <div className="w-1.5 h-6 bg-accent rounded-full" />
                      Ingredients
                    </h4>
                    <ul className="space-y-3">
                      {selectedRecipe.ingredients.map((ing, i) => (
                        <li key={i} className="flex items-center gap-3 text-slate-600 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/30" />
                          {ing}
                        </li>
                      ))}
                    </ul>

                    {selectedRecipe.shoppingList && selectedRecipe.shoppingList.length > 0 && (
                      <div className="mt-8">
                        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <ShoppingCart className="w-5 h-5 text-accent" />
                          Shopping List
                        </h4>
                        <ul className="space-y-2">
                          {selectedRecipe.shoppingList.map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-slate-600 text-sm bg-accent/5 p-2 rounded-lg border border-accent/10">
                              <div className="w-4 h-4 rounded border border-accent/30 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <div className="w-1.5 h-6 bg-primary rounded-full" />
                      Instructions
                    </h4>
                    <ol className="space-y-4">
                      {selectedRecipe.instructions.map((step, i) => (
                        <li key={i} className="flex gap-4 text-slate-600 text-sm leading-relaxed">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-primary">
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>

                    {selectedRecipe.youtubeUrl && (
                      <div className="mt-8">
                        <a 
                          href={selectedRecipe.youtubeUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-3 bg-[#FF0000] text-white py-4 rounded-2xl font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-red-500/20"
                        >
                          <Youtube className="w-6 h-6" />
                          Watch Video Tutorial
                        </a>
                        <p className="text-[10px] text-center text-slate-400 mt-2 uppercase font-bold tracking-widest">Highly Rated Recipe Video</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-white border-t border-slate-100 mt-auto">
                <button 
                  onClick={() => setSelectedRecipe(null)}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-semibold"
                >
                  Got it, thanks!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Shopping List Modal */}
      <AnimatePresence>
        {showShoppingList && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShoppingList(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-semibold">Weekly Shopping List</h2>
                </div>
                <button onClick={() => setShowShoppingList(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
                {weeklyPlan.length === 0 ? (
                  <p className="text-center text-slate-500 py-10">Generate a meal plan first to see your shopping list.</p>
                ) : (
                  <div className="space-y-6">
                    {weeklyPlan.map((dayPlan) => (
                      <div key={dayPlan.day} className="space-y-3">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-primary/60 border-b border-primary/10 pb-1">
                          {dayPlan.day}
                        </h3>
                        <div className="grid grid-cols-1 gap-2">
                          {Object.entries(dayPlan.meals).map(([type, recipes], idx) => {
                            const selectedIdx = selectedMealOptions[dayPlan.day]?.[type] || 0;
                            const recipe = Array.isArray(recipes) ? recipes[selectedIdx] || recipes[0] : recipes;
                            if (!recipe) return null;
                            return (
                              <div key={idx} className="space-y-1">
                                <p className="text-xs font-semibold text-slate-400">{recipe.name}</p>
                                <ul className="grid grid-cols-1 gap-1">
                                  {recipe.shoppingList?.map((item, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                                      <div className="w-3 h-3 rounded border border-slate-300 flex-shrink-0" />
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-slate-100">
                <button 
                  onClick={() => window.print()}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <Download className="w-5 h-5" />
                  Print Shopping List
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Nav (Mobile Only) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-100 px-6 py-3 flex justify-around items-center z-40">
        <button className="flex flex-col items-center gap-1 text-primary">
          <Calendar className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Planner</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-400">
          <ChefHat className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Recipes</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-400">
          <Sparkles className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">AI</span>
        </button>
      </div>
    </div>
  );
}
