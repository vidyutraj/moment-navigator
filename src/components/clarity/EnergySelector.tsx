import { EnergyLevel } from '@/types/clarity';
import { Battery, BatteryLow, BatteryMedium, BatteryFull } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnergySelectorProps {
  energy: EnergyLevel;
  onChange: (energy: EnergyLevel) => void;
}

const energyOptions: { value: EnergyLevel; label: string; icon: typeof Battery }[] = [
  { value: 'low', label: 'Low', icon: BatteryLow },
  { value: 'medium', label: 'Medium', icon: BatteryMedium },
  { value: 'high', label: 'High', icon: BatteryFull },
];

export function EnergySelector({ energy, onChange }: EnergySelectorProps) {
  return (
    <div className="flex items-center gap-1.5 bg-background border border-border/50 rounded-lg p-1 shadow-sm">
      {energyOptions.map((option) => {
        const Icon = option.icon;
        const isActive = energy === option.value;
        
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all",
              "hover:bg-muted/30",
              isActive
                ? "bg-muted text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon 
              className={cn(
                "w-5 h-5 transition-colors",
                isActive && option.value === 'low' && "text-energy-low",
                isActive && option.value === 'medium' && "text-energy-medium",
                isActive && option.value === 'high' && "text-energy-high",
                !isActive && "opacity-50"
              )} 
            />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
