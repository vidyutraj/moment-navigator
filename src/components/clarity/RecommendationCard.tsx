import { Recommendation } from '@/types/clarity';
import { Button } from '@/components/ui/button';
import { Check, RefreshCw, X, Sparkles } from 'lucide-react';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onAccept: () => void;
  onSuggestAnother: () => void;
  onDismiss: () => void;
}

export function RecommendationCard({ 
  recommendation, 
  onAccept, 
  onSuggestAnother, 
  onDismiss 
}: RecommendationCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-lg animate-slide-up max-w-md mx-auto">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-highlight flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-highlight-border" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">
            Do this for the next {recommendation.duration} minutes:
          </p>
          <h3 className="text-lg font-semibold text-foreground leading-snug">
            {recommendation.task.title}
          </h3>
        </div>
      </div>
      
      <div className="bg-muted/50 rounded-lg p-4 mb-6">
        <p className="text-sm text-foreground">
          <span className="font-medium text-muted-foreground">Why: </span>
          {recommendation.reason}
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-2">
        <Button 
          onClick={onAccept}
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Check className="w-4 h-4 mr-2" />
          Yes — place on calendar
        </Button>
        
        <Button 
          onClick={onSuggestAnother}
          variant="secondary"
          className="flex-1"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Suggest another
        </Button>
        
        <Button 
          onClick={onDismiss}
          variant="ghost"
          className="sm:w-auto"
        >
          <X className="w-4 h-4 mr-2" />
          Something came up
        </Button>
      </div>
    </div>
  );
}
