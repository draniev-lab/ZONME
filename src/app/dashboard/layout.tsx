
"use client";

import * as React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
  SidebarGroupContent,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Home,
  Bot,
  MessageSquare,
  Heart,
  CalendarCheck,
  Columns3,
  Search,
  PlusCircle,
  BarChart3,
  Users,
  CreditCard,
  Menu,
  Shield,
  CheckSquare,
  FileCheck,
  History,
  Settings,
  Briefcase,
  TicketCheck,
  Package,
  MailCheck,
  Bookmark,
  GanttChartSquare,
  UserCheck,
  LogOut,
  CircleUserRound,
  PenSquare,
  FilePen,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import { useUser, useDoc, useCollection } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useFirestore } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { UserProfile, AgencyProfile } from '@/lib/types';
import { useMemo } from 'react';
import { query, where, collection } from 'firebase/firestore';
import { ActivityLogger } from '@/components/activity-logger';
import { Skeleton } from '@/components/ui/skeleton';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';

function DashboardSkeleton() {
  return (
    <div className="flex h-screen w-full">
        <div className="hidden md:flex h-full w-[16rem] flex-col gap-2 border-r bg-sidebar p-2 text-sidebar-foreground">
            <div className="flex items-center justify-between p-2">
                <Skeleton className="h-6 w-24"/>
                <Skeleton className="h-7 w-7"/>
            </div>
            <div className="flex flex-col gap-2 p-2">
                 <Skeleton className="h-12 w-full"/>
                 <Skeleton className="h-8 w-full"/>
                 <Skeleton className="h-8 w-full"/>
            </div>
             <div className="mt-4 flex flex-1 flex-col gap-2 overflow-auto p-2">
                <div className="space-y-2">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
                 <div className="space-y-2 mt-4">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
            </div>
            <div className="p-2 mt-auto">
                 <Skeleton className="h-10 w-full"/>
            </div>
        </div>
        <main className="flex-1 p-8">
            <div className="flex h-full w-full items-center justify-center">
                 <LayoutDashboard className="h-12 w-12 animate-spin text-primary" />
            </div>
        </main>
    </div>
  );
}

function MainDashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading: userLoading } = useUser();
    const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>('users', user?.uid);
    const router = useRouter();
    const { auth, firestore } = useFirestore();
    const { toast } = useToast();
    const pathname = usePathname();

    const myAgencyQuery = useMemo(() => {
        if (!firestore || !user?.uid) return null;
        return query(collection(firestore, "agencies"), where(`agentIds.${user.uid}`, "==", true));
    }, [firestore, user?.uid]);

    const { data: agencies, loading: agenciesLoading } = useCollection<AgencyProfile>(myAgencyQuery);
    const myAgency = useMemo(() => (agencies && agencies.length > 0) ? agencies[0] : null, [agencies]);

    const loading = userLoading || profileLoading || agenciesLoading;
    
    React.useEffect(() => {
        if (!userLoading && !user) {
            router.replace('/login');
        }
    }, [user, userLoading, router]);

     const handleLogout = async () => {
        if (!auth) return;
        try {
        await signOut(auth);
        toast({
            title: "Déconnexion réussie",
            description: "À bientôt !",
        });
        router.push('/');
        } catch (error) {
        console.error("Logout Error:", error);
        toast({
            variant: "destructive",
            title: "Erreur",
            description: "Impossible de se déconnecter.",
        });
        }
    };
    
    if (loading || !user || !userProfile) {
        return <DashboardSkeleton />;
    }
  
    const isOwnerOrAgent = ['owner', 'agent'].includes(userProfile.role);
    const isAdmin = userProfile.role === 'admin';
    const isAgencyMember = myAgency !== null;
    const isAgencyOwner = myAgency?.ownerId === user.uid;


    const userAvatarUrl = user.photoURL || `https://api.dicebear.com/8.x/lorelei/svg?seed=${user.uid}`;
    const userInitial = user.displayName ? user.displayName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U');
    
    const isActive = (path: string) => pathname === path || (path !== '/dashboard' && pathname.startsWith(path));

    return (
        <SidebarProvider>
            {user && <ActivityLogger user={user} />}
            <Sidebar side="left" collapsible="icon">
                <SidebarHeader className="hidden items-center justify-between p-2 md:flex">
                <Logo />
                <SidebarTrigger className="ml-4" />
                </SidebarHeader>

                <SidebarContent>
                
                 <SidebarMenu>
                    {/* Main */}
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="Dashboard" isActive={isActive('/dashboard') && pathname === '/dashboard'}>
                            <Link href="/dashboard" className="flex items-center gap-2">
                            <LayoutDashboard />
                            <span>Dashboard</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                     <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="Recommandations IA" isActive={isActive('/dashboard/recommendations')}>
                            <Link href="/dashboard/recommendations" className="flex items-center gap-2">
                            <Bot />
                            <span>Recommandations</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>

                <SidebarSeparator />

                {/* Personal Space */}
                <SidebarGroup>
                    <SidebarGroupLabel>Mon Espace</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Mes Messages" isActive={isActive('/dashboard/messages')}>
                                    <Link href="/dashboard/messages" className="flex items-center gap-2"><MessageSquare/><span>Messages</span></Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Mes Favoris" isActive={isActive('/dashboard/favorites')}>
                                    <Link href="/dashboard/favorites" className="flex items-center gap-2"><Heart/><span>Favoris</span></Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Demandes Envoyées" isActive={isActive('/dashboard/my-requests')}>
                                    <Link href="/dashboard/my-requests" className="flex items-center gap-2"><MailCheck/><span>Demandes</span></Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                             <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Comparateur" isActive={isActive('/dashboard/compare')}>
                                    <Link href="/dashboard/compare" className="flex items-center gap-2"><Columns3/><span>Comparer</span></Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Recherches Sauvegardées" isActive={isActive('/dashboard/searches')}>
                                    <Link href="/dashboard/searches" className="flex items-center gap-2"><Bookmark/><span>Recherches</span></Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Seller Space */}
                {(isOwnerOrAgent || isAdmin) && (
                    <>
                        <SidebarSeparator />
                        <SidebarGroup>
                            <SidebarGroupLabel>Gestion</SidebarGroupLabel>
                             <SidebarGroupContent>
                                <SidebarMenu>
                                     <SidebarMenuItem>
                                        <SidebarMenuButton asChild tooltip="Mes Biens" isActive={isActive('/dashboard/my-properties')}>
                                            <Link href="/dashboard/my-properties" className="flex items-center gap-2"><Package/><span>Mes Biens</span></Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild tooltip="Ajouter un Bien" isActive={isActive('/submit-property')}>
                                            <Link href="/submit-property" className="flex items-center gap-2"><PlusCircle/><span>Ajouter</span></Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild tooltip="Demandes Reçues" isActive={isActive('/dashboard/requests')}>
                                            <Link href="/dashboard/requests" className="flex items-center gap-2"><TicketCheck/><span>Visites</span></Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                     {(userProfile.role === 'owner' || isAdmin) && (
                                         <SidebarMenuItem>
                                            <SidebarMenuButton asChild tooltip="Statistiques" isActive={isActive('/dashboard/owner')}>
                                                <Link href="/dashboard/owner" className="flex items-center gap-2"><BarChart3/><span>Statistiques</span></Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                     )}
                                </SidebarMenu>
                             </SidebarGroupContent>
                        </SidebarGroup>
                    </>
                )}
                
                {/* Agency Portal */}
                {(isAgencyMember || isAdmin) && (
                    <>
                        <SidebarSeparator />
                        <SidebarGroup>
                            <SidebarGroupLabel>Agence</SidebarGroupLabel>
                             <SidebarGroupContent>
                                 <SidebarMenu>
                                     <SidebarMenuItem>
                                        <SidebarMenuButton asChild tooltip="Statistiques Agence" isActive={isActive('/dashboard/agency/statistics')}>
                                            <Link href="/dashboard/agency/statistics" className="flex items-center gap-2"><Briefcase/><span>Statistiques</span></Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                     <SidebarMenuItem>
                                        <SidebarMenuButton asChild tooltip="Gestion des Agents" isActive={isActive('/dashboard/agency/agents')}>
                                            <Link href="/dashboard/agency/agents" className="flex items-center gap-2"><Users/><span>Agents</span></Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    {(isAgencyOwner || isAdmin) && (
                                         <SidebarMenuItem>
                                            <SidebarMenuButton asChild tooltip="Facturation" isActive={isActive('/dashboard/agency/billing')}>
                                                <Link href="/dashboard/agency/billing" className="flex items-center gap-2"><CreditCard/><span>Facturation</span></Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    )}
                                 </SidebarMenu>
                             </SidebarGroupContent>
                        </SidebarGroup>
                    </>
                )}

                {/* Admin Section */}
                {isAdmin && (
                    <>
                        <SidebarSeparator />
                        <SidebarGroup>
                             <SidebarGroupLabel>Administration</SidebarGroupLabel>
                             <SidebarGroupContent>
                                 <SidebarMenu>
                                      <SidebarMenuItem>
                                        <SidebarMenuButton asChild tooltip="Dashboard Admin" isActive={isActive('/dashboard/admin') && pathname.endsWith('/admin')}>
                                            <Link href="/dashboard/admin" className="flex items-center gap-2"><Shield/><span>Admin</span></Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild tooltip="Utilisateurs" isActive={isActive('/dashboard/admin/users')}>
                                            <Link href="/dashboard/admin/users" className="flex items-center gap-2"><Users/><span>Utilisateurs</span></Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                     <SidebarMenuItem>
                                        <SidebarMenuButton asChild tooltip="Validation des Annonces" isActive={isActive('/dashboard/admin/validation')}>
                                            <Link href="/dashboard/admin/validation" className="flex items-center gap-2"><GanttChartSquare/><span>Validation</span></Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                     <SidebarMenuItem>
                                        <SidebarMenuButton asChild tooltip="Validation KYC" isActive={isActive('/dashboard/admin/documents')}>
                                            <Link href="/dashboard/admin/documents" className="flex items-center gap-2"><UserCheck/><span>KYC</span></Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild tooltip="Éditeur de Pages" isActive={isActive('/dashboard/page-editor')}>
                                            <Link href="/dashboard/page-editor" className="flex items-center gap-2"><FilePen/><span>Éditeur de Pages</span></Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                     <SidebarMenuItem>
                                        <SidebarMenuButton asChild tooltip="Logs d'Activité" isActive={isActive('/dashboard/admin/logs')}>
                                            <Link href="/dashboard/admin/logs" className="flex items-center gap-2"><History/><span>Logs</span></Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                     <SidebarMenuItem>
                                        <SidebarMenuButton asChild tooltip="Paramètres" isActive={isActive('/dashboard/admin/settings')}>
                                            <Link href="/dashboard/admin/settings" className="flex items-center gap-2"><Settings/><span>Paramètres</span></Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                 </SidebarMenu>
                             </SidebarGroupContent>
                        </SidebarGroup>
                    </>
                )}

                </SidebarContent>
                 <SidebarFooter>
                    {/* User Profile */}
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild size="lg" tooltip="Mon Profil">
                            <Link href="/dashboard/profile" className="flex items-center gap-2">
                                    <Avatar className="size-8">
                                        <AvatarImage
                                        src={userAvatarUrl}
                                        alt="User Avatar"
                                        />
                                        <AvatarFallback>{userInitial}</AvatarFallback>
                                    </Avatar>
                                    <span className="truncate group-data-[collapsible=icon]:hidden">{user.displayName || user.email}</span>
                            </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton onClick={handleLogout} tooltip="Déconnexion" className="flex items-center gap-2">
                                <LogOut />
                                <span>Déconnexion</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>
            <SidebarInset>
                <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:hidden">
                <Logo />
                <SidebarTrigger>
                    <Menu />
                </SidebarTrigger>
                </header>
                <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();

  React.useEffect(() => {
    if (!userLoading && !user) {
      router.replace('/login');
    }
  }, [user, userLoading, router]);

  if (userLoading || !user) {
    return <DashboardSkeleton />;
  }

  return <MainDashboardLayout>{children}</MainDashboardLayout>;
}
