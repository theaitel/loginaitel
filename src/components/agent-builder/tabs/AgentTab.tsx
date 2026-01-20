import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MessageSquare, Sparkles } from "lucide-react";
import { AgentConfig } from "../AgentBuilder";

interface AgentTabProps {
    config: AgentConfig;
    updateConfig: (updates: Partial<AgentConfig>) => void;
}

export function AgentTab({ config, updateConfig }: AgentTabProps) {
    return (
        <div className="space-y-6">
            {/* Welcome Message */}
            <div className="card-tactile bg-card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-lg">Agent Welcome Message</h3>
                </div>
                <Textarea
                    placeholder="hello"
                    value={config.welcomeMessage}
                    onChange={(e) => updateConfig({ welcomeMessage: e.target.value })}
                    className="min-h-[80px] border-2 font-mono"
                />
                <p className="text-xs text-muted-foreground mt-2">
                    Initial greeting when the call starts. You can define variables using {"{variable_name}"}
                </p>
            </div>

            {/* Agent Prompt */}
            <div className="card-tactile bg-card p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        <h3 className="font-bold text-lg">Agent Prompt</h3>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Sparkles className="h-4 w-4" />
                        AI Edit
                    </Button>
                </div>

                <div className="editor-view">
                    <Textarea
                        placeholder={`## AGENT IDENTITY & ROLE
You are **Agent Name**, a professional [role] specializing in [domain].

## VOICE & TONE
- Warm, friendly, and professional
- Conversational and natural (not scripted or robotic)
- Patient and attentive to customer responses

## ACCENT & LANGUAGE
- Speak in [language] throughout the call

## OBJECTIVES
- [Primary objective]
- [Secondary objective]

## GUIDELINES
- Keep responses concise and clear
- Ask clarifying questions when needed
- Use active listening techniques`}
                        value={config.agentPrompt}
                        onChange={(e) => updateConfig({ agentPrompt: e.target.value })}
                        className="min-h-[500px] bg-transparent border-none focus-visible:ring-0 text-inherit font-mono resize-none leading-relaxed"
                    />
                </div>

                <div className="flex justify-between items-center mt-3">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
                        Tokens: ~{Math.ceil(config.agentPrompt.length / 4)} | Chars: {config.agentPrompt.length}
                    </p>
                </div>

                <p className="text-xs text-muted-foreground mt-4">
                    You can define variables using {"{variable_name}"}. Use `@` to mention function calling.
                </p>
            </div>
        </div>
    );
}
