"use client";

export function BlockedScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
          <svg className="h-8 w-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Акаунт заблоковано
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Ваш акаунт заблоковано адміністратором. Зверніться до адміністратора для отримання доступу.
        </p>
      </div>
    </div>
  );
}
