import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import api from '@/api/axios';
import { useToast } from '@/hooks/useToast';

export default function BrandingConfigurator({ data = {}, onChange }) {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const trustedLabelText = data.trustedLabelText || '';
  const brandLogos = data.brandLogos || [];

  const handleLogoUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    
    try {
      // Allow multiple uploads if they selected multiple, but process one by one or all together
      const newLogos = [...brandLogos];
      
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('image', files[i]);

        const res = await api.post('/api/landing/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        newLogos.push(res.data.url);
      }
      
      onChange('brandLogos', newLogos);
      toast({ title: 'Success', description: 'Brand logos added' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to upload logo', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeLogo = (index) => {
    const updated = [...brandLogos];
    updated.splice(index, 1);
    onChange('brandLogos', updated);
  };

  return (
    <div className="space-y-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      
      <div className="space-y-1.5 max-w-2xl">
        <Label className="text-xs text-slate-600 font-semibold">Trusted Label Text</Label>
        <Input 
          placeholder="Trusted by 5,000+ Teams Worldwide"
          value={trustedLabelText} 
          onChange={(e) => onChange('trustedLabelText', e.target.value)} 
          className="bg-slate-50 border-slate-200"
        />
        <p className="text-[11px] text-slate-400 mt-1">This appears above the brand logos strip on the landing page.</p>
      </div>

      <div className="pt-6 mt-6 border-t border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Brand Logos</h4>
              <p className="text-[11px] text-slate-500">Upload partner or client logos. Displayed as grayscale in the hero trust strip.</p>
            </div>
          </div>
          
          <Input 
            type="file" 
            accept="image/*"
            multiple
            className="hidden" 
            ref={fileInputRef}
            onChange={handleLogoUpload}
          />
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="gap-2 h-8 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50"
          >
            <Plus className="w-3 h-3" /> {uploading ? 'Uploading...' : 'Add Logo'}
          </Button>
        </div>

        {brandLogos.length === 0 ? (
          <div 
            onClick={() => !uploading && fileInputRef.current?.click()}
            className="border border-dashed border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-colors group"
          >
            <Building2 className="w-8 h-8 text-slate-200 mb-3 group-hover:text-indigo-300 transition-colors" />
            <p className="text-xs text-slate-400 mb-1">No brand logos added yet</p>
            <p className="text-xs font-medium text-indigo-600">Click to add your first logo</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {brandLogos.map((logoUrl, index) => (
              <div key={index} className="group relative border border-slate-200 rounded-lg p-4 bg-slate-50 flex items-center justify-center h-24 hover:border-indigo-300 transition-colors">
                <button 
                  onClick={() => removeLogo(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10"
                  title="Remove Logo"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
                <img 
                  src={logoUrl} 
                  alt={`Brand Logo ${index + 1}`} 
                  className="max-w-full max-h-full object-contain grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all" 
                />
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
