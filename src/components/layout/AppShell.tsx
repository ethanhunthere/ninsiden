import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { NeuralBackground } from "./NeuralBackground";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Site-wide ambient neuron background — fixed -z-10 so every page feels alive */}
      <NeuralBackground variant="default" />
      <Navbar />
      <main className="relative">{children}</main>
      <Footer />
    </>
  );
}
