import "./globals.css";
import { LanguageProvider } from "@/lib/LanguageContext";

export const metadata = {
  title: "Мебель CRM",
  description: "CRM для мебельных цехов с калькулятором сметы",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
