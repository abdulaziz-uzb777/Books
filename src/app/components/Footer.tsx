import { Phone, Send } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t bg-background mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo and Description */}
          <div className="text-center md:text-left">
            <h3 className="text-lg font-bold text-foreground mb-2">Библиотека</h3>
            <p className="text-sm text-muted-foreground">
              Онлайн библиотека для чтения книг
            </p>
          </div>

          {/* Contact Information */}
          <div className="flex flex-col md:flex-row items-center gap-6">
            <a
              href="https://t.me/your_username"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
            >
              <div className="p-2 rounded-full bg-primary/10">
                <Send className="h-5 w-5 text-primary" />
              </div>
              <span>@your_username</span>
            </a>

            <a
              href="tel:+998901234567"
              className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
            >
              <div className="p-2 rounded-full bg-primary/10">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <span>+998 (90) 123-45-67</span>
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Библиотека. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
}
