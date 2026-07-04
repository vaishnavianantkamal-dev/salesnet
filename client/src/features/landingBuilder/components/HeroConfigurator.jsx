import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit2, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import api from '@/api/axios';
import { useToast } from '@/hooks/useToast';

export default function HeroConfigurator({ data = {}, onChange }) {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingFloating, setUploadingFloating] = useState(null); // stores index being uploaded

  const badgeText = data.badgeText || '';
  const sectionTitle = data.sectionTitle || '';
  const description = data.description || '';
  const mainImage = data.mainImage || '';
  const primaryButton = data.primaryButton || { label: '', targetUrl: '' };
  const floatingImages = data.floatingImages || [];

  const handleMainImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      setUploading(true);
      const res = await api.post('/api/landing/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onChange('mainImage', res.data.url);
      toast({ title: 'Success', description: 'Hero image uploaded' });
    } catch (error) {
      toast({ title: 'Error', description: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFloatingImageUpload = async (e, index) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      setUploadingFloating(index);
      const res = await api.post('/api/landing/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const newFloatingImages = [...floatingImages];
      newFloatingImages[index].mediaUrl = res.data.url;
      onChange('floatingImages', newFloatingImages);
      
      toast({ title: 'Success', description: 'Floating image uploaded' });
    } catch (error) {
      toast({ title: 'Error', description: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploadingFloating(null);
    }
  };

  const addFloatingImage = () => {
    onChange('floatingImages', [...floatingImages, { mediaUrl: '', screenPosition: 'Left' }]);
  };

  const removeFloatingImage = (index) => {
    const updated = [...floatingImages];
    updated.splice(index, 1);
    onChange('floatingImages', updated);
  };

  const updateFloatingImage = (index, key, value) => {
    const updated = [...floatingImages];
    updated[index][key] = value;
    onChange('floatingImages', updated);
  };

  return (
    <div className="space-y-6">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: Text Content */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600 font-semibold">Badge Text</Label>
            <Input 
              placeholder="e.g. WAPZIO - META TECH PROVIDER"
              value={badgeText} 
              onChange={(e) => onChange('badgeText', e.target.value)} 
              className="bg-slate-50 border-slate-200"
            />
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600 font-semibold">Section Title</Label>
            <textarea
              rows={2}
              placeholder="Scale Your Sales & Support on WhatsApp, Instagram & Facebook"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
              value={sectionTitle}
              onChange={(e) => onChange('sectionTitle', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600 font-semibold">Description</Label>
            <textarea
              rows={4}
              placeholder="Automate business chats, deploy natural AI Voice Call Agents..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
              value={description}
              onChange={(e) => onChange('description', e.target.value)}
            />
          </div>
        </div>

        {/* Right Column: Media and Button */}
        <div className="space-y-6">
          
          {/* Main Image Uploader */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h4 className="text-xs font-semibold text-slate-600 mb-3">Hero Main Image</h4>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {mainImage ? (
                  <img src={mainImage} alt="Main" className="w-full h-full object-contain p-1" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-300" />
                )}
              </div>
              <div className="flex-1">
                <h5 className="text-sm font-medium text-slate-800 mb-1">Update Media</h5>
                <p className="text-[10px] text-slate-500 mb-2 truncate max-w-[200px]">
                  {mainImage || 'No image uploaded'}
                </p>
                <Input 
                  type="file" 
                  accept="image/*"
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleMainImageUpload}
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="gap-2 h-7 text-xs"
                >
                  <Edit2 className="w-3 h-3" />
                  {uploading ? 'Uploading...' : 'Change Image'}
                </Button>
              </div>
            </div>
          </div>

          {/* Primary Button */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 border-l-4 border-l-indigo-600">
            <h4 className="text-xs font-semibold text-indigo-600 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-3 bg-indigo-600 rounded-full inline-block"></span>
              Primary Button
            </h4>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] text-slate-500 font-medium">Label</Label>
                <Input 
                  placeholder="Start Free Trial"
                  value={primaryButton.label} 
                  onChange={(e) => onChange('primaryButton', { ...primaryButton, label: e.target.value })} 
                  className="bg-slate-50 border-slate-200 h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] text-slate-500 font-medium">Target Link (Only last route e.g. /dashboard)</Label>
                <Input 
                  placeholder="/signup"
                  value={primaryButton.targetUrl} 
                  onChange={(e) => onChange('primaryButton', { ...primaryButton, targetUrl: e.target.value })} 
                  className="bg-slate-50 border-slate-200 h-9"
                />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Floating Decorative Images */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-indigo-50 flex items-center justify-center text-indigo-600">
              <ImageIcon className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Floating Decorative Images</h4>
              <p className="text-[11px] text-slate-500">Small UI elements to enhance landing page visual depth</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={addFloatingImage} className="gap-2 h-8 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50">
            <Plus className="w-3 h-3" /> Add Image
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {floatingImages.length === 0 && (
            <div className="col-span-1 md:col-span-2 p-8 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-sm">
              No decorative images added.
            </div>
          )}
          
          {floatingImages.map((fi, index) => (
            <div key={index} className="border border-slate-200 rounded-lg p-4 bg-slate-50 relative group">
              <button 
                onClick={() => removeFloatingImage(index)}
                className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-3 h-3" />
              </button>
              
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
                  <div className="w-12 h-12 rounded border border-slate-200 bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                    {fi.mediaUrl ? (
                      <img src={fi.mediaUrl} alt="Floating" className="w-full h-full object-contain p-1" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h5 className="text-xs font-semibold text-slate-800 mb-1">Update Media</h5>
                    <p className="text-[9px] text-slate-500 mb-2 truncate max-w-[120px]">
                      {fi.mediaUrl || 'No image'}
                    </p>
                    <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-md text-[10px] font-medium transition-colors focus-visible:outline-none border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 h-6 px-2 w-auto">
                      <Edit2 className="w-2.5 h-2.5" />
                      {uploadingFloating === index ? '...' : 'Change'}
                      <input 
                        type="file" 
                        accept="image/*"
                        className="hidden" 
                        onChange={(e) => handleFloatingImageUpload(e, index)}
                      />
                    </label>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-slate-500 font-medium">Screen Position</Label>
                  <select 
                    className="flex h-8 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                    value={fi.screenPosition}
                    onChange={(e) => updateFloatingImage(index, 'screenPosition', e.target.value)}
                  >
                    <option value="Left">Left</option>
                    <option value="Right">Right</option>
                    <option value="Center">Center</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
