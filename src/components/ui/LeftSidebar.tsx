import Image from "next/image";
import Link from "next/link";
import React from "react";
import { sidebarLinks } from "../../../constants";

const LeftSidebar = () => {
  return (
    <section className="left_sidebar">
      <nav className="flex flex-col gap-6">
        <Link
          href="/"
          className="flex items-center pb-10 max-lg:justify-center cursor-pointer gap-1 "
        >
          <Image src="/icons/logo.svg" alt="logo" width={23} height={23} />
          <h1 className="text-24 font-extrabold text-white max:lg:hidden">
            Gorei
          </h1>
        </Link>

        {sidebarLinks.map(({route, label}) => {
            return <Link href={route}>
            {label}
            </Link>
        })
        }
      </nav>
    </section>
  );
};

export default LeftSidebar;
