@@ .. @@
 import React from 'react';
 import { useNavigate, useLocation } from 'react-router-dom';
-import { BarChart3, Users, Settings, LogOut, Plus } from 'lucide-react';
+import { BarChart3, Users, Settings, LogOut, Plus, Crown } from 'lucide-react';
 import { useAuth } from '../contexts/AuthContext';
 
 interface SidebarProps {
@@ .. @@
     { icon: BarChart3, label: 'Dashboard', path: '/dashboard' },
     { icon: Users, label: 'Profiles', path: '/profiles' },
+    { icon: Crown, label: 'Subscription', path: '/subscription' },
     { icon: Settings, label: 'Settings', path: '/settings' },
   ];