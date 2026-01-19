import { BarChart3 } from "lucide-react";
import { AgentConfig } from "../AgentBuilder";

interface AnalyticsTabProps {
    config: AgentConfig;
    updateConfig: (updates: Partial<AgentConfig>) => void;
}

export function AnalyticsTab({ config, updateConfig }: AnalyticsTabProps) {
    return (
        <div className="space-y-6">
            <div className="card-tactile bg-card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-lg">Analytics Configuration</h3>
                </div>

                <p className="text-sm text-muted-foreground">
                    Analytics and metrics configuration coming soon...
                </p>
            </div>
        </div>
    );
}
