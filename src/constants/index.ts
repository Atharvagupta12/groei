export const sidebarLinks = [
  { imgURL: "/icons/home.svg", route: "/", label: "Home" },
  { imgURL: "/icons/discover.svg", route: "/discover", label: "Discover" },
  { imgURL: "/icons/microphone.svg", route: "/create-podcast", label: "Create Podcast" },
] as const;

export const isActiveRoute = (pathname: string, route: string) =>
  route === "/" ? pathname === "/" : pathname === route || pathname.startsWith(`${route}/`);
