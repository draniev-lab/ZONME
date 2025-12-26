import { RecommendationForm } from "@/components/recommendation-form";
import { Separator } from "@/components/ui/separator";

export default function RecommendationsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline md:text-4xl">
          Recommandations par l'IA
        </h1>
        <p className="text-muted-foreground">
          Trouvez la propriété de vos rêves grâce à l'intelligence artificielle.
        </p>
      </div>
      <Separator />
      <RecommendationForm />
    </div>
  );
}
