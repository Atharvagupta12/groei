import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
}

export default function EmptyState({ title, description, buttonLink, buttonText }: EmptyStateProps) {
  return (
    <section className="flex-center w-full flex-col gap-3 py-10">
      <Image src="/icons/emptyState.svg" width={200} height={200} alt="" />
      <div className="flex-center w-full max-w-[320px] flex-col gap-3">
        <h2 className="text-16 text-center font-semibold text-white-1">{title}</h2>
        {description && <p className="text-14 text-center text-white-2">{description}</p>}
        {buttonLink && buttonText && (
          <Button asChild className="mt-2 gap-2 bg-violet-600 font-bold hover:bg-violet-500">
            <Link href={buttonLink}>
              <Image src="/icons/discover.svg" width={18} height={18} alt="" />
              {buttonText}
            </Link>
          </Button>
        )}
      </div>
    </section>
  );
}
