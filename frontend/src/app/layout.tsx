import "./globals.css";
import "../styles/auth-settings.css";

export const metadata = {
  title: "MidTalk — Private Collaboration",
  description: "Private messaging and collaboration workspace",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
