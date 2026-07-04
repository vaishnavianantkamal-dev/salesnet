import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit2, Image as ImageIcon, Plus, Trash2, Monitor } from 'lucide-react';
import api from '@/api/axios';
import { useToast } from '@/hooks/useToast';

export default function PlatformConfigurator({ data = {}, onChange }) {
  const { toast } = useToast();
  const [uploadingIndex, setUploadingIndex] = useState(null);

  const sectionBadge = data.sectionBadge || '';
  const mainHeadline = data.mainHeadline || '';
  const nodes = data.nodes || [];

  const handleImageUpload = async (e, index) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      setUploadingIndex(index);
      const res = await api.post('/api/landing/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const newNodes = [...nodes];
      newNodes[index].mediaUrl = res.data.url;
      onChange('nodes', newNodes);
      
      toast({ title: 'Success', description: 'Platform image uploaded' });
    } catch (error) {
      toast({ title: 'Error', description: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploadingIndex(null);
    }
  };

  const addNode = () => {
    onChange('nodes', [...nodes, { 
      stepTitle: '', 
      briefNarrative: '', 
      smallTag: '', 
      mediaUrl: '',
      keyFeatures: [] 
    }]);
  };

  const removeNode = (index) => {
    const updated = [...nodes];
    updated.splice(index, 1);
    onChange('nodes', updated);
  };

  const updateNode = (index, key, value) => {
    const updated = [...nodes];
    updated[index][key] = value;
    onChange('nodes', updated);
  };

  const addKeyFeature = (nodeIndex) => {
    const updated = [...nodes];
    if (!updated[nodeIndex].keyFeatures) updated[nodeIndex].keyFeatures = [];
    updated[nodeIndex].keyFeatures.push('');
    onChange('nodes', updated);
  };

  const updateKeyFeature = (nodeIndex, featureIndex, value) => {
    const updated = [...nodes];
    updated[nodeIndex].keyFeatures[featureIndex] = value;
    onChange('nodes', updated);
  };

  const removeKeyFeature = (nodeIndex, featureIndex) => {
    const updated = [...nodes];
    updated[nodeIndex].keyFeatures.splice(featureIndex, 1);
    onChange('nodes', updated);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Configuration */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6 relative overflow-hidden">
        {/* Subtle background icon decoration */}
        <Monitor className="absolute -right-8 -bottom-8 w-48 h-48 text-slate-50 opacity-50 pointer-events-none" />
        
        <div className="space-y-1.5 max-w-3xl relative z-10">
          <Label className="text-xs text-slate-600 font-semibold">Section Badge</Label>
          <Input 
            placeholder="e.g. HOW IT WORKS"
            value={sectionBadge} 
            onChange={(e) => onChange('sectionBadge', e.target.value)} 
            className="bg-slate-50 border-slate-200"
          />
        </div>
        
        <div className="space-y-1.5 max-w-3xl relative z-10">
          <Label className="text-xs text-slate-600 font-semibold">Main Headline</Label>
          <Input 
            placeholder="Go Live in Minutes, Not Months"
            value={mainHeadline} 
            onChange={(e) => onChange('mainHeadline', e.target.value)} 
            className="bg-slate-50 border-slate-200"
          />
        </div>
      </div>

      {/* Workflow Interaction Nodes */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Monitor className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Workflow Interaction Nodes</h4>
              <p className="text-[11px] text-slate-500">Add detailed platform steps to guide your users</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={addNode} className="gap-2 h-8 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50">
            <Plus className="w-3 h-3" /> Add Step
          </Button>
        </div>

        <div className="space-y-6">
          {nodes.length === 0 && (
            <div className="p-8 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-sm">
              No platform steps added yet.
            </div>
          )}
          
          {nodes.map((node, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-6 relative group border-b border-slate-100 pb-8 last:border-0 last:pb-0">
              
              {/* Delete Node Button */}
              <button 
                onClick={() => removeNode(index)}
                className="absolute top-0 right-0 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100 z-10"
                title="Remove step"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Left Column: Visual Art & Tags */}
              <div className="md:col-span-4 flex flex-col gap-4">
                <div>
                  <Label className="text-[11px] text-slate-500 font-medium block mb-2">Visual Representation</Label>
                  <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 flex items-center gap-3">
                    <div className="w-12 h-12 rounded border border-slate-200 bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                      {node.mediaUrl ? (
                        <img src={node.mediaUrl} alt="Step visual" className="w-full h-full object-contain p-1" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-[11px] font-semibold text-slate-700 mb-0.5">Update Media</h5>
                      <p className="text-[9px] text-slate-400 mb-1 truncate">
                        {node.mediaUrl || 'No image'}
                      </p>
                      <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded text-[9px] font-medium transition-colors border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 h-5 px-2">
                        <Edit2 className="w-2.5 h-2.5" />
                        {uploadingIndex === index ? '...' : 'Change'}
                        <input 
                          type="file" 
                          accept="image/*"
                          className="hidden" 
                          onChange={(e) => handleImageUpload(e, index)}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <Label className="text-[10px] text-indigo-500 font-semibold uppercase tracking-wider block mb-1">Step {index + 1}</Label>
                    <div className="h-9 px-3 bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-[11px] flex items-center rounded-lg">
                      NODE #0{index + 1}
                    </div>
                  </div>
                  <div className="flex-[2]">
                    <Label className="text-[10px] text-slate-500 font-medium block mb-1 uppercase tracking-wider">Small Tag</Label>
                    <Input 
                      placeholder="e.g. CONNECT YOUR NUMBER"
                      value={node.smallTag || ''} 
                      onChange={(e) => updateNode(index, 'smallTag', e.target.value)} 
                      className="bg-slate-50 border-slate-200 text-xs h-9 uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Text Fields & Key Features */}
              <div className="md:col-span-8 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-slate-500 font-medium block">Step Title</Label>
                  <Input 
                    placeholder="e.g. One-Click WhatsApp Business Onboarding"
                    value={node.stepTitle || ''} 
                    onChange={(e) => updateNode(index, 'stepTitle', e.target.value)} 
                    className="bg-slate-50 border-slate-200 text-sm font-semibold h-10"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-slate-500 font-medium block">Brief Narrative</Label>
                  <textarea
                    rows={2}
                    placeholder="Connect your WhatsApp Business number directly through the platform..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none text-slate-600"
                    value={node.briefNarrative || ''}
                    onChange={(e) => updateNode(index, 'briefNarrative', e.target.value)}
                  />
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-[11px] text-indigo-600 font-medium flex items-center gap-1.5">
                      <span className="text-[10px]">#</span> Key Features
                    </Label>
                    <Button size="sm" onClick={() => addKeyFeature(index)} className="gap-1.5 h-6 text-[10px] px-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                      <Plus className="w-2.5 h-2.5" /> Add Feature
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {(node.keyFeatures || []).map((feature, fIndex) => (
                      <div key={fIndex} className="relative group/feature">
                        <Input 
                          value={feature}
                          onChange={(e) => updateKeyFeature(index, fIndex, e.target.value)}
                          placeholder="e.g. Official Meta onboarding flow"
                          className="bg-white border-slate-200 text-[11px] pr-8 shadow-sm"
                        />
                        <button
                          onClick={() => removeKeyFeature(index, fIndex)}
                          className="absolute top-1/2 -translate-y-1/2 right-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover/feature:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {(node.keyFeatures || []).length === 0 && (
                      <div className="col-span-1 md:col-span-2 text-[11px] text-slate-400 italic py-1">
                        No key features added for this step.
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
