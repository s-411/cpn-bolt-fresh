@@ .. @@
 import React from 'react';
-import { Bell, Search, User } from 'lucide-react';
+import { Bell, Search, User, Crown } from 'lucide-react';
 import { useAuth } from '../contexts/AuthContext';
+import { SubscriptionStatus } from './SubscriptionStatus';
 
 interface HeaderProps {
   onAddProfile: () => void;
@@ .. @@
 
 export const Header: React.FC<HeaderProps> = ({ onAddProfile }) => {
-  const { user, signOut } = useAuth();
+  const { user, signOut, userProfile } = useAuth();
 
   return (
     <header className="bg-white border-b border-gray-200 px-6 py-4">
       <div className="flex items-center justify-between">
         <div className="flex items-center space-x-4">
           <h1 className="text-2xl font-bold text-gray-900">CPN Dashboard</h1>
+          {userProfile && (
+            <div className="hidden md:block">
+              <SubscriptionStatus
+                subscriptionTier={userProfile.subscription_tier}
+                subscriptionStatus={userProfile.subscription_status}
+                subscriptionPeriodEnd={userProfile.subscription_period_end}
+                stripePriceId={userProfile.stripe_subscription_id}
+              />
+            </div>
+          )}
         </div>
 
         <div className="flex items-center space-x-4">