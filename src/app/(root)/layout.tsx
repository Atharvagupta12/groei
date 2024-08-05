import MobileNav from "@/components/MobileNav";
import LeftSidebar from "@/components/ui/LeftSidebar";
<<<<<<< HEAD
import RightSidebar from "@/components/ui/RightSidebar";
=======
>>>>>>> 29f0869985219850409294b7b3da93c6c2b9e1b1
import Image from "next/image";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative flex flex-col">
      <main className="relative flex bg-black-3">
        <LeftSidebar />

<<<<<<< HEAD
        <section className=" flex min-h-screen flex-1 flex-col px-4 sm:px-14">
=======
        <section className="border-2 border-red-500 flex min-h-screen flex-1 flex-col px-4 sm:px-14">
>>>>>>> 29f0869985219850409294b7b3da93c6c2b9e1b1
          <div className="mx-auto w-full max-w-5xl flex-col max-sm:px-4">
            <div className="flex h-16 items-center justify-between md:hidden">
              <Image
                src="/icons/logo.svg"
                width={30}
                height={30}
                alt="menu icon"
              />
             < MobileNav /> 
            </div>
            <div className="flex flex-col md:pb-14">
              Toaster 
              {children}
            </div>
          </div>
        </section>

<<<<<<< HEAD
       <RightSidebar/>
=======
        <p className="text-white-2"> RIGHT SIDEBAR</p>
>>>>>>> 29f0869985219850409294b7b3da93c6c2b9e1b1
      </main>
    </div>
  );
}
