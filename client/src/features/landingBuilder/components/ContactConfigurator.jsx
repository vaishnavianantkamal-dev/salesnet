import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneCall, MessageSquare, Phone } from 'lucide-react';

export default function ContactConfigurator({ data = {}, onChange }) {
  const sectionTitle = data.sectionTitle || '';
  const supportTagline = data.supportTagline || '';
  const narrative = data.narrative || '';
  const businessPhone = data.businessPhone || '';
  const corporateEmail = data.corporateEmail || '';
  const interactiveForm = data.interactiveForm !== undefined ? data.interactiveForm : true;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Text Content */}
        <div className="space-y-6">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600 font-semibold">Section Title</Label>
            <Input 
              placeholder="e.g. Get in Touch With Us"
              value={sectionTitle} 
              onChange={(e) => onChange('sectionTitle', e.target.value)} 
              className="bg-slate-50 border-slate-200"
            />
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600 font-semibold">Support Tagline</Label>
            <Input 
              placeholder="e.g. Our team is ready to help you get the most out of Wapi"
              value={supportTagline} 
              onChange={(e) => onChange('supportTagline', e.target.value)} 
              className="bg-slate-50 border-slate-200"
            />
          </div>

          <div className="space-y-1.5 h-48">
            <Label className="text-xs text-slate-600 font-semibold block">Narrative (Optional)</Label>
            <textarea
              placeholder="Provide some additional context for your visitors..."
              className="w-full h-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none text-slate-600"
              value={narrative}
              onChange={(e) => onChange('narrative', e.target.value)}
            />
          </div>
        </div>

        {/* Right Column: Contact Cards */}
        <div className="space-y-6 flex flex-col pt-1">
          
          <div className="bg-white border border-slate-200 rounded-xl p-5 relative overflow-hidden shadow-sm flex-1 flex flex-col justify-center">
            {/* Background Icon */}
            <PhoneCall className="absolute -right-6 -bottom-6 w-40 h-40 text-slate-50 opacity-50 pointer-events-none" />
            
            <div className="relative z-10 space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 bg-indigo-600 rounded-full"></div>
                <h4 className="text-sm font-semibold text-slate-800">Direct Contact Points</h4>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 mb-1">
                  <Phone className="w-3 h-3" /> Business Phone
                </Label>
                <Input 
                  placeholder="+1 800 123 4567"
                  value={businessPhone} 
                  onChange={(e) => onChange('businessPhone', e.target.value)} 
                  className="bg-white border-slate-200 text-sm h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 mb-1">
                  <MessageSquare className="w-3 h-3" /> Corporate Email
                </Label>
                <Input 
                  placeholder="support@company.com"
                  value={corporateEmail} 
                  onChange={(e) => onChange('corporateEmail', e.target.value)} 
                  className="bg-white border-slate-200 text-sm h-10"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center text-indigo-600">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-800">Interactive Form</h4>
                <p className="text-[11px] text-slate-500">Allow visitors to send messages</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={interactiveForm}
                onChange={(e) => onChange('interactiveForm', e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

        </div>

      </div>
    </div>
  );
}
