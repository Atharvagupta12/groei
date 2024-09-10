/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript:{
ignoreBuildErrors: true
    },
    images:{
        remotePatterns: [
            {
                protocol:'https',
                hostname: 'lovely-flamingo-139.convex.cloud'
            },
            {
                protocol:'https',
                hostname: 'canny-opossum-433.convex.cloud'
            },
            {
                protocol:'https',
                hostname: 'img.clerk.com'
            },
        ]
    }
};

export default nextConfig;
