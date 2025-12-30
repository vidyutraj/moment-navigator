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
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">Energy:</span>
      <div className="flex items-center gap-1 bg-muted/50 rounded-full p-1">
        {energyOptions.map((option) => {
          const Icon = option.icon;
          const isActive = energy === option.value;
          
          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all",
                isActive
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon 
                className={cn(
                  "w-4 h-4",
                  isActive && option.value === 'low' && "text-energy-low",
                  isActive && option.value === 'medium' && "text-energy-medium",
                  isActive && option.value === 'high' && "text-energy-high"
                )} 
              />
              <span className="hidden sm:inline">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
