import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { AssessmentSection } from '@/lib/db';
import { Upload } from 'lucide-react';

interface AssessmentPreviewProps {
  sections: AssessmentSection[];
}

export function AssessmentPreview({ sections }: AssessmentPreviewProps) {
  const [responses, setResponses] = useState<Record<string, any>>({});

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const shouldShowQuestion = (question: any) => {
    if (!question.conditionalOn) return true;
    const conditionValue = responses[question.conditionalOn.questionId];
    if (Array.isArray(question.conditionalOn.value)) {
      return question.conditionalOn.value.includes(conditionValue);
    }
    return conditionValue === question.conditionalOn.value;
  };

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <Card key={section.id} className="p-6">
          <h3 className="text-xl font-semibold mb-2">{section.title}</h3>
          {section.description && (
            <p className="text-muted-foreground mb-4">{section.description}</p>
          )}

          <div className="space-y-6">
            {section.questions.filter(shouldShowQuestion).map((question, idx) => (
              <div key={question.id} className="space-y-2">
                <Label className="text-base">
                  {idx + 1}. {question.question}
                  {question.required && <span className="text-destructive ml-1">*</span>}
                </Label>

                {question.type === 'short-text' && (
                  <Input
                    value={responses[question.id] || ''}
                    onChange={(e) => handleResponseChange(question.id, e.target.value)}
                    maxLength={question.validation?.maxLength}
                  />
                )}

                {question.type === 'long-text' && (
                  <Textarea
                    value={responses[question.id] || ''}
                    onChange={(e) => handleResponseChange(question.id, e.target.value)}
                    rows={4}
                    maxLength={question.validation?.maxLength}
                  />
                )}

                {question.type === 'numeric' && (
                  <Input
                    type="number"
                    value={responses[question.id] || ''}
                    onChange={(e) => handleResponseChange(question.id, Number(e.target.value))}
                    min={question.validation?.min}
                    max={question.validation?.max}
                  />
                )}

                {question.type === 'single-choice' && question.options && (
                  <RadioGroup
                    value={responses[question.id]}
                    onValueChange={(value) => handleResponseChange(question.id, value)}
                  >
                    {question.options.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                        <Label htmlFor={`${question.id}-${option}`} className="font-normal">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {question.type === 'multi-choice' && question.options && (
                  <div className="space-y-2">
                    {question.options.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${question.id}-${option}`}
                          checked={(responses[question.id] || []).includes(option)}
                          onCheckedChange={(checked) => {
                            const current = responses[question.id] || [];
                            handleResponseChange(
                              question.id,
                              checked
                                ? [...current, option]
                                : current.filter((v: string) => v !== option)
                            );
                          }}
                        />
                        <Label htmlFor={`${question.id}-${option}`} className="font-normal">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}

                {question.type === 'file-upload' && (
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                    <Input type="file" className="hidden" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      ))}

      <Button className="w-full" size="lg">Submit Assessment</Button>
    </div>
  );
}
