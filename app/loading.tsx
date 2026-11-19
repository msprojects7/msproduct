'use client';

import React from 'react';
import { BrandedLoadingScreen } from './components/ui/Loading';

export default function Loading() {
  return <BrandedLoadingScreen message="Loading MS Backstage..." fullScreen={true} />;
}
