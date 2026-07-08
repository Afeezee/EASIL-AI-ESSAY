import React from 'react';
import { Clock } from 'lucide-react';

export default function Timer({ timeLeft, onTimeUp, isPaused = false }) {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    React.useEffect(() => {
        if (timeLeft <= 0) {
            onTimeUp();
        }
    }, [timeLeft, onTimeUp]);

    const timeColor = timeLeft < 60 ? "text-red-600" : timeLeft < 300 ? "text-orange-600" : "text-purple-700";
    const bgColor = timeLeft < 60 ? "bg-red-100 border-red-200" : timeLeft < 300 ? "bg-orange-100 border-orange-200" : "bg-purple-100 border-purple-200";

    return (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium border-2 ${bgColor} ${timeColor}`}>
            <Clock className="w-5 h-5" />
            <span className="tabular-nums text-lg">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
            {isPaused && (
                <span className="text-xs text-slate-500 ml-2">(Paused)</span>
            )}
        </div>
    );
}