
'use client';

import GrapesJsEditor from '@grapesjs/react';
import { Separator } from '@/components/ui/separator';
import { useUser, useDoc } from '@/firebase';
import { UserProfile } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { PageEditorTopbar } from '@/components/page-editor/topbar';
import { PageEditorRightSidebar } from '@/components/page-editor/right-sidebar';
import grapesjs, { EditorProps } from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import gjsBlocksBasic from 'grapesjs-blocks-basic';
import { Canvas } from '@grapesjs/react';

const editorProps: EditorProps = {
    grapesjs,
    options: {
        height: '100%',
        storageManager: false,
        undoManager: { trackSelection: false },
        selectorManager: { componentFirst: true },
        projectData: {
            assets: [],
            pages: [
                {
                    frames: [
                        {
                            component: {
                                type: 'wrapper',
                                stylable: [
                                    'background',
                                    'background-color',
                                    'background-image',
                                    'background-repeat',
                                    'background-attachment',
                                    'background-position',
                                    'background-size',
                                ],
                                styles: {
                                    height: '100%',
                                    'background-color': 'hsl(var(--background))',
                                    color: 'hsl(var(--foreground))',
                                    'font-family': 'PT Sans, sans-serif'
                                }
                            },
                        },
                    ],
                },
            ],
        },
    },
    plugins: [
        gjsBlocksBasic
    ]
};


function PageEditor() {
    return (
        <div className="h-[calc(100vh-14rem)] border rounded-lg overflow-hidden">
            <GrapesJsEditor className="gjs-custom-editor" {...editorProps}>
                <div className="flex h-full border-t border-border">
                    <div className="flex-grow flex flex-col">
                        <PageEditorTopbar className="min-h-[48px]" />
                        <Canvas className="flex-grow" />
                    </div>
                    <PageEditorRightSidebar className="w-[300px] border-l border-border" />
                </div>
            </GrapesJsEditor>
        </div>
    )
}


export default function PageEditorPage() {
    const { user, loading: userLoading } = useUser();
    const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>('users', user?.uid);
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    const loading = userLoading || profileLoading;

    useEffect(() => {
        if (loading) return;
        if (!user) {
            router.replace('/login');
            return;
        }
        if (userProfile?.role !== 'admin') {
            router.replace('/dashboard');
        } else {
            setIsAuthorized(true);
        }
    }, [user, userProfile, loading, router]);


    if (loading || !isAuthorized) {
        return (
            <div className="flex h-[80vh] w-full items-center justify-center flex-col gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Vérification des accès...</p>
            </div>
        );
    }


    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-headline md:text-4xl">
                    Éditeur de Pages
                </h1>
                <p className="text-muted-foreground">
                    Créez des pages personnalisées pour votre application.
                </p>
            </div>
            <Separator />
            <PageEditor />
        </div>
    );
}
