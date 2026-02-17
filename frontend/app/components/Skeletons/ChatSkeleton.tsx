export default function ChatSkeleton() {
    return (
        <div className="space-y-4 p-4 opacity-50">
            {/* Received message */}
            <div className="flex items-end gap-2">
                <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0"></div>
                <div className="space-y-2 max-w-[70%]">
                    <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-2xl rounded-bl-none"></div>
                </div>
            </div>

            {/* Sent message */}
            <div className="flex items-end gap-2 justify-end">
                <div className="space-y-2 max-w-[70%]">
                    <div className="h-16 w-48 bg-slate-200 dark:bg-slate-800 rounded-2xl rounded-br-none"></div>
                </div>
                <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0"></div>
            </div>

            {/* Received message */}
            <div className="flex items-end gap-2">
                <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0"></div>
                <div className="space-y-2 max-w-[70%]">
                    <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-2xl rounded-bl-none"></div>
                    <div className="h-12 w-40 bg-slate-200 dark:bg-slate-800 rounded-2xl rounded-bl-none"></div>
                </div>
            </div>
        </div>
    );
}
