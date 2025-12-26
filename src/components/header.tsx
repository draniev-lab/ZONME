
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, LogOut, LayoutDashboard, CircleUserRound } from 'lucide-react';
import { Logo } from '@/components/logo';
import { useUser, useFirestore } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';

const navLinks = [
  { href: '/properties', label: 'Propriétés' },
  { href: '/#contact', label: 'Contact' },
];

export function Header() {
  const { user } = useUser();
  const { auth } = useFirestore();
  const { toast } = useToast();

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
    } catch (error) {
      console.error("Logout Error:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de se déconnecter.",
      });
    }
  };
  
  const userInitial = user?.displayName ? user.displayName.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'U');

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Logo />
        <nav className="ml-auto hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-4 ml-6">
          {user ? (
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'Avatar'} />
                            <AvatarFallback>{userInitial}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{user.displayName}</p>
                            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuItem asChild>
                           <Link href="/dashboard" className="flex items-center">
                                <LayoutDashboard className="h-4 w-4 mr-2" />
                                <span>Tableau de bord</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard/profile" className="flex items-center">
                                <CircleUserRound className="h-4 w-4 mr-2" />
                                <span>Mon Profil</span>
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="flex items-center cursor-pointer">
                        <LogOut className="h-4 w-4 mr-2" />
                        <span>Déconnexion</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>
          ) : (
            <Button variant="ghost" asChild>
              <Link href="/login">Se connecter</Link>
            </Button>
          )}
          <Button asChild>
            <Link href="/submit-property">Déposer une annonce</Link>
          </Button>
        </div>
        <div className="ml-auto flex items-center md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Ouvrir le menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-6 p-6">
                <Logo />
                <nav className="flex flex-col gap-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-lg font-medium text-foreground"
                    >
                      {link.label}
                    </Link>
                  ))}
                  {user && <Link href="/dashboard" className="text-lg font-medium text-foreground">Tableau de bord</Link>}
                </nav>
                <div className="flex flex-col gap-4 pt-6">
                  {user ? (
                     <Button variant="outline" onClick={handleLogout}>Déconnexion</Button>
                  ) : (
                    <Button variant="outline" asChild>
                      <Link href="/login">Se connecter</Link>
                    </Button>
                  )}
                  <Button asChild>
                    <Link href="/submit-property">Déposer une annonce</Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
