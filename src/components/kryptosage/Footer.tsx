export function Footer() {
  return (
    <footer className="bg-card shadow-sm py-6 mt-auto border-t">
      <div className="container mx-auto px-4 md:px-8 text-center text-muted-foreground">
        <p className="text-sm">&copy; {new Date().getFullYear()} KryptoSage. All rights reserved.</p>
        <p className="text-xs mt-1">Disclaimer: Trading cryptocurrency involves significant risk. Signals are not financial advice.</p>
      </div>
    </footer>
  );
}
