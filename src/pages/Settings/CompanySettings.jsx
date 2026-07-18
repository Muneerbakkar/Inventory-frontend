import { PageHeader } from '../../components/ui/PageHeader';
import { useState, useEffect } from 'react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import {  Edit , Building2 } from 'lucide-react';

export const CompanySettings = () => {
  const [settings, setSettings] = useState({
    name: '',
    address: '',
    gstin: '',
    pan: '',
    invoicePrefix: 'INV-',
    defaultTerms: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${(import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '')}/api/settings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      const data = await res.json();
      if (data.status === 'success' && data.data.settings) {
        setSettings(data.data.settings);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`${(import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '')}/api/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(settings),
        credentials: 'include'
      });
      alert('Settings updated successfully!');
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <PageHeader title="Company Settings" description="Manage company profile." icon={Building2}>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="mr-2 h-4 w-4" /> Edit Settings
          </Button>
        )}
      </PageHeader>
      
      {!isEditing ? (
        <div className="bg-card p-6 rounded-lg border shadow-sm space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Company Name</p>
              <p className="text-base mt-1">{settings.name || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Address</p>
              <p className="text-base mt-1">{settings.address || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">GSTIN</p>
              <p className="text-base mt-1">{settings.gstin || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">PAN</p>
              <p className="text-base mt-1">{settings.pan || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Invoice Prefix</p>
              <p className="text-base mt-1">{settings.invoicePrefix || '-'}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Default Terms & Conditions</p>
            <p className="text-base mt-1 whitespace-pre-wrap">{settings.defaultTerms || '-'}</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 bg-card p-6 rounded-lg border shadow-sm">
          <div className="space-y-2">
            <label className="text-sm font-medium">Company Name</label>
            <Input 
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Address</label>
            <Input 
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">GSTIN</label>
              <Input 
                value={settings.gstin}
                onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">PAN</label>
              <Input 
                value={settings.pan}
                onChange={(e) => setSettings({ ...settings, pan: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Invoice Prefix</label>
              <Input 
                value={settings.invoicePrefix}
                onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Default Terms & Conditions</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={settings.defaultTerms}
              onChange={(e) => setSettings({ ...settings, defaultTerms: e.target.value })}
            />
          </div>
          
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
