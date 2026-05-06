import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { NeuralBackground } from "./NeuralBackground";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NeuralBackground />
      <Navbar />
      <main className="relative">{children}</main>
      <Footer />
    </>
  );
}
