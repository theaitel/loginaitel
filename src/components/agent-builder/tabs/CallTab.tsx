import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Phone } from "lucide-react";
import { AgentConfig } from "../AgentBuilder";

interface CallTabProps {
    config: AgentConfig;
    updateConfig: (updates: Partial<AgentConfig>) => void;
}

export function CallTab({ config, updateConfig }: CallTabProps) {
    return (
        <div className="space-y-6">
            <div className="card-tactile bg-card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Phone className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-lg">Call Configuration</h3>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-sm font-medium">Enable Call Recording</Label>
                            <p className="text-xs text-muted-foreground">
                                Record all calls for quality assurance
                            </p>
                        </div>
                        <Switch
                            checked={config.recordingEnabled}
                            onCheckedChange={(checked) => updateConfig({ recordingEnabled: checked })}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-sm font-medium">Enable Call Transfer</Label>
                            <p className="text-xs text-muted-foreground">
                                Allow agent to transfer calls to human operators
                            </p>
                        </div>
                        <Switch
                            checked={config.transferEnabled}
                            onCheckedChange={(checked) => updateConfig({ transferEnabled: checked })}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
