import LeftSidebar from "@/components/layout/LeftSidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import MobileTopBar from "@/components/layout/MobileTopBar";
import BottomNav from "@/components/layout/BottomNav";
import PodcastPlayer from "@/components/layout/PodcastPlayer";

export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative flex min-h-screen flex-col bg-black-3">
      <div className="relative flex flex-1">
        <LeftSidebar />
        <main className="flex min-w-0 flex-1 flex-col px-4 sm:px-10 lg:px-14">
          <div className="mx-auto flex w-full max-w-5xl flex-col">
            <MobileTopBar />
            <div className="flex flex-col pb-14">{children}</div>
          </div>
          {/* Keeps the last content visible above the fixed player and mobile tab bar */}
          <div aria-hidden className="h-[calc(var(--player-h)+var(--nav-h))] shrink-0" />
        </main>
        <RightSidebar />
      </div>
      <PodcastPlayer />
      <BottomNav />
    </div>
  );
}
