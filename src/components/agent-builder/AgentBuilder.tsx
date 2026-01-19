import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    FileText,
    Brain,
    Volume2,
    Cpu,
    Phone,
    Wrench,
    BarChart3,
    PhoneIncoming,
} from "lucide-react";
import { AgentTab } from "./tabs/AgentTab";
import { LLMTab } from "./tabs/LLMTab";
import { AudioTab } from "./tabs/AudioTab";
import { EngineTab } from "./tabs/EngineTab";
import { CallTab } from "./tabs/CallTab";
import { ToolsTab } from "./tabs/ToolsTab";
import { AnalyticsTab } from "./tabs/AnalyticsTab";
import { InboundTab } from "./tabs/InboundTab";

export interface AgentConfig {
    // Agent Tab
    welcomeMessage: string;
    agentPrompt: string;

    // LLM Tab
    llmProvider: string;
    llmModel: string;
    maxTokens: number;
    temperature: number;
    knowledgeBases: string[];
    guardrails: GuardrailBlock[];

    // Audio Tab
    voiceProvider: string;
    voiceId: string;
    speechRate: number;
    pitch: number;

    // Engine Tab
    engine: string;
    streamingEnabled: boolean;

    // Call Tab
    hangupConditions: string[];
    transferEnabled: boolean;
    recordingEnabled: boolean;

    // Tools Tab
    tools: ToolConfig[];
    webhooks: WebhookConfig[];

    // Analytics Tab
    metricsEnabled: string[];

    // Inbound Tab
    inboundEnabled: boolean;
    ivrConfig: any;
}

export interface GuardrailBlock {
    id: string;
    name: string;
    response: string;
    threshold: number;
    utterances: string[];
}

export interface ToolConfig {
    id: string;
    name: string;
    description: string;
    parameters: any;
}

export interface WebhookConfig {
    id: string;
    url: string;
    event: string;
}

const defaultConfig: AgentConfig = {
    welcomeMessage: "hello",
    agentPrompt: "",
    llmProvider: "azure",
    llmModel: "gpt-4.1-mini",
    maxTokens: 608,
    temperature: 0.01,
    knowledgeBases: [],
    guardrails: [],
    voiceProvider: "elevenlabs",
    voiceId: "",
    speechRate: 1.0,
    pitch: 1.0,
    engine: "default",
    streamingEnabled: true,
    hangupConditions: [],
    transferEnabled: false,
    recordingEnabled: true,
    tools: [],
    webhooks: [],
    metricsEnabled: [],
    inboundEnabled: false,
    ivrConfig: null,
};

interface AgentBuilderProps {
    initialConfig?: Partial<AgentConfig>;
    onSave?: (config: AgentConfig) => void;
    onCancel?: () => void;
}

export function AgentBuilder({ initialConfig, onSave, onCancel }: AgentBuilderProps) {
    const [config, setConfig] = useState<AgentConfig>({
        ...defaultConfig,
        ...initialConfig,
    });

    const updateConfig = (updates: Partial<AgentConfig>) => {
        setConfig((prev) => ({ ...prev, ...updates }));
    };

    return (
        <div className="space-y-6">
            <Tabs defaultValue="agent" className="w-full">
                <TabsList className="grid grid-cols-4 lg:grid-cols-8 gap-2 h-auto p-2 bg-card border-2 border-border">
                    <TabsTrigger value="agent" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <FileText className="h-5 w-5" />
                        <span className="text-xs font-medium">Agent</span>
                    </TabsTrigger>
                    <TabsTrigger value="llm" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <Brain className="h-5 w-5" />
                        <span className="text-xs font-medium">LLM</span>
                    </TabsTrigger>
                    <TabsTrigger value="audio" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <Volume2 className="h-5 w-5" />
                        <span className="text-xs font-medium">Audio</span>
                    </TabsTrigger>
                    <TabsTrigger value="engine" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <Cpu className="h-5 w-5" />
                        <span className="text-xs font-medium">Engine</span>
                    </TabsTrigger>
                    <TabsTrigger value="call" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <Phone className="h-5 w-5" />
                        <span className="text-xs font-medium">Call</span>
                    </TabsTrigger>
                    <TabsTrigger value="tools" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <Wrench className="h-5 w-5" />
                        <span className="text-xs font-medium">Tools</span>
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <BarChart3 className="h-5 w-5" />
                        <span className="text-xs font-medium">Analytics</span>
                    </TabsTrigger>
                    <TabsTrigger value="inbound" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <PhoneIncoming className="h-5 w-5" />
                        <span className="text-xs font-medium">Inbound</span>
                    </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    <TabsContent value="agent">
                        <AgentTab config={config} updateConfig={updateConfig} />
                    </TabsContent>
                    <TabsContent value="llm">
                        <LLMTab config={config} updateConfig={updateConfig} />
                    </TabsContent>
                    <TabsContent value="audio">
                        <AudioTab config={config} updateConfig={updateConfig} />
                    </TabsContent>
                    <TabsContent value="engine">
                        <EngineTab config={config} updateConfig={updateConfig} />
                    </TabsContent>
                    <TabsContent value="call">
                        <CallTab config={config} updateConfig={updateConfig} />
                    </TabsContent>
                    <TabsContent value="tools">
                        <ToolsTab config={config} updateConfig={updateConfig} />
                    </TabsContent>
                    <TabsContent value="analytics">
                        <AnalyticsTab config={config} updateConfig={updateConfig} />
                    </TabsContent>
                    <TabsContent value="inbound">
                        <InboundTab config={config} updateConfig={updateConfig} />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
