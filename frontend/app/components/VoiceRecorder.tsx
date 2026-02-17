'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, X, Send, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface VoiceRecorderProps {
    onSend: (audioBlob: Blob, duration: number) => void;
    onCancel: () => void;
}

export default function VoiceRecorder({ onSend, onCancel }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [duration, setDuration] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [waveformData, setWaveformData] = useState<number[]>(new Array(40).fill(0));

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        startRecording();
        return () => {
            stopRecording();
            if (timerRef.current) clearInterval(timerRef.current);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (audioContextRef.current) audioContextRef.current.close();
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Create audio context for waveform visualization
            audioContextRef.current = new AudioContext();
            analyserRef.current = audioContextRef.current.createAnalyser();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyserRef.current);
            analyserRef.current.fftSize = 256;

            visualizeWaveform();

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);

            // Start timer - increment by 1 second
            let seconds = 0;
            timerRef.current = setInterval(() => {
                seconds += 1;
                setDuration(seconds);
                if (seconds >= 300) { // Max 5 minutes
                    handleStop();
                }
            }, 1000);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Unable to access microphone. Please check permissions.');
            onCancel();
        }
    };

    const visualizeWaveform = () => {
        if (!analyserRef.current) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const animate = () => {
            if (!analyserRef.current) return;

            analyserRef.current.getByteFrequencyData(dataArray);

            // Get average amplitude for each bar
            const barCount = 40;
            const barWidth = Math.floor(bufferLength / barCount);
            const newData = Array.from({ length: barCount }, (_, i) => {
                const start = i * barWidth;
                const end = start + barWidth;
                const slice = dataArray.slice(start, end);
                const average = slice.reduce((a, b) => a + b, 0) / slice.length;
                return average / 255; // Normalize to 0-1
            });

            setWaveformData(newData);
            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animate();
    };

    const handleStop = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        }
    };

    const handleSend = () => {
        if (audioBlob) {
            onSend(audioBlob, duration);
        }
    };

    const handleDelete = () => {
        stopRecording();
        onCancel();
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            if (mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
        if (timerRef.current) clearInterval(timerRef.current);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current) audioContextRef.current.close();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white dark:bg-black border-t border-slate-200 dark:border-slate-800 p-4"
        >
            <div className="flex items-center gap-3">
                {/* Delete Button */}
                <button
                    onClick={handleDelete}
                    className="p-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    title="Cancel"
                >
                    <Trash2 className="h-5 w-5" />
                </button>

                {/* Waveform Visualization */}
                <div className="flex-1 flex items-center gap-3">
                    {/* Recording Indicator */}
                    {isRecording && (
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium text-red-600 dark:text-red-400">
                                {formatTime(duration)}
                            </span>
                        </div>
                    )}

                    {/* Waveform */}
                    <div className="flex-1 flex items-center justify-center gap-0.5 h-12">
                        {waveformData.map((amplitude, index) => (
                            <div
                                key={index}
                                className="w-1 bg-blue-500 rounded-full transition-all duration-100"
                                style={{
                                    height: `${Math.max(4, amplitude * 48)}px`,
                                    opacity: isRecording ? 0.8 : 0.3,
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Send Button */}
                <button
                    onClick={audioBlob ? handleSend : handleStop}
                    disabled={duration < 1}
                    className="p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                    title={audioBlob ? 'Send' : 'Stop & Send'}
                >
                    <Send className="h-5 w-5" />
                </button>
            </div>

            {/* Max duration warning */}
            {duration >= 270 && duration < 300 && (
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 text-center">
                    {300 - duration} seconds remaining
                </p>
            )}
        </motion.div>
    );
}
