import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  PhoneCall,
  Search,
  Plus,
  Clock,
  RefreshCw,
  Loader2,
  Bot,
  Zap,
  ChevronRight,
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
import { AgentPreviewPanel } from "@/components/agent-builder/AgentPreviewPanel";
import { useAgentBuilder, AgentFullConfig } from "@/hooks/useAgentBuilder";
import { TestCallDialog } from "@/components/agent-builder/TestCallDialog";

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
    ambientNoise: false,
    ambientNoiseTrack: "office-ambience",
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

// Tab configuration
const TABS = [
  { id: "agent", label: "Agent", icon: FileText, description: "Welcome message & prompt" },
  { id: "llm", label: "LLM", icon: Brain, description: "Model & intelligence" },
  { id: "audio", label: "Audio", icon: Headphones, description: "Voice & transcription" },
  { id: "engine", label: "Engine", icon: Cog, description: "Response behavior" },
  { id: "call", label: "Call", icon: Phone, description: "Telephony settings" },
  { id: "tools", label: "Tools", icon: Wrench, description: "Function integrations" },
  { id: "analytics", label: "Analytics", icon: BarChart3, description: "Post-call tasks" },
  { id: "inbound", label: "Inbound", icon: PhoneIncoming, description: "Incoming call settings" },
];

export default function AdminAgentBuilder() {
  const navigate = useNavigate();
  const {
    agents,
    isLoadingAgents,
    syncAgents,
    isSyncing,
    createAgent,
    isCreating,
    updateAgent,
    isUpdating,
    deleteAgent,
    isDeleting,
    fetchAgentDetails,
    makeTestCall,
    stopCall,
  } = useAgentBuilder();

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("agent");
  const [config, setConfig] = useState<AgentFullConfig>(DEFAULT_CONFIG);
  const [agentName, setAgentName] = useState("New Agent");
  const [isNewAgent, setIsNewAgent] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isTestCallDialogOpen, setIsTestCallDialogOpen] = useState(false);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);
  const filteredAgents = agents.filter((a) =>
    a.agent_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const mergeWithDefaults = (partial: unknown): AgentFullConfig => {
    const p = (partial ?? {}) as Partial<AgentFullConfig>;
    return {
      ...DEFAULT_CONFIG,
      ...p,
      agent: { ...DEFAULT_CONFIG.agent, ...(p.agent ?? {}) },
      llm: { ...DEFAULT_CONFIG.llm, ...(p.llm ?? {}) },
      audio: { ...DEFAULT_CONFIG.audio, ...(p.audio ?? {}) },
      engine: { ...DEFAULT_CONFIG.engine, ...(p.engine ?? {}) },
      call: { ...DEFAULT_CONFIG.call, ...(p.call ?? {}) },
      tools: { ...DEFAULT_CONFIG.tools, ...(p.tools ?? {}) },
      analytics: { ...DEFAULT_CONFIG.analytics, ...(p.analytics ?? {}) },
      inbound: { ...DEFAULT_CONFIG.inbound, ...(p.inbound ?? {}) },
    };
  };

  // Load agent details when selecting an agent
  useEffect(() => {
    async function loadAgentDetails() {
      if (!selectedAgentId || isNewAgent) return;

      const agent = agents.find((a) => a.id === selectedAgentId);
      if (!agent) return;

      setAgentName(agent.agent_name);
      setLastUpdated(new Date(agent.updated_at));

      // If we have cached config, use it (but always merge with defaults)
      if (agent.agent_config) {
        setConfig(mergeWithDefaults(agent.agent_config));
        return;
      }

      // Otherwise fetch from API
      setIsLoadingDetails(true);
      try {
        const details = await fetchAgentDetails(agent.external_agent_id);
        if (details) {
          setConfig(mergeWithDefaults(details));
        }
      } finally {
        setIsLoadingDetails(false);
      }
    }

    loadAgentDetails();
  }, [selectedAgentId, isNewAgent, agents, fetchAgentDetails]);

  // Select first agent on load
  useEffect(() => {
    if (agents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(agents[0].id);
      setIsNewAgent(false);
    }
  }, [agents, selectedAgentId]);

  const handleSave = async () => {
    if (!agentName.trim()) {
      toast.error("Agent name is required");
      return;
    }

    try {
      if (isNewAgent) {
        const newAgent = await createAgent({ name: agentName, config });
        setSelectedAgentId(newAgent.id);
        setIsNewAgent(false);
      } else if (selectedAgent) {
        await updateAgent({
          id: selectedAgent.id,
          externalId: selectedAgent.external_agent_id,
          name: agentName,
          config,
        });
      }
      setLastUpdated(new Date());
    } catch (error) {
      // Error already handled by mutation
    }
  };

  const handleNewAgent = () => {
    setSelectedAgentId(null);
    setConfig(DEFAULT_CONFIG);
    setAgentName("New Agent");
    setIsNewAgent(true);
    setActiveTab("agent");
    setLastUpdated(null);
  };

  const handleDeleteAgent = async () => {
    if (!selectedAgent) return;

    try {
      await deleteAgent({
        id: selectedAgent.id,
        externalId: selectedAgent.external_agent_id,
      });
      setSelectedAgentId(null);
      setIsNewAgent(true);
      setConfig(DEFAULT_CONFIG);
      setAgentName("New Agent");
    } catch (error) {
      // Error already handled by mutation
    }
  };

  const handleCopyAgentId = () => {
    if (selectedAgent) {
      navigator.clipboard.writeText(selectedAgent.external_agent_id);
      toast.success("Agent ID copied to clipboard");
    }
  };

  const formatTimeAgo = (date: Date | null) => {
    if (!date) return "Not saved";
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const isSaving = isCreating || isUpdating;

  const handleTestCall = async (phoneNumber: string) => {
    if (!selectedAgent) {
      return { success: false, message: "No agent selected" };
    }
    return makeTestCall(selectedAgent.external_agent_id, phoneNumber);
  };

  const handleStopCall = async (executionId: string) => {
    await stopCall(executionId);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "agent":
        return <AgentSettings value={config.agent} onChange={(agent) => setConfig({ ...config, agent })} />;
      case "llm":
        return <LLMSettingsAdvanced value={config.llm} onChange={(llm) => setConfig({ ...config, llm })} />;
      case "audio":
        return <AudioSettings value={config.audio} onChange={(audio) => setConfig({ ...config, audio })} />;
      case "engine":
        return <EngineSettings value={config.engine} onChange={(engine) => setConfig({ ...config, engine })} />;
      case "call":
        return <CallSettings value={config.call} onChange={(call) => setConfig({ ...config, call })} />;
      case "tools":
        return <ToolsSettings value={config.tools} onChange={(tools) => setConfig({ ...config, tools })} />;
      case "analytics":
        return <AnalyticsSettings value={config.analytics} onChange={(analytics) => setConfig({ ...config, analytics })} />;
      case "inbound":
        return <InboundSettings value={config.inbound} onChange={(inbound) => setConfig({ ...config, inbound })} />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout role="admin">
      <TooltipProvider>
        <div className="h-[calc(100vh-4rem)] flex flex-col">
          {/* Compact Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b-2 border-border bg-background">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary text-primary-foreground flex items-center justify-center border-2 border-border shadow-sm">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">Agent Studio</h1>
                <p className="text-xs text-muted-foreground">Build & configure AI voice agents</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => syncAgents()}
                disabled={isSyncing}
                className="gap-2"
              >
                <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
                Sync
              </Button>
              <Button size="sm" onClick={handleNewAgent} className="gap-2">
                <Plus className="h-3 w-3" />
                New Agent
              </Button>
            </div>
          </div>

          {/* Main 3-Panel Layout */}
          <div className="flex-1 flex overflow-hidden">
            {/* LEFT PANEL: Agent List */}
            <div className="w-64 border-r-2 border-border flex flex-col bg-background">
              {/* Search */}
              <div className="p-3 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search agents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-9 text-sm"
                  />
                </div>
              </div>

              {/* Agent List */}
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {isLoadingAgents ? (
                    <div className="space-y-2 p-2">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-14 w-full" />
                      ))}
                    </div>
                  ) : filteredAgents.length === 0 ? (
                    <div className="text-center p-6">
                      <Bot className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {searchQuery ? "No agents found" : "No agents yet"}
                      </p>
                      <Button size="sm" variant="outline" className="mt-3" onClick={handleNewAgent}>
                        Create First Agent
                      </Button>
                    </div>
                  ) : (
                    filteredAgents.map((agent) => (
                      <button
                        key={agent.id}
                        onClick={() => {
                          setSelectedAgentId(agent.id);
                          setIsNewAgent(false);
                        }}
                        className={`w-full text-left p-3 transition-all border-2 group ${
                          selectedAgentId === agent.id && !isNewAgent
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "border-transparent hover:border-border hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">{agent.agent_name}</span>
                            </div>
                            <p className={`text-xs mt-0.5 truncate ${
                              selectedAgentId === agent.id && !isNewAgent
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            }`}>
                              {agent.external_agent_id.slice(0, 8)}...
                            </p>
                          </div>
                          <Badge
                            variant={agent.status === "active" || agent.status === "processed" ? "default" : "secondary"}
                            className={`text-[9px] shrink-0 ${
                              selectedAgentId === agent.id && !isNewAgent
                                ? "bg-primary-foreground text-primary"
                                : ""
                            }`}
                          >
                            {agent.status === "processed" ? "ready" : agent.status}
                          </Badge>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* CENTER PANEL: Editor */}
            <div className="flex-1 flex overflow-hidden">
              {/* Vertical Tab Bar */}
              <div className="w-16 border-r border-border bg-muted/30 flex flex-col py-2">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <Tooltip key={tab.id} delayDuration={100}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full py-3 flex flex-col items-center gap-1 transition-all relative ${
                            isActive
                              ? "bg-background text-primary"
                              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                          }`}
                        >
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary" />
                          )}
                          <Icon className="h-4 w-4" />
                          <span className="text-[10px] font-medium">{tab.label}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="font-medium">
                        <p>{tab.label}</p>
                        <p className="text-xs text-muted-foreground">{tab.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>

              {/* Editor Content */}
              <div className="flex-1 overflow-auto bg-background">
                <div className="p-6 max-w-4xl">
                  {/* Agent Header */}
                  <div className="mb-6 pb-4 border-b border-border">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 bg-muted border-2 border-border flex items-center justify-center">
                        <Bot className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <Input
                          value={agentName}
                          onChange={(e) => setAgentName(e.target.value)}
                          className="text-xl font-bold border-none p-0 h-auto focus-visible:ring-0 bg-transparent"
                          placeholder="Agent Name"
                        />
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {isNewAgent ? "Unsaved" : formatTimeAgo(lastUpdated)}
                          </span>
                          {!isNewAgent && selectedAgent && (
                            <button 
                              onClick={handleCopyAgentId}
                              className="flex items-center gap-1 hover:text-foreground transition-colors"
                            >
                              <Copy className="h-3 w-3" />
                              Copy ID
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={handleSave}
                          disabled={isSaving || isLoadingDetails}
                          className="gap-2 shadow-sm"
                        >
                          {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          {isSaving ? "Saving..." : isNewAgent ? "Create" : "Save"}
                        </Button>
                        
                        {!isNewAgent && selectedAgent && (
                          <>
                            <Button
                              variant="outline"
                              onClick={() => setIsTestCallDialogOpen(true)}
                              className="gap-2"
                            >
                              <PhoneCall className="h-4 w-4" />
                              Test Call
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="icon" disabled={isDeleting}>
                                  {isDeleting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Agent</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{selectedAgent.agent_name}"? This action
                                    cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={handleDeleteAgent}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tab Content */}
                  {isLoadingDetails ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">Loading agent configuration...</p>
                      </div>
                    </div>
                  ) : (
                    <Card className="p-6 border-2 shadow-sm animate-fade-in">
                      {renderTabContent()}
                    </Card>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT PANEL: Live Preview */}
            <div className="w-80 border-l-2 border-border">
              <AgentPreviewPanel
                config={config}
                agentName={agentName}
                isNewAgent={isNewAgent}
              />
            </div>
          </div>

          {/* Test Call Dialog */}
          {selectedAgent && (
            <TestCallDialog
              open={isTestCallDialogOpen}
              onOpenChange={setIsTestCallDialogOpen}
              agentName={selectedAgent.agent_name}
              agentId={selectedAgent.id}
              externalAgentId={selectedAgent.external_agent_id}
              onTestCall={handleTestCall}
              onStopCall={handleStopCall}
            />
          )}
        </div>
      </TooltipProvider>
    </DashboardLayout>
  );
}
