import { MadeWithDyad } from "@/components/made-with-dyad";

export function Footer() {
  return (
    <footer className="bg-muted text-muted-foreground py-8 mt-16">
      <div className="container mx-auto text-center">
        <p>&copy; {new Date().getFullYear()} Tôi là người Sài Gòn. All rights reserved.</p>
        <div className="mt-4">
          <MadeWithDyad />
        </div>
      </div>
    </footer>
  );
}