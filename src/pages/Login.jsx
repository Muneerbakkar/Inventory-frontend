import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { useLoginMutation } from "../features/auth/authApi";
import { setCredentials } from "../features/auth/authSlice";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Eye, EyeOff, Mail, Lock, Zap } from "lucide-react";

export const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data) => {
    try {
      setErrorMsg("");
      const result = await login(data).unwrap();
      dispatch(setCredentials({ user: result.data.user, token: result.token }));
      navigate("/");
    } catch (err) {
      setErrorMsg(err.data?.message || "Login failed");
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Panel: Login Form */}
      <div className="flex w-full flex-col justify-center px-4 py-12 sm:px-12 md:px-24 lg:w-[55%] xl:px-32">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-10 flex items-center gap-2">
            <img src="/logo.png" alt="Archie logo" className="h-10 w-10 rounded-md" />
            <span className="text-2xl font-bold tracking-tight">Archie</span>
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Log in to your account.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email address and password to log in.
          </p>

          {errorMsg && (
            <div className="mt-6 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <div className="space-y-1.5">
              <Input
                id="email"
                type="email"
                placeholder="Email address"
                className="h-12 bg-transparent border-white/10 text-foreground placeholder:text-muted-foreground/70 rounded-md px-4"
                {...register("email", { required: "Email is required" })}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="h-12 bg-transparent border-white/10 text-foreground placeholder:text-muted-foreground/70 rounded-md px-4 pr-10"
                  {...register("password", { required: "Password is required" })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              

            </div>

            <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Login"}
            </Button>
          </form>


        </div>
      </div>

      {/* Right Panel: Feature Graphic */}
      {/* Right Panel: Feature Graphic */}
      <div className="hidden lg:flex lg:w-[45%] p-4">
        <div className="relative flex w-full h-full flex-col justify-end overflow-hidden rounded-[2rem] bg-[#00001C] shadow-2xl">
          
          {/* Background Decorative Circles */}
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-foreground/5 blur-3xl"></div>
          <div className="absolute bottom-12 -left-24 h-80 w-80 rounded-full bg-foreground/5 blur-3xl"></div>
          
          {/* Floating Tilted Square */}
          <div className="absolute top-12 left-16 h-40 w-40 rounded-3xl border border-foreground/10 bg-foreground/5 rotate-12 backdrop-blur-sm"></div>

          {/* Pure CSS Abstract Dashboard Illustration */}
          <div className="absolute inset-0 flex items-center justify-center p-8 mb-24">
            
            <div className="relative w-full max-w-[420px] aspect-[4/3] rounded-xl border border-foreground/20 bg-foreground/10 backdrop-blur-md shadow-2xl overflow-hidden flex flex-col">
              {/* Window Header */}
              <div className="flex items-center gap-1.5 border-b border-foreground/10 bg-foreground/5 px-4 py-2.5">
                <div className="h-2.5 w-2.5 rounded-full bg-foreground/40"></div>
                <div className="h-2.5 w-2.5 rounded-full bg-foreground/40"></div>
                <div className="h-2.5 w-2.5 rounded-full bg-foreground/40"></div>
              </div>
              
              {/* Window Body */}
              <div className="flex flex-1 p-4 gap-4">
                {/* Sidebar */}
                <div className="w-[28%] rounded-lg border border-foreground/10 bg-foreground/5 p-3 flex flex-col gap-3">
                  <div className="h-2 w-3/4 rounded-full bg-foreground/40"></div>
                  <div className="h-2 w-full rounded-full bg-foreground/20"></div>
                  <div className="h-2 w-5/6 rounded-full bg-foreground/20"></div>
                  <div className="h-2 w-full rounded-full bg-foreground/20"></div>
                  <div className="mt-auto h-8 w-full rounded-md bg-foreground/20"></div>
                </div>
                
                {/* Main Content */}
                <div className="flex-1 flex flex-col gap-4">
                  {/* Chart Area */}
                  <div className="flex-[3] rounded-lg border border-foreground/10 bg-foreground/5 p-4 flex items-end justify-between gap-2.5">
                    <div className="w-full bg-foreground/30 rounded-t-sm h-[20%]"></div>
                    <div className="w-full bg-foreground/50 rounded-t-sm h-[40%]"></div>
                    <div className="w-full bg-foreground/40 rounded-t-sm h-[30%]"></div>
                    <div className="w-full bg-foreground/60 rounded-t-sm h-[65%]"></div>
                    <div className="w-full bg-foreground/80 rounded-t-sm h-[85%]"></div>
                    <div className="w-full bg-foreground/40 rounded-t-sm h-[50%]"></div>
                  </div>
                  
                  {/* Bottom Cards */}
                  <div className="flex-[2] flex gap-4">
                    <div className="flex-1 rounded-lg border border-foreground/10 bg-foreground/5 p-3 relative overflow-hidden">
                       <div className="h-2.5 w-1/2 rounded-full bg-foreground/40"></div>
                       <div className="absolute bottom-3 right-3 h-10 w-10 rounded-full bg-foreground/10"></div>
                    </div>
                    <div className="flex-1 rounded-lg border border-foreground/10 bg-foreground/5 p-3 relative overflow-hidden">
                       <div className="h-2.5 w-1/2 rounded-full bg-foreground/40"></div>
                       <div className="absolute bottom-3 right-3 h-10 w-10 rounded-full bg-foreground/10"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -right-4 top-1/2 -translate-y-1/2 h-24 w-24 rounded-3xl border border-foreground/10 bg-foreground/5 rotate-12 backdrop-blur-sm"></div>
          </div>

          {/* Graphic Overlay Text */}
          <div className="relative z-10 px-12 pb-16 text-center text-foreground">
            <h3 className="text-4xl font-bold tracking-tight mb-3">
              The easiest way to manage<br />your workflow.
            </h3>
            <p className="text-foreground/80 text-lg">
              Join the Archie community now!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
