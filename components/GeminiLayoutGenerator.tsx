
import React, { useState } from 'react';
import { generatePlateLayout } from '../services/geminiService';
import { Well } from '../types';
import { SparklesIcon } from './icons/Icons';

interface GeminiLayoutGeneratorProps {
    setPlateData: (data: Well[]) => void;
    clearSelection: () => void;
}

const GeminiLayoutGenerator: React.FC<GeminiLayoutGeneratorProps> = ({ setPlateData, clearSelection }) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const examplePrompts = [
        "Create a checkerboard layout alternating Drug A at 10uM and a blank control.",
        "Set up a 5-point serial dilution of Paclitaxel, starting at 100uM with log2 steps, in triplicate in columns 1-3.",
        "Design an experiment with positive controls (10uM Doxorubicin) in row A and negative controls (DMSO) in row H."
    ];

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a description of the experiment.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const newPlateData = await generatePlateLayout(prompt);
            setPlateData(newPlateData);
            clearSelection();
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleExampleClick = (example: string) => {
        setPrompt(example);
    }

    return (
        <div className="p-4 space-y-4">
            <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">AI Layout Assistant</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
                Describe your desired plate layout in plain English. The AI will generate the design for you.
            </p>
            
            <div className="space-y-1">
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Experimental Design</label>
                <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={6}
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm focus:border-sciblue-500 focus:ring-sciblue-500 sm:text-sm"
                    placeholder="e.g., A serial dilution of compound X in columns 1-6..."
                    disabled={isLoading}
                />
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-400">
                <p className="font-medium">Try an example:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                    {examplePrompts.map((ex, i) => (
                        <li key={i}><button onClick={() => handleExampleClick(ex)} className="text-left text-sciblue-600 dark:text-sciblue-400 hover:underline">{ex}</button></li>
                    ))}
                </ul>
            </div>

            <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full flex items-center justify-center bg-sciblue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-sciblue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sciblue-500 disabled:bg-sciblue-400"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                    </>
                ) : (
                    <>
                        <SparklesIcon /> <span className="ml-2">Generate Layout</span>
                    </>
                )}
            </button>
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>
    );
};

export default GeminiLayoutGenerator;
