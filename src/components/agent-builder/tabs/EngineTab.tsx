import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Cpu } from "lucide-react";
import { AgentConfig } from "../AgentBuilder";

interface EngineTabProps {
    config: AgentConfig;
    updateConfig: (updates: Partial<AgentConfig>) => void;
}

export function EngineTab({ config, updateConfig }: EngineTabProps) {
    return (
        <div className="space-y-6">
            <div className="card-tactile bg-card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Cpu className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-lg">Engine Configuration</h3>
                </div>

                <div className="space-y-4">
                    <div>
                        <Label className="text-sm font-medium mb-2 block">Processing Engine</Label>
                        <Select
                            value={config.engine}
                            onValueChange={(value) => updateConfig({ engine: value })}
                        >
                            <SelectTrigger className="border-2">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="default">Default Engine</SelectItem>
                                <SelectItem value="fast">Fast Processing</SelectItem>
                                <SelectItem value="quality">High Quality</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-sm font-medium">Enable Streaming</Label>
                            <p className="text-xs text-muted-foreground">
                                Stream responses for lower latency
                            </p>
                        </div>
                        <Switch
                            checked={config.streamingEnabled}
                            onCheckedChange={(checked) => updateConfig({ streamingEnabled: checked })}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
