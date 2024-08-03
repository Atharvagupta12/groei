import LeftSidebar from "@/components/ui/LeftSidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
   <div>
    <main>
       <LeftSidebar/>
        {children}
        <p  className='text-white-2'>  RIGHT SIDEBAR</p>
    </main>
   </div>
  );
}
