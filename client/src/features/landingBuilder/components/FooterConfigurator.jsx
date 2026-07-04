import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Layout, Twitter, Facebook, Linkedin, Instagram, ShieldCheck, Share2 } from 'lucide-react';

export default function FooterConfigurator({ data = {}, onChange }) {
  const preFooterCtaTitle = data.preFooterCtaTitle || '';
  const ctaSupportingDescription = data.ctaSupportingDescription || '';
  const globalActionButtons = data.globalActionButtons || [];
  const socialLinks = data.socialLinks || [];
  const copyrightDisclaimer = data.copyrightDisclaimer || '';

  const addActionButton = () => {
    onChange('globalActionButtons', [...globalActionButtons, { label: '', targetUrl: '' }]);
  };

  const removeActionButton = (index) => {
    const newBtns = [...globalActionButtons];
    newBtns.splice(index, 1);
    onChange('globalActionButtons', newBtns);
  };

  const updateActionButton = (index, key, value) => {
    const newBtns = [...globalActionButtons];
    newBtns[index][key] = value;
    onChange('globalActionButtons', newBtns);
  };

  const getSocialUrl = (platform) => {
    const link = socialLinks.find(s => s.platform === platform);
    return link ? link.url : '';
  };

  const updateSocialUrl = (platform, url) => {
    let newLinks = [...socialLinks];
    const existingIndex = newLinks.findIndex(s => s.platform === platform);
    if (existingIndex >= 0) {
      newLinks[existingIndex].url = url;
    } else {
      newLinks.push({ platform, url, icon: platform.toLowerCase() });
    }
    onChange('socialLinks', newLinks);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600 font-semibold block">Pre-footer CTA Title</Label>
            <Input 
              placeholder="e.g. Start Growing Your Business Today"
              value={preFooterCtaTitle} 
              onChange={(e) => onChange('preFooterCtaTitle', e.target.value)} 
              className="bg-slate-50 border-slate-200"
            />
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600 font-semibold block">CTA Supporting Description</Label>
            <textarea
              placeholder="Join thousands of businesses using our platform..."
              className="w-full h-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none text-slate-600"
              value={ctaSupportingDescription}
              onChange={(e) => onChange('ctaSupportingDescription', e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative overflow-hidden flex flex-col">
          <Layout className="absolute -right-6 -bottom-6 w-32 h-32 text-slate-50 opacity-50 pointer-events-none" />
          
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-indigo-600 rounded-full"></div>
              <h4 className="text-sm font-semibold text-slate-800">Global Action Buttons</h4>
            </div>
            <Button onClick={addActionButton} size="sm" variant="ghost" className="h-6 px-2 text-xs text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700">
              <Plus className="w-3 h-3 mr-1" /> New Button
            </Button>
          </div>

          <div className="space-y-3 relative z-10 flex-1">
            {globalActionButtons.length === 0 ? (
              <div className="text-xs text-slate-400 italic">No action buttons added.</div>
            ) : (
              globalActionButtons.map((btn, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input 
                    placeholder="Label (e.g. Start Free Trial)"
                    value={btn.label} 
                    onChange={(e) => updateActionButton(i, 'label', e.target.value)} 
                    className="bg-white border-slate-200 text-xs h-9 flex-[2]"
                  />
                  <Input 
                    placeholder="URL (e.g. /signup)"
                    value={btn.targetUrl} 
                    onChange={(e) => updateActionButton(i, 'targetUrl', e.target.value)} 
                    className="bg-white border-slate-200 text-xs h-9 flex-[3]"
                  />
                  <button 
                    onClick={() => removeActionButton(i)}
                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Social Architecture */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Share2 className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800">Social Architecture</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
              <div className="w-7 h-7 flex items-center justify-center text-blue-400 bg-blue-50 rounded">
                <Twitter className="w-3.5 h-3.5" />
              </div>
              <input 
                type="text"
                placeholder="https://twitter.com/..."
                value={getSocialUrl('Twitter')}
                onChange={(e) => updateSocialUrl('Twitter', e.target.value)}
                className="bg-transparent border-none focus:outline-none text-xs w-full text-slate-600"
              />
            </div>
            
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
              <div className="w-7 h-7 flex items-center justify-center text-blue-600 bg-blue-50 rounded">
                <Facebook className="w-3.5 h-3.5" />
              </div>
              <input 
                type="text"
                placeholder="https://facebook.com/..."
                value={getSocialUrl('Facebook')}
                onChange={(e) => updateSocialUrl('Facebook', e.target.value)}
                className="bg-transparent border-none focus:outline-none text-xs w-full text-slate-600"
              />
            </div>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
              <div className="w-7 h-7 flex items-center justify-center text-blue-700 bg-blue-50 rounded">
                <Linkedin className="w-3.5 h-3.5" />
              </div>
              <input 
                type="text"
                placeholder="https://linkedin.com/company/..."
                value={getSocialUrl('LinkedIn')}
                onChange={(e) => updateSocialUrl('LinkedIn', e.target.value)}
                className="bg-transparent border-none focus:outline-none text-xs w-full text-slate-600"
              />
            </div>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
              <div className="w-7 h-7 flex items-center justify-center text-pink-600 bg-pink-50 rounded">
                <Instagram className="w-3.5 h-3.5" />
              </div>
              <input 
                type="text"
                placeholder="https://instagram.com/..."
                value={getSocialUrl('Instagram')}
                onChange={(e) => updateSocialUrl('Instagram', e.target.value)}
                className="bg-transparent border-none focus:outline-none text-xs w-full text-slate-600"
              />
            </div>
          </div>
        </div>

        {/* Legal Signature */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center text-indigo-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800">Legal Signature</h4>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] text-slate-500 font-semibold block">Copyright Disclaimer</Label>
            <Input 
              placeholder="e.g. © 2026 YourCompany. All rights reserved."
              value={copyrightDisclaimer} 
              onChange={(e) => onChange('copyrightDisclaimer', e.target.value)} 
              className="bg-slate-50 border-slate-200 text-sm h-11"
            />
          </div>
        </div>
        
      </div>
    </div>
  );
}
