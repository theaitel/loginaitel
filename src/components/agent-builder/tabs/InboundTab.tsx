import { PhoneIncoming } from "lucide-react";
import { AgentConfig } from "../AgentBuilder";

interface InboundTabProps {
    config: AgentConfig;
    updateConfig: (updates: Partial<AgentConfig>) => void;
}

export function InboundTab({ config, updateConfig }: InboundTabProps) {
    return (
        <div className="space-y-6">
            <div className="card-tactile bg-card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <PhoneIncoming className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-lg">Inbound Call Configuration</h3>
                </div>

                <p className="text-sm text-muted-foreground">
                    Inbound call handling and IVR configuration coming soon...
                </p>
            </div>
        </div>
    );
}
