import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Smartphone, 
  MessageCircle, 
  Play, 
  Pause, 
  Volume2,
  Bot,
  User,
  Sparkles
} from "lucide-react";
import { AgentFullConfig } from "@/hooks/useAgentBuilder";

interface AgentPreviewPanelProps {
  config: AgentFullConfig;
  agentName: string;
  isNewAgent: boolean;
}

export function AgentPreviewPanel({ config, agentName, isNewAgent }: AgentPreviewPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Simulate conversation based on config
  const sampleConversation = [
    { role: "agent", message: config.agent.welcomeMessage || "Hello! How can I help you today?" },
    { role: "user", message: "Hi, I'm interested in your services." },
    { role: "agent", message: "That's great to hear! I'd be happy to tell you more about what we offer. Could you share what specifically caught your attention?" },
  ];

  return (
    <div className="h-full flex flex-col bg-muted/30">
      {/* Preview Header */}
      <div className="p-4 border-b border-border bg-background">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm uppercase tracking-wider">Live Preview</h3>
          <Badge variant="outline" className="text-[10px]">
            {config.audio.voiceName || "Default Voice"}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={isPlaying ? "default" : "outline"} 
            size="sm" 
            className="flex-1 gap-2"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            {isPlaying ? "Pause" : "Play Demo"}
          </Button>
          <Button variant="outline" size="icon" className="shrink-0">
            <Volume2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Phone Preview */}
      <div className="flex-1 p-4 flex items-center justify-center">
        <div className="w-full max-w-[280px]">
          {/* Phone Frame */}
          <div className="relative bg-foreground p-2 shadow-lg">
            {/* Phone Screen */}
            <div className="bg-background aspect-[9/16] flex flex-col">
              {/* Call Header */}
              <div className="bg-primary text-primary-foreground p-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-foreground/20 flex items-center justify-center border border-primary-foreground/30">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">{agentName || "AI Agent"}</p>
                  <p className="text-xs opacity-80 flex items-center gap-1">
                    <span className={`w-2 h-2 ${isPlaying ? 'bg-green-400 animate-pulse' : 'bg-muted'}`} />
                    {isPlaying ? "Speaking..." : "Ready"}
                  </p>
                </div>
                <Sparkles className="h-4 w-4 opacity-60" />
              </div>

              {/* Conversation */}
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-3">
                  {sampleConversation.map((msg, idx) => (
                    <div 
                      key={idx}
                      className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""} animate-fade-in`}
                      style={{ animationDelay: `${idx * 150}ms` }}
                    >
                      <div className={`w-6 h-6 shrink-0 flex items-center justify-center border ${
                        msg.role === "agent" 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted"
                      }`}>
                        {msg.role === "agent" ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
                      </div>
                      <div className={`max-w-[85%] p-2 text-xs border-2 ${
                        msg.role === "agent"
                          ? "bg-muted border-border"
                          : "bg-primary text-primary-foreground border-primary"
                      }`}>
                        {msg.message}
                      </div>
                    </div>
                  ))}
                  {isPlaying && (
                    <div className="flex gap-2 animate-fade-in">
                      <div className="w-6 h-6 shrink-0 flex items-center justify-center border bg-primary text-primary-foreground">
                        <Bot className="h-3 w-3" />
                      </div>
                      <div className="p-2 text-xs border-2 bg-muted border-border">
                        <span className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 bg-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 bg-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-2 border-t border-border bg-muted/50">
                <div className="flex gap-2 items-center">
                  <div className="flex-1 h-8 bg-background border-2 border-border px-2 flex items-center">
                    <span className="text-xs text-muted-foreground">Type or speak...</span>
                  </div>
                  <Button size="icon" variant="default" className="h-8 w-8 shrink-0">
                    <MessageCircle className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Config Summary */}
      <div className="p-4 border-t border-border bg-background">
        <h4 className="text-xs font-bold uppercase tracking-wider mb-3 text-muted-foreground">
          Active Configuration
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between p-2 bg-muted border border-border">
            <span className="text-muted-foreground">Model</span>
            <span className="font-mono font-bold truncate ml-2">{config.llm.model}</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-muted border border-border">
            <span className="text-muted-foreground">Voice</span>
            <span className="font-mono font-bold truncate ml-2">{config.audio.voiceProvider}</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-muted border border-border">
            <span className="text-muted-foreground">Language</span>
            <span className="font-mono font-bold">{config.audio.language.toUpperCase()}</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-muted border border-border">
            <span className="text-muted-foreground">Temp</span>
            <span className="font-mono font-bold">{config.llm.temperature}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
