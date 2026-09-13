import "./globals.scss";
import ReduxProvider from "@/components/ReduxProvider";

export const metadata = {
  title: "My Hub",
  description: "พื้นที่ส่วนตัวสำหรับรวมลิงก์ เครื่องมือ และไฟล์ PDF",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
