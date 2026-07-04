import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Link2, 
  Folder, 
  Image as ImageIcon,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/api/axios';
import { useToast } from '@/hooks/useToast';

export default function HeaderConfigurator({ data = {}, onChange }) {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  
  // Local state for the currently selected menu item ID being edited
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [uploading, setUploading] = useState(false);

  const brandLogo = data.brandLogo || '';
  const menuItems = data.menuItems || [];

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      setUploading(true);
      const res = await api.post('/api/landing/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onChange('brandLogo', res.data.url);
      toast({ title: 'Success', description: 'Logo uploaded successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to upload logo', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const generateObjectId = () => {
    const timestamp = Math.floor(new Date().getTime() / 1000).toString(16);
    const randomHex = 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, () => Math.floor(Math.random() * 16).toString(16));
    return timestamp + randomHex;
  };

  const handleAddMenuItem = () => {
    const newItem = {
      _id: generateObjectId(),
      title: 'New Menu Item',
      linkType: 'link',
      path: '/',
      description: '',
      icon: '',
      badgeText: '',
      badgeColor: '',
      targetBlank: false,
      status: true,
      parentId: null
    };
    onChange('menuItems', [...menuItems, newItem]);
    setSelectedItemId(newItem._id);
  };

  const handleDeleteMenuItem = (id, e) => {
    e.stopPropagation();
    // Also delete any children of this item
    const updated = menuItems.filter(item => item._id !== id && item.parentId !== id);
    onChange('menuItems', updated);
    if (selectedItemId === id) setSelectedItemId(null);
  };

  const handleMove = (id, direction, e) => {
    e.stopPropagation();
    const itemToMove = menuItems.find(item => item._id === id);
    if (!itemToMove) return;

    // Get siblings (items with the same parent)
    const siblings = menuItems.filter(item => item.parentId === itemToMove.parentId);
    const currentIndex = siblings.findIndex(item => item._id === id);
    
    if (direction === 'up' && currentIndex > 0) {
      const prevSibling = siblings[currentIndex - 1];
      const newItems = [...menuItems];
      const moveIdx = newItems.findIndex(i => i._id === id);
      const prevIdx = newItems.findIndex(i => i._id === prevSibling._id);
      
      const temp = newItems[moveIdx];
      newItems[moveIdx] = newItems[prevIdx];
      newItems[prevIdx] = temp;
      
      onChange('menuItems', newItems);
    } else if (direction === 'down' && currentIndex < siblings.length - 1) {
      const nextSibling = siblings[currentIndex + 1];
      const newItems = [...menuItems];
      const moveIdx = newItems.findIndex(i => i._id === id);
      const nextIdx = newItems.findIndex(i => i._id === nextSibling._id);
      
      const temp = newItems[moveIdx];
      newItems[moveIdx] = newItems[nextIdx];
      newItems[nextIdx] = temp;
      
      onChange('menuItems', newItems);
    }
  };

  const updateSelectedItem = (key, value) => {
    if (!selectedItemId) return;
    const updated = menuItems.map(item => 
      item._id === selectedItemId ? { ...item, [key]: value } : item
    );
    onChange('menuItems', updated);
  };

  const selectedItem = menuItems.find(item => item._id === selectedItemId);

  // Group items by parent
  const rootItems = menuItems.filter(item => !item.parentId);
  const getChildren = (parentId) => menuItems.filter(item => item.parentId === parentId);

  return (
    <div className="space-y-8">
      {/* Brand Logo Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h4 className="text-sm font-semibold text-slate-800 mb-4">Header Brand Logo</h4>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {brandLogo ? (
              <img src={brandLogo} alt="Logo" className="w-full h-full object-contain p-2" />
            ) : (
              <ImageIcon className="w-8 h-8 text-slate-300" />
            )}
          </div>
          <div className="flex-1">
            <h5 className="font-medium text-slate-800 mb-1">Update Media</h5>
            <p className="text-xs text-slate-500 mb-3 truncate max-w-sm">
              {brandLogo || 'No logo uploaded'}
            </p>
            <Input 
              type="file" 
              accept="image/*"
              className="hidden" 
              ref={fileInputRef}
              onChange={handleLogoUpload}
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="gap-2"
            >
              <Edit2 className="w-3 h-3" />
              {uploading ? 'Uploading...' : 'Change Logo'}
            </Button>
          </div>
        </div>
      </div>

      {/* Menu Builder Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column: Menu Tree */}
        <div className="md:col-span-5 space-y-4 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Menu Tree Navigation</h4>
              <p className="text-xs text-slate-500">Organize and sort website structure</p>
            </div>
            <Button size="sm" onClick={handleAddMenuItem} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 h-8 text-xs px-3">
              <Plus className="w-3 h-3" /> Add Menu Item
            </Button>
          </div>
          
          <div className="relative">
            <Input placeholder="Search items..." className="bg-slate-50 border-slate-200 text-sm h-9" />
          </div>

          <div className="mt-4 space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {rootItems.length === 0 && (
              <div className="text-center p-6 border border-dashed rounded-lg border-slate-200 text-slate-400 text-sm">
                No menu items yet. Click Add Menu Item.
              </div>
            )}
            {rootItems.map(root => (
              <div key={root._id} className="space-y-2">
                <div 
                  onClick={() => setSelectedItemId(root._id)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-lg border cursor-pointer transition-colors group",
                    selectedItemId === root._id 
                      ? "border-indigo-500 bg-indigo-50 shadow-sm" 
                      : "border-slate-200 bg-white hover:border-indigo-300"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {root.linkType === 'dropdown' ? (
                      <Folder className={cn("w-4 h-4", selectedItemId === root._id ? "text-indigo-600" : "text-amber-500")} />
                    ) : (
                      <Link2 className={cn("w-4 h-4", selectedItemId === root._id ? "text-indigo-600" : "text-blue-500")} />
                    )}
                    <span className={cn("text-sm font-medium", selectedItemId === root._id ? "text-indigo-700" : "text-slate-700")}>
                      {root.title}
                    </span>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 flex items-center transition-opacity">
                    <button onClick={(e) => handleMove(root._id, 'up', e)} className="p-1 text-slate-400 hover:text-indigo-500">
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => handleMove(root._id, 'down', e)} className="p-1 text-slate-400 hover:text-indigo-500">
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => handleDeleteMenuItem(root._id, e)}
                      className="p-1 text-slate-400 hover:text-red-500 ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Render Children */}
                {getChildren(root._id).length > 0 && (
                  <div className="pl-6 space-y-2 border-l-2 border-slate-100 ml-3">
                    {getChildren(root._id).map(child => (
                      <div 
                        key={child._id}
                        onClick={() => setSelectedItemId(child._id)}
                        className={cn(
                          "flex items-center justify-between px-3 py-2 rounded-lg border cursor-pointer transition-colors group",
                          selectedItemId === child._id 
                            ? "border-indigo-500 bg-indigo-50 shadow-sm" 
                            : "border-slate-200 bg-white hover:border-indigo-300"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Link2 className={cn("w-3.5 h-3.5", selectedItemId === child._id ? "text-indigo-600" : "text-blue-500")} />
                          <span className={cn("text-xs font-medium", selectedItemId === child._id ? "text-indigo-700" : "text-slate-600")}>
                            {child.title}
                          </span>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 flex items-center transition-opacity">
                          <button onClick={(e) => handleMove(child._id, 'up', e)} className="p-1 text-slate-400 hover:text-indigo-500">
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={(e) => handleMove(child._id, 'down', e)} className="p-1 text-slate-400 hover:text-indigo-500">
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={(e) => handleDeleteMenuItem(child._id, e)}
                            className="p-1 text-slate-400 hover:text-red-500 ml-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Edit Menu Settings */}
        <div className="md:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-slate-800">Edit Menu Settings</h4>
            <p className="text-xs text-slate-500">Customize routes and badge flags</p>
          </div>

          {!selectedItem ? (
            <div className="h-40 flex items-center justify-center border border-dashed border-slate-200 rounded-lg text-slate-400 text-sm">
              Select a menu item from the tree to edit its settings
            </div>
          ) : (
            <div className="space-y-5">
              
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600 font-semibold">Title</Label>
                <Input 
                  value={selectedItem.title} 
                  onChange={(e) => updateSelectedItem('title', e.target.value)} 
                  className="bg-slate-50 border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-600 font-semibold">Link Type</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedItem.linkType}
                    onChange={(e) => updateSelectedItem('linkType', e.target.value)}
                  >
                    <option value="link">Link (Clickable link)</option>
                    <option value="dropdown">Dropdown (Menu container)</option>
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-600 font-semibold">Select Parent</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedItem.parentId || ''}
                    onChange={(e) => updateSelectedItem('parentId', e.target.value || null)}
                  >
                    <option value="">None (Root level)</option>
                    {rootItems.filter(r => r._id !== selectedItem._id && r.linkType === 'dropdown').map(r => (
                      <option key={r._id} value={r._id}>{r.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <h5 className="text-sm font-semibold text-slate-800">Target Blank</h5>
                  <p className="text-xs text-slate-500">Open page in a new browser tab</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={selectedItem.targetBlank}
                    onChange={(e) => updateSelectedItem('targetBlank', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs text-slate-600 font-semibold">Set Page Link</Label>
                  <select className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500">
                    <option value="custom">Custom Link URL</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-600 font-semibold flex items-center gap-1">
                    Path <span className="w-3 h-3 rounded-full border border-slate-300 inline-flex items-center justify-center text-[8px] text-slate-400">?</span>
                  </Label>
                  <Input 
                    value={selectedItem.path} 
                    onChange={(e) => updateSelectedItem('path', e.target.value)} 
                    className="bg-slate-50 border-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600 font-semibold">Link Description</Label>
                <Input 
                  placeholder="e.g. Omnichannel chat screen for support"
                  value={selectedItem.description || ''} 
                  onChange={(e) => updateSelectedItem('description', e.target.value)} 
                  className="bg-slate-50 border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-600 font-semibold">Badge Text</Label>
                  <Input 
                    placeholder="Enter Badge Text (e.g. Sale, New)"
                    value={selectedItem.badgeText || ''} 
                    onChange={(e) => updateSelectedItem('badgeText', e.target.value)} 
                    className="bg-slate-50 border-slate-200 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-600 font-semibold">Badge Color</Label>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded border border-slate-200 bg-slate-100 flex-shrink-0" style={{ backgroundColor: selectedItem.badgeColor || '#e2e8f0' }} />
                    <Input 
                      placeholder="Color (e.g. red, #10b981)"
                      value={selectedItem.badgeColor || ''} 
                      onChange={(e) => updateSelectedItem('badgeColor', e.target.value)} 
                      className="bg-slate-50 border-slate-200 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <h5 className="text-sm font-semibold text-slate-800">Status</h5>
                  <p className="text-[11px] text-slate-500">Toggle whether this menu item is visible on site</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={selectedItem.status}
                    onChange={(e) => updateSelectedItem('status', e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
