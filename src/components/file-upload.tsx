"use client";

import { useState } from "react";
import { useFirestore } from "@/firebase";
import { getStorage, ref, uploadBytesResumable, getDownloadURL, type StorageError } from "firebase/storage";
import { Loader2, UploadCloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  userId: string;
  folder: string; // ex: "kyc_documents" ou "property_images"
  onUploadComplete: (downloadURL: string) => void;
  className?: string;
}

export function FileUpload({ userId, folder, onUploadComplete, className }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const { firebaseApp } = useFirestore();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!firebaseApp) {
        toast({ variant: "destructive", title: "Erreur de configuration", description: "Le service de stockage n'est pas initialisé." });
        return;
    }
    const storage = getStorage(firebaseApp);
    const file = event.target.files?.[0];
    if (!file) return;

    const storageRef = ref(storage, `${folder}/${userId}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    setUploading(true);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const prog = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setProgress(prog);
      },
      (error: StorageError) => {
        setUploading(false);
        console.error("Upload error:", error.code, error.message);
        toast({
          variant: "destructive",
          title: "Erreur de téléversement",
          description: "Le fichier est peut-être trop volumineux ou le type n'est pas autorisé. Vérifiez vos permissions.",
        });
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        onUploadComplete(downloadURL);
        toast({
          title: "Succès !",
          description: "Le fichier a été téléversé avec succès.",
        });
        setUploading(false);
        setProgress(0);
      }
    );
  };

  return (
    <div className={className}>
      <label htmlFor="file-input" className="cursor-pointer">
        <div className="flex flex-col items-center justify-center gap-4 p-6 border-2 border-dashed rounded-lg border-muted-foreground/25 hover:border-primary hover:text-primary transition-colors">
            <input
                type="file"
                id="file-input"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
            />
            
            {uploading ? (
            <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm font-medium">{progress}%</p>
            </div>
            ) : (
            <div className="flex flex-col items-center gap-2">
                <UploadCloud className="h-10 w-10" />
                <span className="text-sm font-medium text-center">Cliquez ou glissez-déposez pour choisir un fichier</span>
            </div>
            )}
        </div>
      </label>

      {uploading && (
        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden mt-2">
          <div 
            className="bg-primary h-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
