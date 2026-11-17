import type { SignIn } from "@clerk/nextjs";

type Appearance = NonNullable<React.ComponentProps<typeof SignIn>["appearance"]>;

/** Makes Clerk's form blend into the auth page, which provides its own heading, instead of rendering a floating card. */
export const authFormAppearance: Appearance = {
  elements: {
    rootBox: "w-full",
    cardBox: "w-full max-w-none shadow-none border-0 rounded-none bg-transparent",
    card: "w-full bg-transparent shadow-none border-0 p-0 gap-6",
    header: "hidden",
    footer: "bg-none bg-transparent pt-2 [&>div:first-child]:bg-transparent",
    socialButtonsBlockButton:
      "h-11 border-white/10 bg-white/[0.04] text-white-1 hover:bg-white/[0.08] transition-colors",
    socialButtonsBlockButtonText: "font-semibold",
    dividerLine: "bg-white/10",
    dividerText: "text-white-3",
    formFieldLabel: "text-white-2 font-medium",
    formFieldInput: "h-11 border-white/10 bg-white/[0.04] focus:border-violet-500 focus:ring-violet-500/30",
    formButtonPrimary: "h-11 bg-violet-600 hover:bg-violet-500 text-[15px] font-bold shadow-lg shadow-violet-900/30",
    footerActionText: "text-white-3",
    footerActionLink: "text-violet-400 hover:text-violet-300 font-semibold",
    identityPreviewEditButton: "text-violet-400",
    formResendCodeLink: "text-violet-400",
    otpCodeFieldInput: "border-white/15",
  },
};
