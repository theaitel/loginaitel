import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { GuardrailBlock } from "./AgentBuilder";

interface GuardrailBuilderProps {
    guardrails: GuardrailBlock[];
    onChange: (guardrails: GuardrailBlock[]) => void;
}

export function GuardrailBuilder({ guardrails, onChange }: GuardrailBuilderProps) {
    const [editingBlock, setEditingBlock] = useState<GuardrailBlock | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleAddBlock = () => {
        const newBlock: GuardrailBlock = {
            id: Date.now().toString(),
            name: "",
            response: "",
            threshold: 0.9,
            utterances: [""],
        };
        setEditingBlock(newBlock);
        setIsDialogOpen(true);
    };

    const handleSaveBlock = () => {
        if (!editingBlock) return;

        const existingIndex = guardrails.findIndex((g) => g.id === editingBlock.id);
        if (existingIndex >= 0) {
            const updated = [...guardrails];
            updated[existingIndex] = editingBlock;
            onChange(updated);
        } else {
            onChange([...guardrails, editingBlock]);
        }

        setIsDialogOpen(false);
        setEditingBlock(null);
    };

    const handleDeleteBlock = (id: string) => {
        onChange(guardrails.filter((g) => g.id !== id));
    };

    const handleEditBlock = (block: GuardrailBlock) => {
        setEditingBlock({ ...block });
        setIsDialogOpen(true);
    };

    const updateEditingBlock = (updates: Partial<GuardrailBlock>) => {
        if (!editingBlock) return;
        setEditingBlock({ ...editingBlock, ...updates });
    };

    const addUtterance = () => {
        if (!editingBlock) return;
        if (editingBlock.utterances.length >= 20) return;
        updateEditingBlock({ utterances: [...editingBlock.utterances, ""] });
    };

    const updateUtterance = (index: number, value: string) => {
        if (!editingBlock) return;
        const updated = [...editingBlock.utterances];
        updated[index] = value;
        updateEditingBlock({ utterances: updated });
    };

    const removeUtterance = (index: number) => {
        if (!editingBlock) return;
        updateEditingBlock({
            utterances: editingBlock.utterances.filter((_, i) => i !== index),
        });
    };

    return (
        <div className="space-y-4">
            {/* Existing Blocks */}
            {guardrails.length > 0 && (
                <div className="space-y-2">
                    {guardrails.map((block) => (
                        <div
                            key={block.id}
                            className="flex items-center gap-3 p-3 border-2 border-border bg-accent/20 hover:bg-accent/40 transition-colors"
                        >
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                            <div className="flex-1">
                                <p className="font-medium text-sm">{block.name || "Untitled Block"}</p>
                                <p className="text-xs text-muted-foreground">
                                    {block.utterances.length} utterances • Threshold: {block.threshold.toFixed(2)}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditBlock(block)}
                            >
                                Edit
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteBlock(block.id)}
                            >
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {/* Add New Block Button */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button
                        variant="outline"
                        className="w-full border-2 border-dashed hover:border-primary"
                        onClick={handleAddBlock}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add a new block for FAQs & Guardrails
                    </Button>
                </DialogTrigger>

                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add new block</DialogTitle>
                        <p className="text-sm text-muted-foreground">
                            This will add a new blocks for FAQs & Guardrails
                        </p>
                    </DialogHeader>

                    {editingBlock && (
                        <div className="space-y-4 mt-4">
                            {/* Name */}
                            <div>
                                <Label className="text-sm font-medium mb-2 block">Name</Label>
                                <Input
                                    placeholder="Block name for FAQs & Guardrails"
                                    value={editingBlock.name}
                                    onChange={(e) => updateEditingBlock({ name: e.target.value })}
                                    className="border-2"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Put a name for this block
                                </p>
                            </div>

                            {/* Response */}
                            <div>
                                <Label className="text-sm font-medium mb-2 block">Response</Label>
                                <Textarea
                                    placeholder="Forced responses for the given threshold and messages"
                                    value={editingBlock.response}
                                    onChange={(e) => updateEditingBlock({ response: e.target.value })}
                                    className="border-2 min-h-[80px]"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Put a response for this block rule
                                </p>
                            </div>

                            {/* Threshold */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <Label className="text-sm font-medium">Threshold for this rule</Label>
                                    <span className="text-sm font-mono font-bold">
                                        {editingBlock.threshold.toFixed(1)}
                                    </span>
                                </div>
                                <Slider
                                    value={[editingBlock.threshold * 100]}
                                    onValueChange={([value]) =>
                                        updateEditingBlock({ threshold: value / 100 })
                                    }
                                    min={0}
                                    max={100}
                                    step={1}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    A lower threshold increases the likelihood that sentences similar to the utterances will trigger this response, but it also raises the risk of unintended sentences matching this response
                                </p>
                            </div>

                            {/* Utterances */}
                            <div>
                                <Label className="text-sm font-medium mb-2 block">Utterances</Label>
                                <div className="space-y-2">
                                    {editingBlock.utterances.map((utterance, index) => (
                                        <div key={index} className="flex gap-2">
                                            <Input
                                                placeholder="Enter an utterance..."
                                                value={utterance}
                                                onChange={(e) => updateUtterance(index, e.target.value)}
                                                className="border-2"
                                            />
                                            {editingBlock.utterances.length > 1 && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeUtterance(index)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {editingBlock.utterances.length < 20 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-2"
                                        onClick={addUtterance}
                                    >
                                        Add more (up to 20)
                                    </Button>
                                )}
                            </div>

                            {/* Save Button */}
                            <div className="flex justify-end gap-2 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button onClick={handleSaveBlock}>
                                    Save
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
