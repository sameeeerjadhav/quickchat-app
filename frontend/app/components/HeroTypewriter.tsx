'use client';

import { useState, useEffect } from 'react';

export default function HeroTypewriter() {
    const [text, setText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [loopNum, setLoopNum] = useState(0);
    const [typingSpeed, setTypingSpeed] = useState(50);

    const prefix = "A high-performance messaging interface for teams who value ";
    const words = ["speed.", "clarity.", "security."];
    const finalPhrase = "speed, clarity, and security without the bloat.";

    useEffect(() => {
        let timer: NodeJS.Timeout;

        const handleTyping = () => {
            const isFinalPhase = loopNum >= words.length;
            const currentWord = isFinalPhase ? finalPhrase : words[loopNum];
            const fullText = prefix + currentWord;

            // Determine target text based on deletion state
            const targetText = isDeleting
                ? prefix
                : fullText;

            setText((prev) => {
                // If we are aiming for the target, move one step closer
                if (prev === targetText) {
                    // Finished typing or deleting this cycle
                    if (!isDeleting && !isFinalPhase) {
                        // Finished typing a word, pause then delete
                        setTypingSpeed(1000); // Pause at end of word
                        setIsDeleting(true);
                        return prev;
                    } else if (isDeleting && !isFinalPhase) {
                        // Finished deleting, move to next word
                        setIsDeleting(false);
                        setLoopNum(l => l + 1);
                        setTypingSpeed(50);
                        return prev;
                    } else if (isFinalPhase) {
                        // Finished final phrase
                        return prev; // Stop here
                    }
                }

                // Calculate next character
                setTypingSpeed(isDeleting ? 30 : 50);
                if (isDeleting) {
                    return prev.slice(0, -1);
                } else {
                    return targetText.slice(0, prev.length + 1);
                }
            });
        };

        timer = setTimeout(handleTyping, typingSpeed);
        return () => clearTimeout(timer);
    }, [text, isDeleting, loopNum, typingSpeed]);

    return (
        <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed h-[3.5rem] sm:h-[3rem]">
            {text}
            <span className="animate-pulse border-r-2 border-blue-600 ml-1 inline-block h-5 align-middle"></span>
        </p>
    );
}
