import "./globals.css";

export const metadata = {
  title: "Мебель CRM",
  description: "CRM для мебельных цехов с калькулятором сметы",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
