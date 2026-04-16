import { Sidebar } from "./sidebar";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 min-w-0 lg:pl-64">
        <div className="mx-auto max-w-[1180px] px-5 sm:px-8 md:px-12 py-8 sm:py-12 lg:py-14">
          {children}
        </div>
      </main>
    </div>
  );
}
