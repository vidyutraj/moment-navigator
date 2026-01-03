import { Recommendation, EnergyLevel } from '@/types/clarity';
import { Button } from '@/components/ui/button';
import { Check, RefreshCw, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecommendationCardProps {
  recommendation: Recommendation;
  energy: EnergyLevel;
  onAccept: () => void;
  onSuggestAnother: () => void;
  onDismiss: () => void;
}

export function RecommendationCard({ 
  recommendation, 
  energy,
  onAccept, 
  onSuggestAnother, 
  onDismiss 
}: RecommendationCardProps) {
  const energyLabels = {
    low: 'Low energy',
    medium: 'Medium energy',
    high: 'High energy',
  };

  return (
    <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm max-w-lg mx-auto">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-2">
            Do this for the next {recommendation.duration} minutes:
          </p>
          <h3 className="text-xl font-medium text-foreground leading-snug">
            {recommendation.task.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1.5">
            Matched to your {energyLabels[energy]}
          </p>
        </div>
      </div>
      
      <div className="bg-muted/30 rounded-lg p-4 mb-6">
        <p className="text-sm text-foreground leading-relaxed">
          <span className="text-muted-foreground">Why: </span>
          {recommendation.explanation}
        </p>
      </div>
      
      <div className="flex flex-col gap-3">
        <Button 
          onClick={onAccept}
          className="w-full"
          size="lg"
        >
          <Check className="w-4 h-4 mr-2" />
          Yes — I'll do this
        </Button>
        
        <div className="flex gap-2">
          <Button 
            onClick={onSuggestAnother}
            variant="outline"
            className="flex-1"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Suggest something else
          </Button>
          
          <Button 
            onClick={onDismiss}
            variant="ghost"
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            Something came up
          </Button>
        </div>
      </div>
    </div>
  );
}
