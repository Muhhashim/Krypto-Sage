import { BrainCircuit } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-card shadow-md sticky top-0 z-50 border-b">
      <div className="container mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BrainCircuit className="h-8 w-8 text-primary" />
          <h1 className="text-2xl md:text-3xl font-headline font-bold text-primary">
            KryptoSage
          </h1>
        </div>
        {/* Placeholder for future navigation or user profile */}
      </div>
    </header>
  );
}
