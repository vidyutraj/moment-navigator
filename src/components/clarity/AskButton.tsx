import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AskButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isActive?: boolean;
}

export function AskButton({ onClick, disabled, isActive }: AskButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      size="lg"
      className={cn(
        "px-8 py-6 text-lg font-medium rounded-xl shadow-md transition-all",
        "bg-primary text-primary-foreground hover:bg-primary/90",
        "hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
        isActive && "ring-2 ring-highlight-border ring-offset-2 ring-offset-background"
      )}
    >
      <Sparkles className="w-5 h-5 mr-3" />
      I have free time — what should I do?
    </Button>
  );
}
