import { Wrench } from "lucide-react";
import { AgentConfig } from "../AgentBuilder";

interface ToolsTabProps {
    config: AgentConfig;
    updateConfig: (updates: Partial<AgentConfig>) => void;
}

export function ToolsTab({ config, updateConfig }: ToolsTabProps) {
    return (
        <div className="space-y-6">
            <div className="card-tactile bg-card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Wrench className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-lg">Tools & Integrations</h3>
                </div>

                <p className="text-sm text-muted-foreground">
                    Function calling and webhook configuration coming soon...
                </p>
            </div>
        </div>
    );
}
