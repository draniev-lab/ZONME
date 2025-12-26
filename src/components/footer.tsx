import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { Logo } from '@/components/logo';
import Link from 'next/link';

const socialLinks = [
  { icon: Facebook, href: '#', name: 'Facebook' },
  { icon: Twitter, href: '#', name: 'Twitter' },
  { icon: Instagram, href: '#', name: 'Instagram' },
  { icon: Linkedin, href: '#', name: 'LinkedIn' },
];

export function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground" id="contact">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex flex-col items-center gap-2 md:items-start">
            <Logo />
            <p className="text-sm">
              &copy; {new Date().getFullYear()} ZoeHouse. Tous droits réservés.
            </p>
          </div>
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <Link key={social.name} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.name}>
                <social.icon className="h-6 w-6 transition-colors hover:text-primary" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
