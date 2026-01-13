import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
    ],
  },

  // If you really need this custom field:
  allowedDevOrigins: ["local-origin.dev", "*.local-origin.dev"],
};

export default nextConfig;






// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
//   images: {
//     remotePatterns: [
//       {
//         protocol: "https",
//         hostname: "lh3.googleusercontent.com",
//       },
//       {
//         protocol: "https",
//         hostname: "storage.googleapis.com", // your video assets
//       }
//     ],
//   },
// };

// module.exports = {
//   allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev'],
// }

// export default nextConfig;
