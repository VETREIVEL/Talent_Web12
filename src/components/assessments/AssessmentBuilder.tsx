import { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { AssessmentSection, AssessmentQuestion } from '@/lib/db';

interface AssessmentBuilderProps {
  sections: AssessmentSection[];
  onChange: (sections: AssessmentSection[]) => void;
}

export function AssessmentBuilder({ sections, onChange }: AssessmentBuilderProps) {
  const addSection = () => {
    onChange([
      ...sections,
      {
        id: `section-${Date.now()}`,
        title: 'New Section',
        description: '',
        questions: [],
      },
    ]);
  };

  const updateSection = (sectionId: string, updates: Partial<AssessmentSection>) => {
    onChange(sections.map(s => s.id === sectionId ? { ...s, ...updates } : s));
  };

  const deleteSection = (sectionId: string) => {
    onChange(sections.filter(s => s.id !== sectionId));
  };

  const addQuestion = (sectionId: string) => {
    onChange(sections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          questions: [
            ...s.questions,
            {
              id: `question-${Date.now()}`,
              type: 'short-text',
              question: 'New question',
              required: false,
            },
          ],
        };
      }
      return s;
    }));
  };

  const updateQuestion = (sectionId: string, questionId: string, updates: Partial<AssessmentQuestion>) => {
    onChange(sections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          questions: s.questions.map(q => q.id === questionId ? { ...q, ...updates } : q),
        };
      }
      return s;
    }));
  };

  const deleteQuestion = (sectionId: string, questionId: string) => {
    onChange(sections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          questions: s.questions.filter(q => q.id !== questionId),
        };
      }
      return s;
    }));
  };

  return (
    <div className="space-y-4">
      {sections.map((section, sectionIdx) => (
        <Card key={section.id} className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-move" />
            <div className="flex-1 space-y-3">
              <div className="flex gap-2">
                <Input
                  value={section.title}
                  onChange={(e) => updateSection(section.id, { title: e.target.value })}
                  className="font-semibold"
                  placeholder="Section title"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteSection(section.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                value={section.description || ''}
                onChange={(e) => updateSection(section.id, { description: e.target.value })}
                placeholder="Section description (optional)"
                rows={2}
              />

              <div className="space-y-3 pl-4 border-l-2 border-border">
                {section.questions.map((question, qIdx) => (
                  <Card key={question.id} className="p-3 bg-muted/50">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground">Question {qIdx + 1}</Label>
                          <Input
                            value={question.question}
                            onChange={(e) => updateQuestion(section.id, question.id, { question: e.target.value })}
                            placeholder="Question text"
                            className="mt-1"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteQuestion(section.id, question.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Type</Label>
                          <Select
                            value={question.type}
                            onValueChange={(value: any) => updateQuestion(section.id, question.id, { type: value })}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="single-choice">Single Choice</SelectItem>
                              <SelectItem value="multi-choice">Multi Choice</SelectItem>
                              <SelectItem value="short-text">Short Text</SelectItem>
                              <SelectItem value="long-text">Long Text</SelectItem>
                              <SelectItem value="numeric">Numeric</SelectItem>
                              <SelectItem value="file-upload">File Upload</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-end">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={question.required}
                              onCheckedChange={(checked) => updateQuestion(section.id, question.id, { required: checked })}
                            />
                            <Label className="text-xs">Required</Label>
                          </div>
                        </div>
                      </div>

                      {(question.type === 'single-choice' || question.type === 'multi-choice') && (
                        <div>
                          <Label className="text-xs">Options (comma-separated)</Label>
                          <Input
                            value={question.options?.join(', ') || ''}
                            onChange={(e) => updateQuestion(section.id, question.id, {
                              options: e.target.value.split(',').map(o => o.trim()).filter(Boolean),
                            })}
                            placeholder="Option 1, Option 2, Option 3"
                            className="mt-1"
                          />
                        </div>
                      )}

                      {question.type === 'numeric' && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Min</Label>
                            <Input
                              type="number"
                              value={question.validation?.min || ''}
                              onChange={(e) => updateQuestion(section.id, question.id, {
                                validation: { ...question.validation, min: Number(e.target.value) },
                              })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Max</Label>
                            <Input
                              type="number"
                              value={question.validation?.max || ''}
                              onChange={(e) => updateQuestion(section.id, question.id, {
                                validation: { ...question.validation, max: Number(e.target.value) },
                              })}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addQuestion(section.id)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}

      <Button onClick={addSection} variant="outline" className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Section
      </Button>
    </div>
  );
}
