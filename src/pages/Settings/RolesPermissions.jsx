import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, Plus, Edit2, Trash2 } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from "../../components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import api from '../../lib/api';
import toast from 'react-hot-toast';

export function RolesPermissions() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const rolesRes = await api.get('/roles');
      setRoles(rolesRes.data.data.roles);
    } catch (error) {
      toast.error('Failed to load roles data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (role) => {
    if (role.name === 'SuperAdmin') {
      toast.error('SuperAdmin role cannot be edited');
      return;
    }
    navigate(`/settings/roles/${role._id}`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        await api.delete(`/roles/${id}`);
        toast.success('Role deleted successfully');
        fetchData();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete role');
      }
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <PageHeader 
        title="Roles & Permissions" 
        description="Manage user roles and their granular access levels across the system." 
        icon={ShieldAlert}
      >
        <Link to="/settings/roles/new">
          <Button className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" /> Add Custom Role
          </Button>
        </Link>
      </PageHeader>

      <div className="border border-border/50 shadow-sm rounded-xl bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Role Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading roles...</TableCell></TableRow>
            ) : roles.map((role) => (
              <TableRow key={role._id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${role.color || 'bg-zinc-500/10 text-zinc-400'}`}>
                    {role.name}
                  </span>
                  {role.isSystem && <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">(System)</span>}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{role.description || '-'}</TableCell>
                <TableCell>
                  {role.name === 'SuperAdmin' ? (
                    <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md">
                      All Permissions
                    </span>
                  ) : role.permissions?.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 max-w-[400px]">
                      {role.permissions.map(perm => (
                        <span key={perm} className="text-[10px] font-mono bg-muted px-2 py-0.5 rounded-md text-muted-foreground border border-border/50">
                          {perm}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">No permissions</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(role)} disabled={role.name === 'SuperAdmin'}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete(role._id)}
                      disabled={role.isSystem}
                      className={role.isSystem ? "" : "text-destructive hover:text-destructive hover:bg-destructive/10"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!loading && roles.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No roles found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
