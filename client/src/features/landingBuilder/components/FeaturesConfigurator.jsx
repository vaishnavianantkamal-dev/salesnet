import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit2, Image as ImageIcon, Plus, Trash2, Zap } from 'lucide-react';
import api from '@/api/axios';
import { useToast } from '@/hooks/useToast';

export default function FeaturesConfigurator({ data = {}, onChange }) {
  const { toast } = useToast();
  const [uploadingIndex, setUploadingIndex] = useState(null);

  const sectionBadge = data.sectionBadge || '';
  const headline = data.headline || '';
  const descriptionText = data.descriptionText || '';
  const ctaButton = data.ctaButton || { label: '', targetUrl: '' };
  const highlights = data.highlights || [];

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
      
      const newHighlights = [...highlights];
      newHighlights[index].mediaUrl = res.data.url;
      onChange('highlights', newHighlights);
      
      toast({ title: 'Success', description: 'Feature image uploaded' });
    } catch (error) {
      toast({ title: 'Error', description: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploadingIndex(null);
    }
  };

  const addHighlight = () => {
    onChange('highlights', [...highlights, { title: '', description: '', mediaUrl: '' }]);
  };

  const removeHighlight = (index) => {
    const updated = [...highlights];
    updated.splice(index, 1);
    onChange('highlights', updated);
  };

  const updateHighlight = (index, key, value) => {
    const updated = [...highlights];
    updated[index][key] = value;
    onChange('highlights', updated);
  };

  return (
    <div className="space-y-6">
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column: Text Content */}
        <div className="md:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600 font-semibold">Section Badge</Label>
            <Input 
              placeholder="e.g. ENTERPRISE FEATURES"
              value={sectionBadge} 
              onChange={(e) => onChange('sectionBadge', e.target.value)} 
              className="bg-slate-50 border-slate-200"
            />
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600 font-semibold">Headline</Label>
            <Input 
              placeholder="Everything Your Business Needs to Win on WhatsApp"
              value={headline} 
              onChange={(e) => onChange('headline', e.target.value)} 
              className="bg-slate-50 border-slate-200"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600 font-semibold">Description Text</Label>
            <textarea
              rows={3}
              placeholder="From AI automation to deep ecommerce integrations..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
              value={descriptionText}
              onChange={(e) => onChange('descriptionText', e.target.value)}
            />
          </div>
        </div>

        {/* Right Column: CTA Button */}
        <div className="md:col-span-4 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 border-l-4 border-l-indigo-600 h-full">
            <h4 className="text-xs font-semibold text-indigo-600 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-3 bg-indigo-600 rounded-full inline-block"></span>
              Call to Action Button
            </h4>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] text-slate-500 font-medium">Button Label</Label>
                <Input 
                  placeholder="Explore All Features"
                  value={ctaButton.label || ''} 
                  onChange={(e) => onChange('ctaButton', { ...ctaButton, label: e.target.value })} 
                  className="bg-slate-50 border-slate-200 h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] text-slate-500 font-medium">Target URL</Label>
                <Input 
                  placeholder="/signup"
                  value={ctaButton.targetUrl || ''} 
                  onChange={(e) => onChange('ctaButton', { ...ctaButton, targetUrl: e.target.value })} 
                  className="bg-slate-50 border-slate-200 h-9 text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Performance Highlights */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Key Performance Highlights</h4>
              <p className="text-[11px] text-slate-500">Add detailed features that make your platform stand out</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={addHighlight} className="gap-2 h-8 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50">
            <Plus className="w-3 h-3" /> Add Highlight
          </Button>
        </div>

        <div className="space-y-6">
          {highlights.length === 0 && (
            <div className="p-8 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-sm">
              No highlights added yet.
            </div>
          )}
          
          {highlights.map((highlight, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-6 relative group border-b border-slate-100 pb-6 last:border-0 last:pb-0">
              
              {/* Delete Button */}
              <button 
                onClick={() => removeHighlight(index)}
                className="absolute top-0 right-0 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100 z-10"
                title="Remove highlight"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Left Column: Visual Art */}
              <div className="md:col-span-3">
                <Label className="text-[11px] text-slate-500 font-medium block mb-2">Visual Art</Label>
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 flex items-center gap-3">
                  <div className="w-12 h-12 rounded border border-slate-200 bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                    {highlight.mediaUrl ? (
                      <img src={highlight.mediaUrl} alt="Feature visual" className="w-full h-full object-contain p-1" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-[11px] font-semibold text-slate-700 mb-0.5">Update Media</h5>
                    <p className="text-[9px] text-slate-400 mb-1 truncate">
                      {highlight.mediaUrl || 'No image'}
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

              {/* Right Column: Text Fields */}
              <div className="md:col-span-9 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-slate-500 font-medium">Feature Title</Label>
                  <Input 
                    placeholder="e.g. AI-Powered Chatbot Builder"
                    value={highlight.title || ''} 
                    onChange={(e) => updateHighlight(index, 'title', e.target.value)} 
                    className="bg-slate-50 border-slate-200 text-sm h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-slate-500 font-medium">Detailed Points</Label>
                  <textarea
                    rows={2}
                    placeholder="Build intelligent, multi-step WhatsApp bots..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                    value={highlight.description || ''}
                    onChange={(e) => updateHighlight(index, 'description', e.target.value)}
                  />
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
