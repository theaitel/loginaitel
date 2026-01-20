import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Volume2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentConfig } from "../AgentBuilder";

interface AudioTabProps {
    config: AgentConfig;
    updateConfig: (updates: Partial<AgentConfig>) => void;
}

export function AudioTab({ config, updateConfig }: AudioTabProps) {
    return (
        <div className="space-y-6">
            {/* Voice Selection */}
            <div className="card-tactile bg-card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Volume2 className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-lg">Voice Configuration</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <Label className="text-sm font-medium mb-2 block">Voice Provider</Label>
                        <Select
                            value={config.voiceProvider}
                            onValueChange={(value) => updateConfig({ voiceProvider: value })}
                        >
                            <SelectTrigger className="border-2">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                                <SelectItem value="azure">Azure TTS</SelectItem>
                                <SelectItem value="google">Google TTS</SelectItem>
                                <SelectItem value="amazon">Amazon Polly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label className="text-sm font-medium mb-2 block">Voice</Label>
                        <div className="flex gap-2">
                            <Select
                                value={config.voiceId}
                                onValueChange={(value) => updateConfig({ voiceId: value })}
                            >
                                <SelectTrigger className="border-2">
                                    <SelectValue placeholder="Select voice" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="rachel">Rachel (Female, US)</SelectItem>
                                    <SelectItem value="adam">Adam (Male, US)</SelectItem>
                                    <SelectItem value="bella">Bella (Female, UK)</SelectItem>
                                    <SelectItem value="josh">Josh (Male, US)</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="outline" size="icon">
                                <Play className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Voice Parameters */}
            <div className="card-tactile bg-card p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Volume2 className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-lg">Voice Parameters</h3>
                </div>

                <div className="space-y-6">
                    {/* Speech Rate */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <Label className="text-sm font-medium">Speech Rate</Label>
                            <span className="text-sm font-mono font-bold">{config.speechRate.toFixed(2)}x</span>
                        </div>
                        <Slider
                            value={[config.speechRate * 100]}
                            onValueChange={([value]) => updateConfig({ speechRate: value / 100 })}
                            min={50}
                            max={200}
                            step={5}
                        />
                    </div>

                    {/* Pitch */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <Label className="text-sm font-medium">Pitch</Label>
                            <span className="text-sm font-mono font-bold">{config.pitch.toFixed(2)}</span>
                        </div>
                        <Slider
                            value={[config.pitch * 100]}
                            onValueChange={([value]) => updateConfig({ pitch: value / 100 })}
                            min={50}
                            max={150}
                            step={5}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
