import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'LLM Wiki',
  description: 'AI-powered personal knowledge base',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        <nav className="top-nav">
          <div className="nav-container">
            <h1 className="logo">LLM Wiki</h1>
            <div className="nav-links">
              <Link href="/">放 (Drop)</Link>
              <Link href="/look">看 (Look)</Link>
              <Link href="/ask">问 (Ask)</Link>
              <Link href="/settings">设置</Link>
            </div>
          </div>
        </nav>
        <main className="main-content">
          {children}
        </main>
      </body>
    </html>
  );
}
