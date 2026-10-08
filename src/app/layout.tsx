import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Industry Coding Assessments",
  description: "A local, single-user coding assessment platform for interview practice.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
