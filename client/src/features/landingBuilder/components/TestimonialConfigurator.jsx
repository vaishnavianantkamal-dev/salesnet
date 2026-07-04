import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageSquareQuote, Search, Check, Tag, ChevronDown, X } from 'lucide-react';
import api from '@/api/axios';

export default function TestimonialConfigurator({ data = {}, onChange }) {
  const [availableTestimonials, setAvailableTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const sectionBadge = data.sectionBadge || '';
  const headline = data.headline || '';
  const selectedTestimonials = data.selectedTestimonials || []; // array of IDs

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const res = await api.get('/api/testimonials');
        const dataArray = res.data?.data?.testimonials || res.data?.testimonials || res.data?.data || [];
        setAvailableTestimonials(Array.isArray(dataArray) ? dataArray : []);
      } catch (error) {
        console.log('Testimonials API might not exist yet, defaulting to empty list');
        setAvailableTestimonials([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTestimonials();
  }, []);

  const toggleSelection = (id) => {
    if (selectedTestimonials.includes(id)) {
      onChange('selectedTestimonials', selectedTestimonials.filter(tid => tid !== id));
    } else {
      onChange('selectedTestimonials', [...selectedTestimonials, id]);
    }
  };

  const removeSelection = (id) => {
    onChange('selectedTestimonials', selectedTestimonials.filter(tid => tid !== id));
  };

  const filteredTestimonials = availableTestimonials.filter(t => 
    t.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Top Configuration */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600 font-semibold">Section Badge</Label>
              <Input 
                placeholder="e.g. TRUSTED PLATFORM"
                value={sectionBadge} 
                onChange={(e) => onChange('sectionBadge', e.target.value)} 
                className="bg-slate-50 border-slate-200"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600 font-semibold">Headline</Label>
              <Input 
                placeholder="Loved by Scaling Teams Worldwide"
                value={headline} 
                onChange={(e) => onChange('headline', e.target.value)} 
                className="bg-slate-50 border-slate-200"
              />
            </div>
          </div>

          <div className="hidden md:flex flex-col items-center justify-center p-6 border-l border-slate-100 h-full relative">
            <MessageSquareQuote className="absolute right-6 top-6 w-24 h-24 text-slate-50 rotate-6" />
            <p className="text-[11px] text-slate-400 text-center leading-relaxed max-w-sm relative z-10">
              Build trust by showcasing authentic feedback from your power users. Select the most impactful testimonials from your library.
            </p>
          </div>
        </div>
      </div>

      {/* Testimonial Curation */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center text-indigo-600">
            <MessageSquareQuote className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800">Testimonial Curation</h4>
            <p className="text-[11px] text-slate-500">Search and pin customer feedback to the public wall</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          <div className="md:col-span-5 relative">
            <div 
              onClick={() => !loading && setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-between w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 cursor-pointer hover:border-indigo-300 transition-colors mb-2"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium text-slate-500">
                  {loading ? 'Loading...' : 'Find testimonials...'}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>

            {isDropdownOpen && (
              <div className="absolute top-12 left-0 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 bg-slate-50">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search by name or company..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs outline-none bg-transparent placeholder:text-slate-400"
                    autoFocus
                  />
                </div>
                <div className="max-h-60 overflow-y-auto p-1">
                  {filteredTestimonials.length === 0 ? (
                    <div className="p-6 text-center text-[10px] text-slate-400 italic">No records found matching your query.</div>
                  ) : (
                    filteredTestimonials.map(t => {
                      const isSelected = selectedTestimonials.includes(t._id);
                      return (
                        <div 
                          key={t._id}
                          onClick={() => toggleSelection(t._id)}
                          className={`flex items-center justify-between p-3 rounded-md cursor-pointer mb-1 last:mb-0 transition-colors ${isSelected ? 'bg-indigo-50/50 hover:bg-indigo-50' : 'hover:bg-slate-50'}`}
                        >
                          <div>
                            <div className={`text-[11px] font-semibold ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                              {t.name}
                            </div>
                            <div className="text-[9px] text-slate-500 font-medium mt-0.5">
                              {t.company}
                            </div>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-7">
            {selectedTestimonials.length === 0 ? (
              <div className="border border-dashed border-slate-200 rounded-xl h-48 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50">
                <MessageSquareQuote className="w-8 h-8 text-slate-200 mb-3" />
                <h5 className="text-xs font-semibold text-slate-600 mb-1">Your social proof wall is currently empty</h5>
                <p className="text-[10px] text-slate-400">Add some customer testimonials to start building credibility</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedTestimonials.map(id => {
                  const t = availableTestimonials.find(x => x._id === id);
                  return (
                    <div key={id} className="relative p-4 rounded-lg border border-slate-200 bg-white shadow-sm group">
                      <button 
                        onClick={() => removeSelection(id)}
                        className="absolute top-2 right-2 w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <h6 className="text-[11px] font-semibold text-slate-800">{t ? t.name : 'Unknown User'}</h6>
                      <p className="text-[9px] text-slate-500 mb-2">{t ? t.company : 'Unknown Company'}</p>
                      <p className="text-[10px] text-slate-600 line-clamp-2 italic">"{t ? t.content : '...'}"</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
