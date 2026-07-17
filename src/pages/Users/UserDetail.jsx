import { useNavigate, useParams, Link } from "react-router-dom";
import { Edit, Mail, Phone, Shield, Clock, ToggleRight, ToggleLeft } from "lucide-react";
import { BackButton } from "../../components/ui/BackButton";
import toast from "react-hot-toast";
import { useGetUserByIdQuery, useToggleUserStatusMutation } from "../../features/users/userApi";
import { Button } from "../../components/ui/Button";

const ROLE_COLORS = {
  SuperAdmin: "bg-purple-500/10 text-purple-400",
  Admin: "bg-blue-500/10 text-blue-400",
  SalesStaff: "bg-green-500/10 text-green-400",
  WarehouseStaff: "bg-orange-500/10 text-orange-400",
  Accountant: "bg-yellow-500/10 text-yellow-400",
};

const DetailRow = ({ label, value }) => (
  <div className="flex flex-col gap-1 min-w-0">
    <p className="text-xs text-muted-foreground uppercase tracking-wide truncate">{label}</p>
    <p className="text-sm font-medium text-foreground break-words">{value || <span className="text-muted-foreground italic">Not provided</span>}</p>
  </div>
);

export const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetUserByIdQuery(id);
  const [toggleStatus, { isLoading: isToggling }] = useToggleUserStatusMutation();

  const user = data?.data?.user;

  const handleToggle = async () => {
    try {
      await toggleStatus(id).unwrap();
      toast.success(`User ${user.isActive ? "deactivated" : "activated"} successfully!`);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update status.");
    }
  };

  if (isLoading) return <div className="flex h-60 items-center justify-center text-muted-foreground">Loading user details...</div>;
  if (isError || !user) return <div className="flex h-60 items-center justify-center text-destructive">Failed to load user details.</div>;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <BackButton />
          <span className="text-muted-foreground">/</span>
          <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
        </div>
        <div className="flex gap-2">
          <Link to={`/users/${id}/edit`}>
            <Button size="sm"><Edit className="mr-2 h-4 w-4" /> Edit User</Button>
          </Link>
        </div>
      </div>

      {/* Info Card */}
      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-6">

        <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 md:grid-cols-3">
          <DetailRow label="Full Name" value={user.name} />
          <DetailRow label="Email" value={user.email} />
          <DetailRow label="Phone" value={user.phone} />
          <DetailRow label="Role" value={user.role} />
          
          {/* Interactive Status Toggle in Grid */}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Status</p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggle}
                disabled={isToggling}
                title={user.isActive ? "Click to deactivate" : "Click to activate"}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  user.isActive ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-700"
                } ${isToggling ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    user.isActive ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${user.isActive ? "text-green-600" : "text-muted-foreground"}`}>
                {user.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
          <DetailRow
            label="Member Since"
            value={new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          />
        </div>
      </div>

      <div className="flex gap-6 text-xs text-muted-foreground px-1">
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Created: {new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Updated: {new Date(user.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
      </div>
    </div>
  );
};
