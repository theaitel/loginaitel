import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Settings, Shield } from "lucide-react";
import { AgentConfig } from "../AgentBuilder";
import { GuardrailBuilder } from "../GuardrailBuilder";

interface LLMTabProps {
    config: AgentConfig;
    updateConfig: (updates: Partial<AgentConfig>) => void;
}

export function LLMTab({ config, updateConfig }: LLMTabProps) {
    return (
        <div className="space-y-6">
            {/* LLM Model Selection */}
            <div className="card-tactile bg-card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Settings className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-lg">Choose LLM model</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <Label className="text-sm font-medium mb-2 block">Provider</Label>
                        <Select
                            value={config.llmProvider}
                            onValueChange={(value) => updateConfig({ llmProvider: value })}
                        >
                            <SelectTrigger className="border-2">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="azure">Azure</SelectItem>
                                <SelectItem value="openai">OpenAI</SelectItem>
                                <SelectItem value="anthropic">Anthropic</SelectItem>
                                <SelectItem value="together">Together AI</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label className="text-sm font-medium mb-2 block">Model</Label>
                        <Select
                            value={config.llmModel}
                            onValueChange={(value) => updateConfig({ llmModel: value })}
                        >
                            <SelectTrigger className="border-2">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="gpt-4.1-mini">gpt-4.1-mini cluster</SelectItem>
                                <SelectItem value="gpt-4">gpt-4</SelectItem>
                                <SelectItem value="gpt-3.5-turbo">gpt-3.5-turbo</SelectItem>
                                <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                                <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Model Parameters */}
            <div className="card-tactile bg-card p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Settings className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-lg">Model Parameters</h3>
                </div>

                <div className="space-y-6">
                    {/* Tokens */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <Label className="text-sm font-medium">Tokens generated on each LLM output</Label>
                            <span className="text-sm font-mono font-bold">{config.maxTokens}</span>
                        </div>
                        <Slider
                            value={[config.maxTokens]}
                            onValueChange={([value]) => updateConfig({ maxTokens: value })}
                            min={1}
                            max={2048}
                            step={1}
                            className="mb-2"
                        />
                        <p className="text-xs text-muted-foreground">
                            Increasing tokens enables longer responses to be queued for speech generation but increases latency
                        </p>
                    </div>

                    {/* Temperature */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <Label className="text-sm font-medium">Temperature</Label>
                            <span className="text-sm font-mono font-bold">{config.temperature.toFixed(2)}</span>
                        </div>
                        <Slider
                            value={[config.temperature * 100]}
                            onValueChange={([value]) => updateConfig({ temperature: value / 100 })}
                            min={0}
                            max={200}
                            step={1}
                            className="mb-2"
                        />
                        <p className="text-xs text-muted-foreground">
                            Increasing temperature enables heightened creativity, but increases chance of deviation from prompt
                        </p>
                    </div>
                </div>
            </div>

            {/* Knowledge Base */}
            <div className="card-tactile bg-card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Settings className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-lg">Add knowledge base (Multi-select)</h3>
                </div>

                <Select>
                    <SelectTrigger className="border-2">
                        <SelectValue placeholder="Select knowledge bases" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="kb1">Product Catalog</SelectItem>
                        <SelectItem value="kb2">FAQ Database</SelectItem>
                        <SelectItem value="kb3">Company Policies</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Guardrails */}
            <div className="card-tactile bg-card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Shield className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-lg">Add FAQs & Guardrail</h3>
                    <a href="#" className="text-xs text-primary hover:underline ml-auto">
                        DOCS ↗
                    </a>
                </div>

                <GuardrailBuilder
                    guardrails={config.guardrails}
                    onChange={(guardrails) => updateConfig({ guardrails })}
                />
            </div>
        </div>
    );
}
