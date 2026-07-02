/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import * as Icons from 'lucide-react';

interface DynamicIconProps {
  name: string;
  className?: string;
  size?: number;
}

export default function DynamicIcon({ name, className = '', size = 20 }: DynamicIconProps) {
  // Safe lookup with robust capitalization & fallback
  const LucideIcon = (Icons as any)[name] || (Icons as any)[name.charAt(0).toUpperCase() + name.slice(1)] || Icons.HelpCircle;
  
  return <LucideIcon className={className} size={size} />;
}
