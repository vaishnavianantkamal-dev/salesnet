import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, X, Tag, ChevronDown, Search, Check } from 'lucide-react';
import api from '@/api/axios';

export default function PricingConfigurator({ data = {}, onChange }) {
  const [availablePlans, setAvailablePlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const sectionBadge = data.sectionBadge || '';
  const sectionTitle = data.sectionTitle || '';
  const briefDescription = data.briefDescription || '';
  const selectedPlans = data.selectedPlans || []; // array of IDs

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get('/api/products');
        const productsArray = res.data?.data?.products || res.data?.products || [];
        setAvailablePlans(Array.isArray(productsArray) ? productsArray : []);
      } catch (error) {
        console.error('Failed to fetch plans', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const togglePlanSelection = (planId) => {
    if (selectedPlans.includes(planId)) {
      onChange('selectedPlans', selectedPlans.filter(id => id !== planId));
    } else {
      onChange('selectedPlans', [...selectedPlans, planId]);
    }
  };

  const filteredPlans = availablePlans.filter(plan => 
    plan.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRemovePlan = (planId) => {
    onChange('selectedPlans', selectedPlans.filter(id => id !== planId));
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
                placeholder="e.g. PRICING"
                value={sectionBadge} 
                onChange={(e) => onChange('sectionBadge', e.target.value)} 
                className="bg-slate-50 border-slate-200"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600 font-semibold">Section Title</Label>
              <Input 
                placeholder="Plans Built for Every Business"
                value={sectionTitle} 
                onChange={(e) => onChange('sectionTitle', e.target.value)} 
                className="bg-slate-50 border-slate-200"
              />
            </div>
          </div>

          <div className="space-y-1.5 h-full">
            <Label className="text-xs text-slate-600 font-semibold">Brief Description</Label>
            <textarea
              placeholder="Simple, transparent pricing with no hidden fees..."
              className="w-full h-[calc(100%-24px)] min-h-[100px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
              value={briefDescription}
              onChange={(e) => onChange('briefDescription', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Plan Catalog Integration */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center text-indigo-600">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800">Plan Catalog Integration</h4>
            <p className="text-[11px] text-slate-500">Select the specific plans you want to expose on your landing page</p>
          </div>
        </div>

        <div className="space-y-4 max-w-xl">
          <div className="relative">
            <div 
              onClick={() => !loading && setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-between w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 cursor-pointer hover:border-indigo-300 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium">
                  {loading ? 'Loading plans...' : `${selectedPlans.length} plans selected for display`}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search catalog..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-sm outline-none placeholder:text-slate-400"
                    autoFocus
                  />
                </div>
                <div className="max-h-60 overflow-y-auto p-1">
                  {filteredPlans.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">No plans found.</div>
                  ) : (
                    filteredPlans.map(plan => {
                      const isSelected = selectedPlans.includes(plan._id);
                      return (
                        <div 
                          key={plan._id}
                          onClick={() => togglePlanSelection(plan._id)}
                          className={`flex items-center justify-between p-3 rounded-md cursor-pointer mb-1 last:mb-0 transition-colors ${isSelected ? 'bg-indigo-50/50 hover:bg-indigo-50' : 'hover:bg-slate-50'}`}
                        >
                          <div>
                            <div className={`text-sm font-semibold ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                              {plan.name}
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                              INR {plan.price} billed {plan.billingCycle || 'yearly'}
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {selectedPlans.map(planId => {
              const plan = availablePlans.find(p => p._id === planId);
              return (
                <div key={planId} className="flex items-center gap-3 py-1.5 pl-3 pr-1.5 rounded-lg border border-slate-200 bg-white shadow-sm w-fit">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold text-slate-800 leading-tight">{plan ? plan.name : 'Unknown Plan'}</span>
                    <span className="text-[9px] text-slate-500 font-medium">{plan ? `₹${plan.price}` : '---'}</span>
                  </div>
                  <button 
                    onClick={() => handleRemovePlan(planId)}
                    className="w-6 h-6 rounded flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
          
          {selectedPlans.length === 0 && !loading && (
            <p className="text-[11px] text-slate-400 italic">No plans selected to display.</p>
          )}
        </div>
      </div>

    </div>
  );
}
