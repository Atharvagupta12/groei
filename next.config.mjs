/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets a verification build run next to `next dev` without the two overwriting each other
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    remotePatterns: [
      // Convex file storage (any deployment, so changing deployments never breaks images)
      { protocol: "https", hostname: "**.convex.cloud" },
      // Clerk avatars
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "images.clerk.dev" },
    ],
  },
};

export default nextConfig;
