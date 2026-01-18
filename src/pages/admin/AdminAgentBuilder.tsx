import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  FileText,
  Brain,
  Headphones,
  Cog,
  Phone,
  Wrench,
  BarChart3,
  PhoneIncoming,
  Save,
  Trash2,
  Copy,
  Share2,
  PhoneCall,
  MessageCircle,
  ExternalLink,
  Search,
  Plus,
  Download,
  Clock,
} from "lucide-react";

// Import all settings components
import { AgentSettings, AgentConfig } from "@/components/agent-builder/AgentSettings";
import { LLMSettingsAdvanced, LLMConfigAdvanced } from "@/components/agent-builder/LLMSettingsAdvanced";
import { AudioSettings, AudioConfig } from "@/components/agent-builder/AudioSettings";
import { EngineSettings, EngineConfig } from "@/components/agent-builder/EngineSettings";
import { CallSettings, CallConfig } from "@/components/agent-builder/CallSettings";
import { ToolsSettings, ToolsConfig } from "@/components/agent-builder/ToolsSettings";
import { AnalyticsSettings, AnalyticsConfig } from "@/components/agent-builder/AnalyticsSettings";
import { InboundSettings, InboundConfig } from "@/components/agent-builder/InboundSettings";

// Mock agents for sidebar
const MOCK_AGENTS = [
  { id: "1", name: "vedantu trail", status: "active" },
  { id: "2", name: "varsha", status: "active" },
  { id: "3", name: "My New Agent", status: "draft" },
  { id: "4", name: "(v3) Recruitment - En - copy", status: "active" },
];

interface AgentFullConfig {
  agent: AgentConfig;
  llm: LLMConfigAdvanced;
  audio: AudioConfig;
  engine: EngineConfig;
  call: CallConfig;
  tools: ToolsConfig;
  analytics: AnalyticsConfig;
  inbound: InboundConfig;
}

const DEFAULT_CONFIG: AgentFullConfig = {
  agent: {
    welcomeMessage: "Hello",
    systemPrompt: `1. LLM RULES
Speak ONLY in clear Indian English, neutral accent.

Keep responses concise; don't ramble.

Never pronounce numbers digit-by-digit unless absolutely necessary; say them as normal numbers.

Don't oversell; ask, listen, then pitch.

Maintain a friendly, confident tone — not salesy, not robotic.

2. IDENTITY
You are [Agent Name], a representative of [Company Name].`,
  },
  llm: {
    model: "gpt-4.1-nano",
    provider: "openai",
    family: "openai",
    temperature: 0.2,
    maxTokens: 450,
  },
  audio: {
    language: "en",
    transcriberProvider: "elevenlabs",
    transcriberModel: "scribe_v2_realtime",
    keywords: "",
    voiceProvider: "cartesia",
    voiceId: "a0e99841-438c-4a64-b679-ae501e7d6091",
    voiceName: "Barbershop Man",
  },
  engine: {
    preciseTranscript: false,
    interruptWords: 2,
    responseRate: "rapid",
  },
  call: {
    telephonyProvider: "plivo",
    enableDtmf: false,
    noiseCancellation: true,
    noiseCancellationLevel: 85,
  },
  tools: {
    selectedFunctions: [],
  },
  analytics: {
    autoReschedule: false,
    summarization: false,
    extraction: false,
    extractionPrompt: "",
  },
  inbound: {
    dataSource: "none",
    restrictToDatabase: false,
  },
};

export default function AdminAgentBuilder() {
  const navigate = useNavigate();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>("1");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("agent");
  const [config, setConfig] = useState<AgentFullConfig>(DEFAULT_CONFIG);
  const [isSaving, setIsSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const selectedAgent = MOCK_AGENTS.find((a) => a.id === selectedAgentId);
  const filteredAgents = MOCK_AGENTS.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Implement actual save via Bolna API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLastUpdated(new Date());
      toast.success("Agent saved successfully");
    } catch (error) {
      toast.error("Failed to save agent");
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewAgent = () => {
    setSelectedAgentId(null);
    setConfig(DEFAULT_CONFIG);
    setActiveTab("agent");
  };

  const calculateCostPerMin = () => {
    // Simplified cost calculation
    return "$0.039";
  };

  // Cost breakdown percentages (simplified)
  const costBreakdown = {
    transcriber: 20,
    llm: 30,
    voice: 25,
    telephony: 25,
  };

  const formatTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    return `${Math.floor(hours / 24)} day${Math.floor(hours / 24) > 1 ? "s" : ""} ago`;
  };

  return (
    <DashboardLayout role="admin">
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h1 className="text-2xl font-bold">Agent Setup</h1>
            <p className="text-sm text-muted-foreground">Fine tune your agents</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Agent List */}
          <div className="w-72 border-r flex flex-col bg-card">
            <div className="p-4 border-b space-y-3">
              <h2 className="font-bold">Your Agents</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1">
                  <Download className="h-3 w-3" />
                  Import
                </Button>
                <Button size="sm" className="gap-1" onClick={handleNewAgent}>
                  <Plus className="h-3 w-3" />
                  New Agent
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search agents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {filteredAgents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgentId(agent.id)}
                    className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                      selectedAgentId === agent.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted"
                    }`}
                  >
                    {agent.name}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Main Editor Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Center - Configuration */}
            <div className="flex-1 overflow-auto">
              <div className="p-6">
                {/* Agent Header */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <Input
                      value={selectedAgent?.name || "New Agent"}
                      className="text-2xl font-bold border-none p-0 h-auto focus-visible:ring-0 bg-transparent max-w-md"
                      placeholder="Agent Name"
                    />
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="gap-1">
                        <Copy className="h-3 w-3" />
                        Agent ID
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Share2 className="h-3 w-3" />
                        Share
                      </Button>
                    </div>
                  </div>

                  {/* Cost Indicator */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Cost per min: ~ {calculateCostPerMin()}</span>
                    </div>
                    <div className="flex-1 max-w-md">
                      <div className="h-2 flex rounded-full overflow-hidden">
                        <div
                          className="bg-green-500"
                          style={{ width: `${costBreakdown.transcriber}%` }}
                        />
                        <div
                          className="bg-orange-500"
                          style={{ width: `${costBreakdown.llm}%` }}
                        />
                        <div
                          className="bg-teal-500"
                          style={{ width: `${costBreakdown.voice}%` }}
                        />
                        <div
                          className="bg-amber-500"
                          style={{ width: `${costBreakdown.telephony}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      Transcriber
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                      LLM
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-teal-500" />
                      Voice
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Telephony
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      Platform
                    </Badge>
                  </div>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-8 w-full mb-6">
                    <TabsTrigger value="agent" className="gap-1 text-xs">
                      <FileText className="h-3 w-3" />
                      Agent
                    </TabsTrigger>
                    <TabsTrigger value="llm" className="gap-1 text-xs">
                      <Brain className="h-3 w-3" />
                      LLM
                    </TabsTrigger>
                    <TabsTrigger value="audio" className="gap-1 text-xs">
                      <Headphones className="h-3 w-3" />
                      Audio
                    </TabsTrigger>
                    <TabsTrigger value="engine" className="gap-1 text-xs">
                      <Cog className="h-3 w-3" />
                      Engine
                    </TabsTrigger>
                    <TabsTrigger value="call" className="gap-1 text-xs">
                      <Phone className="h-3 w-3" />
                      Call
                    </TabsTrigger>
                    <TabsTrigger value="tools" className="gap-1 text-xs">
                      <Wrench className="h-3 w-3" />
                      Tools
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="gap-1 text-xs">
                      <BarChart3 className="h-3 w-3" />
                      Analytics
                    </TabsTrigger>
                    <TabsTrigger value="inbound" className="gap-1 text-xs">
                      <PhoneIncoming className="h-3 w-3" />
                      Inbound
                    </TabsTrigger>
                  </TabsList>

                  <Card className="p-6">
                    <TabsContent value="agent" className="m-0">
                      <AgentSettings
                        value={config.agent}
                        onChange={(agent) => setConfig({ ...config, agent })}
                      />
                    </TabsContent>
                    <TabsContent value="llm" className="m-0">
                      <LLMSettingsAdvanced
                        value={config.llm}
                        onChange={(llm) => setConfig({ ...config, llm })}
                      />
                    </TabsContent>
                    <TabsContent value="audio" className="m-0">
                      <AudioSettings
                        value={config.audio}
                        onChange={(audio) => setConfig({ ...config, audio })}
                      />
                    </TabsContent>
                    <TabsContent value="engine" className="m-0">
                      <EngineSettings
                        value={config.engine}
                        onChange={(engine) => setConfig({ ...config, engine })}
                      />
                    </TabsContent>
                    <TabsContent value="call" className="m-0">
                      <CallSettings
                        value={config.call}
                        onChange={(call) => setConfig({ ...config, call })}
                      />
                    </TabsContent>
                    <TabsContent value="tools" className="m-0">
                      <ToolsSettings
                        value={config.tools}
                        onChange={(tools) => setConfig({ ...config, tools })}
                      />
                    </TabsContent>
                    <TabsContent value="analytics" className="m-0">
                      <AnalyticsSettings
                        value={config.analytics}
                        onChange={(analytics) => setConfig({ ...config, analytics })}
                      />
                    </TabsContent>
                    <TabsContent value="inbound" className="m-0">
                      <InboundSettings
                        value={config.inbound}
                        onChange={(inbound) => setConfig({ ...config, inbound })}
                      />
                    </TabsContent>
                  </Card>
                </Tabs>
              </div>
            </div>

            {/* Right Sidebar - Actions */}
            <div className="w-72 border-l bg-card p-4 space-y-4">
              <Button variant="outline" className="w-full gap-2">
                <ExternalLink className="h-4 w-4" />
                See all call logs
              </Button>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    className="flex-1 gap-2"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? "Saving..." : "Save agent"}
                  </Button>
                  <Button variant="outline" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Last updated {formatTimeAgo(lastUpdated)}
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <Button variant="outline" className="w-full gap-2 text-primary border-primary">
                  <MessageCircle className="h-4 w-4" />
                  Chat with agent
                </Button>
                <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                  💡 Chat is the fastest way to test and refine the agent.
                </p>
              </div>

              <div className="border-t pt-4 space-y-3">
                <Button variant="outline" className="w-full gap-2">
                  <PhoneCall className="h-4 w-4" />
                  Test via web call
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Test your agent with voice calls
                </p>
              </div>

              <div className="border-t pt-4 space-y-2">
                <Button className="w-full gap-2" variant="default">
                  <PhoneCall className="h-4 w-4" />
                  Get call from agent
                </Button>
                <Button variant="outline" className="w-full gap-2">
                  <PhoneIncoming className="h-4 w-4" />
                  Set inbound agent
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
