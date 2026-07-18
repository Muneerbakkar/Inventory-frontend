import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShieldAlert, CheckSquare, Square } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import api from '../../lib/api';
import toast from 'react-hot-toast';

export function RoleForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [modules, setModules] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [currentRole, setCurrentRole] = useState({ 
    name: '', 
    description: '', 
    permissions: [], 
    color: 'bg-zinc-500/10 text-zinc-400' 
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch available permissions and modules
      const permsRes = await api.get('/roles/permissions');
      setAllPermissions(permsRes.data.data.permissions);
      setModules(permsRes.data.data.modules || []);

      // Fetch existing role if editing
      if (isEditing) {
        const roleRes = await api.get(`/roles/${id}`);
        setCurrentRole(roleRes.data.data.role);
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentRole.name.trim()) {
      toast.error('Role name is required');
      return;
    }
    try {
      if (isEditing) {
        await api.patch(`/roles/${id}`, currentRole);
        toast.success('Role updated successfully');
      } else {
        await api.post('/roles', currentRole);
        toast.success('Role created successfully');
      }
      navigate('/settings/roles');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save role');
    }
  };

  const togglePermission = (permission) => {
    setCurrentRole(prev => {
      const perms = prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission];
      return { ...prev, permissions: perms };
    });
  };

  const toggleModule = (moduleObj) => {
    setCurrentRole(prev => {
      const modulePerms = moduleObj.actions.map(action => `${moduleObj.name}.${action}`);
      const isAllSelected = modulePerms.every(p => prev.permissions.includes(p));
      
      let newPerms;
      if (isAllSelected) {
        // Remove all
        newPerms = prev.permissions.filter(p => !modulePerms.includes(p));
      } else {
        // Add all missing
        const toAdd = modulePerms.filter(p => !prev.permissions.includes(p));
        newPerms = [...prev.permissions, ...toAdd];
      }
      return { ...prev, permissions: newPerms };
    });
  };

  const toggleGlobalAll = () => {
    setCurrentRole(prev => {
      const isAllSelected = allPermissions.every(p => prev.permissions.includes(p));
      return {
        ...prev,
        permissions: isAllSelected ? [] : [...allPermissions]
      };
    });
  };

  const isGlobalAllSelected = allPermissions.length > 0 && allPermissions.every(p => currentRole.permissions.includes(p));

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading role data...</div>;

  return (
    <div className="space-y-6 fade-in">
      <PageHeader 
        title={isEditing ? "Edit Role" : "Add New Role"} 
        description="Configure the role name and select granular module permissions." 
        icon={ShieldAlert}
        >
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          Discard
        </Button>
      </PageHeader>

      <div className="border border-border/50 shadow-sm rounded-xl bg-card">
        <div className="p-3 sm:p-6 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h3 className="text-xl font-semibold">Role Configuration</h3>
          </div>
          <Button variant="outline" size="sm" onClick={toggleGlobalAll} className="gap-2 w-full sm:w-auto">
            {isGlobalAllSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
            {isGlobalAllSelected ? 'Deselect All' : 'Select All'}
          </Button>
        </div>
        <div className="p-3 sm:p-6 space-y-5 sm:space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Role Name</label>
              <Input 
                value={currentRole.name} 
                onChange={(e) => setCurrentRole({ ...currentRole, name: e.target.value })}
                disabled={currentRole.isSystem}
                placeholder="e.g. Regional Manager"
              />
              {currentRole.isSystem && <p className="text-xs text-muted-foreground">System role names cannot be changed.</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input 
                value={currentRole.description} 
                onChange={(e) => setCurrentRole({ ...currentRole, description: e.target.value })}
                placeholder="Brief description of this role"
              />
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <label className="text-sm font-medium border-b pb-2 block">Module Permissions</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 pt-2">
              {modules.map(mod => {
                const modPerms = mod.actions.map(a => `${mod.name}.${a}`);
                const isAllModSelected = modPerms.every(p => currentRole.permissions.includes(p));
                
                return (
                  <div key={mod.name} className="border border-border/50 rounded-xl overflow-hidden bg-card/50 shadow-sm flex flex-col">
                    <div className="bg-muted/30 p-3 border-b border-border/50 flex items-center justify-between">
                      <span className="font-semibold text-sm">{mod.name}</span>
                      <label className="flex items-center gap-2 text-xs font-medium cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                        <input 
                          type="checkbox"
                          className="rounded border-gray-300 text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                          checked={isAllModSelected}
                          onChange={() => toggleModule(mod)}
                        />
                        All
                      </label>
                    </div>
                    <div className="p-2 sm:p-3 flex-1 flex flex-col gap-1.5 sm:gap-2">
                      {['create', 'read', 'update', 'delete'].map(action => {
                        const hasAction = mod.actions.includes(action);
                        if (!hasAction) return null;

                        const permString = `${mod.name}.${action}`;
                        const isChecked = currentRole.permissions.includes(permString);
                        
                        return (
                          <label key={action} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors border border-transparent hover:border-border/50 group">
                            <span className="text-sm capitalize text-muted-foreground group-hover:text-foreground transition-colors">{action}</span>
                            <input 
                              type="checkbox"
                              className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                              checked={isChecked}
                              onChange={() => togglePermission(permString)}
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => navigate('/settings/roles')}>Cancel</Button>
            <Button onClick={handleSave}>Save Role</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
