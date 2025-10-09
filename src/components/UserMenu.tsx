@@ .. @@
 import { useState, useRef, useEffect } from 'react';
-import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
+import { User, Settings, LogOut, ChevronDown, Crown } from 'lucide-react';
 import { useAuth } from '../contexts/AuthContext';
+import { useNavigate } from 'react-router-dom';
 
 export function UserMenu() {
-  const { user, signOut } = useAuth();
+  const { user, signOut } = useAuth();
+  const navigate = useNavigate();
   const [isOpen, setIsOpen] = useState(false);
@@ .. @@
           <div className="py-1">
+            {user?.subscription_tier !== 'player' && (
+              <button
+                onClick={() => {
+                  navigate('/upgrade');
+                  setIsOpen(false);
+                }}
+                className="flex items-center w-full px-4 py-2 text-sm text-cpn-yellow hover:bg-gray-700 transition-colors"
+              >
+                <Crown className="w-4 h-4 mr-3" />
+                Upgrade to Player Mode
+              </button>
+            )}
             <button
@@ .. @@