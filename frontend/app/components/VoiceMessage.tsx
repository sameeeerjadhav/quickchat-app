'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface VoiceMessageProps {
    audioUrl: string;
    duration: number;
    isOwn: boolean;
}

export default function VoiceMessage({ audioUrl, duration, isOwn }: VoiceMessageProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const audioRef = useRef<HTMLAudioElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    const togglePlayback = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const audio = audioRef.current;
        const progressBar = progressRef.current;
        if (!audio || !progressBar) return;

        const rect = progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        audio.currentTime = percentage * duration;
    };

    const cycleSpeed = () => {
        const speeds = [1, 1.5, 2];
        const currentIndex = speeds.indexOf(playbackSpeed);
        const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
        setPlaybackSpeed(nextSpeed);
        if (audioRef.current) {
            audioRef.current.playbackRate = nextSpeed;
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div
            className={`flex items-center gap-2 p-3 rounded-2xl max-w-xs ${isOwn
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white'
                }`}
        >
            <audio ref={audioRef} src={audioUrl} preload="metadata" />

            {/* Play/Pause Button */}
            <button
                onClick={togglePlayback}
                className={`p-2 rounded-full transition-all active:scale-95 ${isOwn
                        ? 'bg-white/20 hover:bg-white/30'
                        : 'bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                    }`}
            >
                {isPlaying ? (
                    <Pause className={`h-4 w-4 ${isOwn ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
                ) : (
                    <Play className={`h-4 w-4 ${isOwn ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
                )}
            </button>

            {/* Waveform/Progress */}
            <div className="flex-1 flex flex-col gap-1">
                <div
                    ref={progressRef}
                    onClick={handleProgressClick}
                    className="h-1 bg-white/20 dark:bg-slate-700 rounded-full cursor-pointer overflow-hidden"
                >
                    <div
                        className={`h-full rounded-full transition-all ${isOwn ? 'bg-white' : 'bg-blue-600'
                            }`}
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="flex items-center justify-between text-xs opacity-80">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* Playback Speed */}
            <button
                onClick={cycleSpeed}
                className={`px-2 py-1 rounded text-xs font-medium transition-all active:scale-95 ${isOwn
                        ? 'bg-white/20 hover:bg-white/30'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
            >
                {playbackSpeed}x
            </button>
        </div>
    );
}
