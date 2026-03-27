const TAVUS_URL = import.meta.env.VITE_TAVUS_CONVERSATION_URL as string | undefined;

export default function PennyAvatar() {
  if (!TAVUS_URL) {
    return (
      <div className="bg-white rounded-2xl border border-amber-100 p-6 flex flex-col items-center justify-center min-h-[300px]">
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full bg-violet-100 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-violet-200 animate-pulse flex items-center justify-center">
              <span className="text-4xl">🤖</span>
            </div>
          </div>
          <div className="absolute inset-0 rounded-full border-4 border-violet-300 animate-ping opacity-30" />
        </div>
        <p className="text-violet-700 font-bold text-lg">Penny is getting ready...</p>
        <p className="text-stone-400 text-sm mt-1">Your AI financial guide will appear here</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-amber-100 overflow-hidden">
      <div className="bg-violet-50 px-4 py-3 flex items-center gap-2 border-b border-violet-100">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-sm font-semibold text-violet-700">Penny — Live</span>
      </div>
      <iframe src={TAVUS_URL} width="100%" height="480" allow="camera;microphone" title="Penny AI Financial Coach" className="block" />
    </div>
  );
}
