import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="p-4 pt-18 pb-24 md:p-8 md:pt-8 md:pb-8 max-w-6xl mx-auto min-h-full">
          {children}
        </div>
      </main>
    </div>
  )
}
