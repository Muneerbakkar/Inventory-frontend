import { useState, useRef, useEffect } from "react";

export const AsyncSearchDropdown = ({ 
  value, 
  onChange, 
  fetchHook,
  queryOptions = {},
  placeholder, 
  emptyText,
  formatOption,
  allowClear = true,
  disabled = false,
  allowAdd = false,
  onAdd
}) => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isFetching } = fetchHook({ search: debouncedSearch, limit: 10, ...queryOptions }, { skip: disabled });
  
  // Try to find the options array from standard RTK query structures
  const optionsData = data?.data?.products || data?.data?.customers || data?.data?.suppliers || data?.data?.referrals || data?.data || [];
  
  const options = Array.isArray(optionsData) ? optionsData.map(formatOption) : [];
  const selected = options.find(o => o.value === value) || (value ? { label: "Selected...", value } : null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex min-h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm ${disabled ? 'bg-muted cursor-not-allowed opacity-70' : 'bg-background cursor-pointer hover:border-primary border-input'}`}
      >
        <span className={`block w-full break-words ${selected ? "leading-snug" : "text-muted-foreground truncate"}`}>
          {selected ? selected.label : placeholder}
        </span>
      </div>
      
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95">
          <div className="p-2 border-b">
             <input 
               autoFocus
               className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground" 
               placeholder="Search..." 
               value={search}
               onChange={(e) => setSearch(e.target.value)}
             />
          </div>
          <div className="max-h-48 overflow-auto p-1">
             {isFetching ? (
               <div className="px-2 py-2 text-sm text-muted-foreground">Loading...</div>
             ) : (
               <>
                 {allowAdd && search && !options.some(o => o.label.toLowerCase() === search.toLowerCase()) && (
                   <div 
                     className="cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground font-medium text-primary"
                     onClick={() => { if(onAdd) onAdd(search); setIsOpen(false); setSearch(""); }}
                   >
                     + Add "{search}"
                   </div>
                 )}
                 {options.length === 0 && !search && (
                   <div className="px-2 py-2 text-sm text-muted-foreground">{emptyText || "No results found"}</div>
                 )}
                 {options.map(o => (
                   <div 
                     key={o.value} 
                     className={`cursor-pointer rounded-sm px-2 py-1.5 text-sm break-words leading-snug ${o.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent hover:text-accent-foreground'}`}
                     onClick={() => {
                       if (o.disabled) return;
                       onChange(o.value, o.raw); 
                       setIsOpen(false); 
                       setSearch(""); 
                     }}
                   >
                     {o.label}
                   </div>
                 ))}
                 {allowClear && value && (
                    <div 
                     className="cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground text-red-500 mt-1 border-t"
                     onClick={() => { onChange(""); setIsOpen(false); setSearch(""); }}
                   >
                     Clear Selection
                   </div>
                 )}
               </>
             )}
          </div>
        </div>
      )}
    </div>
  );
};
