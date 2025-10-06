@@ .. @@
 interface AuthContextType {
   user: User | null;
+  userProfile: any | null;
   signIn: (email: string, password: string) => Promise<void>;
   signUp: (email: string, password: string) => Promise<void>;
   signOut: () => Promise<void>;
@@ .. @@
 
 export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
   const [user, setUser] = useState<User | null>(null);
+  const [userProfile, setUserProfile] = useState<any | null>(null);
   const [loading, setLoading] = useState(true);
 
@@ .. @@
   useEffect(() => {
     supabase.auth.getSession().then(({ data: { session } }) => {
       setUser(session?.user ?? null);
+      if (session?.user) {
+        fetchUserProfile(session.user.id);
+      }
       setLoading(false);
     });
 
     const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
       setUser(session?.user ?? null);
+      if (session?.user) {
+        fetchUserProfile(session.user.id);
+      } else {
+        setUserProfile(null);
+      }
     });
 
     return () => subscription.unsubscribe();
   }, []);
 
+  const fetchUserProfile = async (userId: string) => {
+    try {
+      const { data, error } = await supabase
+        .from('users')
+        .select('*')
+        .eq('id', userId)
+        .single();
+
+      if (error) throw error;
+      setUserProfile(data);
+    } catch (error) {
+      console.error('Error fetching user profile:', error);
+    }
+  };
+
   const signIn = async (email: string, password: string) => {
@@ .. @@
   const value = {
     user,
+    userProfile,
     signIn,
     signUp,
     signOut,