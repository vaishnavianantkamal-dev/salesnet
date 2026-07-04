import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HelpCircle, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

export default function FaqConfigurator({ data = {}, onChange }) {
  const sectionBadge = data.sectionBadge || '';
  const mainHeadline = data.mainHeadline || '';
  const contextualDescription = data.contextualDescription || '';
  const questions = data.questions || [];

  const [expandedIndex, setExpandedIndex] = useState(null);

  const addQuestion = () => {
    const newQuestions = [...questions, { question: '', answer: '' }];
    onChange('questions', newQuestions);
    setExpandedIndex(newQuestions.length - 1);
  };

  const removeQuestion = (index) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    onChange('questions', newQuestions);
  };

  const updateQuestion = (index, key, value) => {
    const newQuestions = [...questions];
    newQuestions[index][key] = value;
    onChange('questions', newQuestions);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Configuration */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600 font-semibold">Section Badge</Label>
              <Input 
                placeholder="e.g. FAQ"
                value={sectionBadge} 
                onChange={(e) => onChange('sectionBadge', e.target.value)} 
                className="bg-slate-50 border-slate-200"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600 font-semibold">Main Headline</Label>
              <Input 
                placeholder="Frequently Asked Questions"
                value={mainHeadline} 
                onChange={(e) => onChange('mainHeadline', e.target.value)} 
                className="bg-slate-50 border-slate-200"
              />
            </div>
          </div>

          <div className="space-y-1.5 h-full">
            <Label className="text-xs text-slate-600 font-semibold">Contextual Description</Label>
            <textarea
              placeholder="Everything you need to know about Wapi and getting started."
              className="w-full h-[calc(100%-24px)] min-h-[100px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none text-slate-600"
              value={contextualDescription}
              onChange={(e) => onChange('contextualDescription', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Question Selection */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center text-indigo-600">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Question Selection</h4>
              <p className="text-[11px] text-slate-500">Curate the most frequently asked questions for your visitors</p>
            </div>
          </div>
          <Button onClick={addQuestion} size="sm" className="gap-2 h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="w-3.5 h-3.5" /> Add Question
          </Button>
        </div>

        <div className="space-y-3">
          {questions.length === 0 ? (
            <div className="border border-dashed border-slate-200 rounded-xl h-32 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50">
              <HelpCircle className="w-6 h-6 text-slate-300 mb-2" />
              <p className="text-xs text-slate-500">No questions added yet.</p>
            </div>
          ) : (
            questions.map((q, index) => (
              <div key={index} className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm transition-all">
                <div 
                  className={`flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors ${expandedIndex === index ? 'bg-slate-50 border-b border-slate-100' : ''}`}
                  onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                      <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-800">
                      {q.question || 'New Question'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeQuestion(index); }}
                      className="text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {expandedIndex === index ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {expandedIndex === index && (
                  <div className="p-4 space-y-4 bg-white">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-600 font-semibold">Question</Label>
                      <Input 
                        placeholder="e.g. What is WABA?"
                        value={q.question} 
                        onChange={(e) => updateQuestion(index, 'question', e.target.value)} 
                        className="bg-slate-50 border-slate-200"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-600 font-semibold">Answer</Label>
                      <textarea
                        placeholder="Provide a clear and concise answer..."
                        className="w-full h-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none text-slate-600"
                        value={q.answer}
                        onChange={(e) => updateQuestion(index, 'answer', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
