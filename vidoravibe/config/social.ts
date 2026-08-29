export type SocialLink = {
  name: string;
  url: string;
};

export const socialLinks: SocialLink[] = [
  {
    name: "Instagram",
    url: process.env.NEXT_PUBLIC_VIDORAVIBE_INSTAGRAM_URL || "",
  },
  {
    name: "Facebook",
    url: process.env.NEXT_PUBLIC_VIDORAVIBE_FACEBOOK_URL || "",
  },
  {
    name: "LinkedIn",
    url: process.env.NEXT_PUBLIC_VIDORAVIBE_LINKEDIN_URL || "",
  },
].filter((link) => link.url);
