import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Bot,
  Save,
  ArrowLeft,
  Volume2,
  Settings,
  Mic,
  Phone,
  MessageSquare,
  Loader2,
  FileText,
  RotateCcw,
  CheckCircle,
} from "lucide-react";
import { VoiceSelector, VoiceConfig, CARTESIA_VOICES } from "@/components/agent-builder/VoiceSelector";
import { LLMSettings, LLMConfig } from "@/components/agent-builder/LLMSettings";
import { TranscriberSettings, TranscriberConfig } from "@/components/agent-builder/TranscriberSettings";
import { TelephonySettings, TelephonyConfig } from "@/components/agent-builder/TelephonySettings";
import { ConversationSettings, ConversationConfig } from "@/components/agent-builder/ConversationSettings";

interface Agent {
  id: string;
  agent_name: string;
  bolna_agent_id: string;
  status: string;
  current_system_prompt: string | null;
  original_system_prompt: string | null;
  agent_config: Record<string, unknown> | null;
  client_id: string | null;
}

// Default configurations
const defaultVoiceConfig: VoiceConfig = {
  provider: "cartesia",
  voiceId: CARTESIA_VOICES[0].id,
  voiceName: CARTESIA_VOICES[0].name,
};

const defaultLLMConfig: LLMConfig = {
  model: "gpt-4.1-nano",
  provider: "openai",
  family: "openai",
  temperature: 0.7,
  maxTokens: 150,
};

const defaultTranscriberConfig: TranscriberConfig = {
  provider: "deepgram",
  model: "nova-3",
  language: "en",
};

const defaultTelephonyConfig: TelephonyConfig = {
  provider: "plivo",
};

const defaultConversationConfig: ConversationConfig = {
  hangupAfterSilence: 10,
  callTerminate: 90,
  interruptionWords: 2,
  voicemailDetection: true,
  backchanneling: false,
  ambientNoise: false,
  ambientNoiseTrack: "office-ambience",
};

export default function AgentConfigEditor() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const agentIdFromUrl = searchParams.get("agentId");

  const [selectedAgentId, setSelectedAgentId] = useState<string>(agentIdFromUrl || "");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>(defaultVoiceConfig);
  const [llmConfig, setLLMConfig] = useState<LLMConfig>(defaultLLMConfig);
  const [transcriberConfig, setTranscriberConfig] = useState<TranscriberConfig>(defaultTranscriberConfig);
  const [telephonyConfig, setTelephonyConfig] = useState<TelephonyConfig>(defaultTelephonyConfig);
  const [conversationConfig, setConversationConfig] = useState<ConversationConfig>(defaultConversationConfig);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch agents assigned to this engineer
  const { data: myAgents = [], isLoading: loadingAgents } = useQuery({
    queryKey: ["my-assigned-agents-editor", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("bolna_agents")
        .select("id, agent_name, bolna_agent_id, status, current_system_prompt, original_system_prompt, agent_config, client_id")
        .eq("engineer_id", user.id)
        .order("agent_name");
      if (error) throw error;
      return data as Agent[];
    },
    enabled: !!user?.id,
  });

  // Load agent config when selected
  const selectedAgent = myAgents.find((a) => a.id === selectedAgentId);

  useEffect(() => {
    if (selectedAgent) {
      setSystemPrompt(selectedAgent.current_system_prompt || selectedAgent.original_system_prompt || "");
      
      // Parse agent_config if available
      const config = selectedAgent.agent_config as Record<string, unknown> | null;
      if (config) {
        // Voice config
        if (config.voice) {
          const voice = config.voice as Record<string, unknown>;
          const provider = (voice.provider as string) === "elevenlabs" ? "elevenlabs" : "cartesia";
          setVoiceConfig({
            provider,
            voiceId: (voice.voiceId as string) || CARTESIA_VOICES[0].id,
            voiceName: (voice.voiceName as string) || CARTESIA_VOICES[0].name,
          });
        }
        // LLM config
        if (config.llm) {
          const llm = config.llm as Record<string, unknown>;
          setLLMConfig({
            model: (llm.model as string) || "gpt-4.1-nano",
            provider: (llm.provider as string) || "openai",
            family: (llm.family as string) || "openai",
            temperature: (llm.temperature as number) || 0.7,
            maxTokens: (llm.maxTokens as number) || 150,
          });
        }
        // Transcriber config
        if (config.transcriber) {
          const transcriber = config.transcriber as Record<string, unknown>;
          setTranscriberConfig({
            provider: (transcriber.provider as string) || "deepgram",
            model: (transcriber.model as string) || "nova-3",
            language: (transcriber.language as string) || "en",
          });
        }
        // Telephony config
        if (config.telephony) {
          const telephony = config.telephony as Record<string, unknown>;
          setTelephonyConfig({
            provider: (telephony.provider as "twilio" | "plivo" | "exotel") || "plivo",
          });
        }
        // Conversation config
        if (config.conversation) {
          const conv = config.conversation as Record<string, unknown>;
          setConversationConfig({
            hangupAfterSilence: (conv.hangupAfterSilence as number) || 10,
            callTerminate: (conv.callTerminate as number) || 90,
            interruptionWords: (conv.interruptionWords as number) || 2,
            voicemailDetection: (conv.voicemailDetection as boolean) ?? true,
            backchanneling: (conv.backchanneling as boolean) ?? false,
            ambientNoise: (conv.ambientNoise as boolean) ?? false,
            ambientNoiseTrack: (conv.ambientNoiseTrack as "office-ambience" | "coffee-shop" | "call-center") || "office-ambience",
          });
        }
      }
      setHasChanges(false);
    }
  }, [selectedAgent]);

  // Track changes
  useEffect(() => {
    if (selectedAgent) {
      setHasChanges(true);
    }
  }, [systemPrompt, voiceConfig, llmConfig, transcriberConfig, telephonyConfig, conversationConfig]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAgentId) throw new Error("No agent selected");

      const updatedConfig = {
        voice: { ...voiceConfig },
        llm: { ...llmConfig },
        transcriber: { ...transcriberConfig },
        telephony: { ...telephonyConfig },
        conversation: { ...conversationConfig },
      };

      const { error } = await supabase
        .from("bolna_agents")
        .update({
          current_system_prompt: systemPrompt,
          agent_config: JSON.parse(JSON.stringify(updatedConfig)),
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedAgentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-assigned-agents-editor"] });
      toast.success("Agent configuration saved!");
      setHasChanges(false);
    },
    onError: (error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  // Reset to original prompt
  const handleResetPrompt = () => {
    if (selectedAgent?.original_system_prompt) {
      setSystemPrompt(selectedAgent.original_system_prompt);
      toast.info("Prompt reset to original");
    }
  };

  return (
    <DashboardLayout role="engineer">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/engineer/agents")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Agent Configuration</h1>
              <p className="text-sm text-muted-foreground">
                Configure voice, LLM, and conversation settings
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {hasChanges && (
              <Badge variant="outline" className="text-chart-4 border-chart-4">
                Unsaved changes
              </Badge>
            )}
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!selectedAgentId || saveMutation.isPending || !hasChanges}
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Configuration
            </Button>
          </div>
        </div>

        {/* Agent Selector */}
        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Select Agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAgents ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading agents...
              </div>
            ) : myAgents.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No agents assigned to you yet.</p>
                <p className="text-sm">Wait for an admin to assign agents.</p>
              </div>
            ) : (
              <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                <SelectTrigger className="border-2 max-w-md">
                  <SelectValue placeholder="Choose an agent to configure" />
                </SelectTrigger>
                <SelectContent>
                  {myAgents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      <div className="flex items-center gap-2">
                        <span>{agent.agent_name}</span>
                        <Badge variant={agent.status === "active" ? "default" : "secondary"} className="text-xs">
                          {agent.status}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {/* Configuration Tabs */}
        {selectedAgent && (
          <Tabs defaultValue="prompt" className="space-y-4">
            <TabsList className="grid grid-cols-5 w-full max-w-2xl">
              <TabsTrigger value="prompt" className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Prompt</span>
              </TabsTrigger>
              <TabsTrigger value="voice" className="flex items-center gap-1">
                <Volume2 className="h-4 w-4" />
                <span className="hidden sm:inline">Voice</span>
              </TabsTrigger>
              <TabsTrigger value="llm" className="flex items-center gap-1">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">LLM</span>
              </TabsTrigger>
              <TabsTrigger value="transcriber" className="flex items-center gap-1">
                <Mic className="h-4 w-4" />
                <span className="hidden sm:inline">STT</span>
              </TabsTrigger>
              <TabsTrigger value="telephony" className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                <span className="hidden sm:inline">Telephony</span>
              </TabsTrigger>
            </TabsList>

            {/* System Prompt Tab */}
            <TabsContent value="prompt">
              <Card className="border-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      System Prompt
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={handleResetPrompt}>
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reset to Original
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="systemPrompt">Agent Instructions</Label>
                    <Textarea
                      id="systemPrompt"
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      placeholder="Enter the system prompt for this agent..."
                      className="min-h-[300px] font-mono text-sm border-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      Define how the agent should behave, its personality, and goals.
                    </p>
                  </div>

                  {selectedAgent.original_system_prompt && (
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Original Prompt (Read-only)</Label>
                      <div className="p-3 bg-muted/50 border border-border rounded text-sm max-h-40 overflow-auto">
                        <pre className="whitespace-pre-wrap font-mono text-xs">
                          {selectedAgent.original_system_prompt}
                        </pre>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Voice Tab */}
            <TabsContent value="voice">
              <Card className="border-2">
                <CardContent className="pt-6">
                  <VoiceSelector value={voiceConfig} onChange={setVoiceConfig} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* LLM Tab */}
            <TabsContent value="llm">
              <Card className="border-2">
                <CardContent className="pt-6">
                  <LLMSettings value={llmConfig} onChange={setLLMConfig} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Transcriber Tab */}
            <TabsContent value="transcriber">
              <Card className="border-2">
                <CardContent className="pt-6">
                  <TranscriberSettings value={transcriberConfig} onChange={setTranscriberConfig} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Telephony Tab */}
            <TabsContent value="telephony">
              <Card className="border-2">
                <CardContent className="pt-6 space-y-6">
                  <TelephonySettings value={telephonyConfig} onChange={setTelephonyConfig} />
                  <ConversationSettings value={conversationConfig} onChange={setConversationConfig} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* No Agent Selected State */}
        {!selectedAgent && myAgents.length > 0 && (
          <Card className="border-2 border-dashed">
            <CardContent className="py-12 text-center">
              <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium mb-2">Select an Agent</p>
              <p className="text-muted-foreground">
                Choose an agent from the dropdown above to configure its settings.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
