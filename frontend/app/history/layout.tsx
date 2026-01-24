import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "History",
    description: "this is the history you have watched since now",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <>
            {children}
        </>
    )
}