export default function FriendSkeleton() {
    return (
        <div className="flex items-center justify-between p-3 rounded-lg animate-pulse">
            <div className="flex items-center space-x-3 flex-1">
                <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 rounded"></div>
                    <div className="h-3 w-1/4 bg-slate-200 dark:bg-slate-800 rounded"></div>
                </div>
            </div>
            <div className="flex space-x-2">
                <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-800"></div>
            </div>
        </div>
    );
}
