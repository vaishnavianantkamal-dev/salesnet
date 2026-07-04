import { useState, useEffect } from 'react';
import api from '@/api/axios';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, LayoutTemplate } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import HeaderConfigurator from '../components/HeaderConfigurator';
import HeroConfigurator from '../components/HeroConfigurator';
import BrandingConfigurator from '../components/BrandingConfigurator';
import FeaturesConfigurator from '../components/FeaturesConfigurator';
import PlatformConfigurator from '../components/PlatformConfigurator';
import PricingConfigurator from '../components/PricingConfigurator';
import TestimonialConfigurator from '../components/TestimonialConfigurator';
import FaqConfigurator from '../components/FaqConfigurator';
import ContactConfigurator from '../components/ContactConfigurator';
import FooterConfigurator from '../components/FooterConfigurator';

export default function ManageLandingPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('header');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/landing');
      setConfig(res.data.data);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load landing page config',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/api/landing', config);
      toast({
        title: 'Success',
        description: 'Landing page updated successfully!',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update landing page',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (section, key, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const tabs = [
    { id: 'header', label: 'Header', desc: 'Header & mega menu' },
    { id: 'hero', label: 'Hero', desc: 'Main landing header' },
    { id: 'branding', label: 'Branding', desc: 'Trust logos & label' },
    { id: 'features', label: 'Features', desc: 'Highlight key values' },
    { id: 'platform', label: 'Platform', desc: 'Showcase platform features' },
    { id: 'pricing', label: 'Pricing', desc: 'Subscription plans' },
    { id: 'testimonials', label: 'Testimonials', desc: 'Customer feedback' },
    { id: 'faq', label: 'FAQ', desc: 'Common questions' },
    { id: 'contact', label: 'Contact', desc: 'Get in touch info' },
    { id: 'footer', label: 'Footer', desc: 'Social links & legal' }
  ];

  if (loading) return <div className="p-8 text-center">Loading builder...</div>;
  if (!config) return null;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-800">
      
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col p-4 shadow-sm z-10 overflow-y-auto">
        <h2 className="font-bold text-lg text-indigo-600 mb-1">Manage Landing</h2>
        <p className="text-xs text-slate-500 mb-6">Fine-tune your public interface and landing page aesthetics in real-time</p>
        
        <div className="space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full text-left px-4 py-3 rounded-xl transition-all duration-200",
                activeTab === tab.id 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" 
                  : "hover:bg-slate-100 text-slate-600"
              )}
            >
              <div className="font-medium text-sm">{tab.label}</div>
              <div className={cn("text-[10px]", activeTab === tab.id ? "text-indigo-100" : "text-slate-400")}>
                {tab.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-slate-50/50">
        
        {/* Topbar */}
        <div className="bg-white m-4 p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              {tabs.find(t => t.id === activeTab)?.label} Configuration
            </h3>
            <p className="text-xs text-slate-500 ml-4">{tabs.find(t => t.id === activeTab)?.desc}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600">Disabled Landing Page</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={config.isDisabled}
                  onChange={(e) => setConfig({...config, isDisabled: e.target.checked})}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            
            <Button variant="outline" size="sm" onClick={fetchConfig} disabled={loading} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              <CheckCircle className="w-4 h-4" /> Publish
            </Button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto px-4 pb-8">
          
          {activeTab === 'header' ? (
            <div className="max-w-7xl mx-auto">
              <HeaderConfigurator 
                data={config.header || {}} 
                onChange={(key, value) => updateConfig('header', key, value)} 
              />
            </div>
          ) : activeTab === 'hero' ? (
            <div className="max-w-7xl mx-auto">
              <HeroConfigurator 
                data={config.hero || {}} 
                onChange={(key, value) => updateConfig('hero', key, value)} 
              />
            </div>
          ) : activeTab === 'branding' ? (
            <div className="max-w-7xl mx-auto">
              <BrandingConfigurator 
                data={config.branding || {}} 
                onChange={(key, value) => updateConfig('branding', key, value)} 
              />
            </div>
          ) : activeTab === 'features' ? (
            <div className="max-w-7xl mx-auto">
              <FeaturesConfigurator 
                data={config.features || {}} 
                onChange={(key, value) => updateConfig('features', key, value)} 
              />
            </div>
          ) : activeTab === 'platform' ? (
            <div className="max-w-7xl mx-auto">
              <PlatformConfigurator 
                data={config.platform || {}} 
                onChange={(key, value) => updateConfig('platform', key, value)} 
              />
            </div>
          ) : activeTab === 'pricing' ? (
            <div className="max-w-7xl mx-auto">
              <PricingConfigurator 
                data={config.pricing || {}} 
                onChange={(key, value) => updateConfig('pricing', key, value)} 
              />
            </div>
          ) : activeTab === 'testimonials' ? (
            <div className="max-w-7xl mx-auto">
              <TestimonialConfigurator 
                data={config.testimonials || {}} 
                onChange={(key, value) => updateConfig('testimonials', key, value)} 
              />
            </div>
          ) : activeTab === 'faq' ? (
            <div className="max-w-7xl mx-auto">
              <FaqConfigurator 
                data={config.faq || {}} 
                onChange={(key, value) => updateConfig('faq', key, value)} 
              />
            </div>
          ) : activeTab === 'contact' ? (
            <div className="max-w-7xl mx-auto">
              <ContactConfigurator 
                data={config.contact || {}} 
                onChange={(key, value) => updateConfig('contact', key, value)} 
              />
            </div>
          ) : activeTab === 'footer' ? (
            <div className="max-w-7xl mx-auto">
              <FooterConfigurator 
                data={config.footer || {}} 
                onChange={(key, value) => updateConfig('footer', key, value)} 
              />
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-4xl mx-auto">
            </div>
          )}


        </div>
      </div>
    </div>
  );
}
